import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import { formatFr } from "../utils/dates.js";
import {
  borderedTable,
  cell,
  formatAmount,
  formatNumber,
  headerCell,
  pageDocument,
  relativeWidths,
  sendPdf,
  spanFill,
  totalCell,
} from "../utils/pdf.js";
import { produitOrder } from "../utils/business.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT Id AS id, Nom AS nom, Telephone AS telephone FROM Commerces ORDER BY Id"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

async function getCommercialFromQuery(req) {
  const id = Number(req.query.idcomerce);
  if (!Number.isInteger(id)) throw httpError(400, "Commercial invalide.");
  const [rows] = await pool.query("SELECT Id, Nom FROM Commerces WHERE Id = ?", [id]);
  if (!rows.length) throw httpError(404, `Commercial ${id} introuvable.`);
  return rows[0];
}

// Value of the stock currently at each client, by client code.
async function getStockValues(codes) {
  if (!codes.length) return new Map();
  const [rows] = await pool.query(
    `SELECT c.Code, SUM(sp.Quantite * p.PrixActuel) AS value
     FROM Clients c
     JOIN Stocks s ON s.ClientId = c.Id
     JOIN StockProduits sp ON sp.StockId = s.Id
     JOIN Produits p ON p.Id = sp.ProduitId
     WHERE c.Code IN (?)
     GROUP BY c.Code`,
    [codes]
  );
  return new Map(rows.map((r) => [r.Code, r.value]));
}

const today = () => new Date();
const compactDate = (date) => date.toISOString().slice(0, 10).replaceAll("-", "");

// "Recette" PDF of one commercial. .NET loaded the portefeuilles of every
// commercial whatever the one requested; this one only lists theirs.
router.get("/GenerateRecettePdf", async (req, res, next) => {
  try {
    const commercial = await getCommercialFromQuery(req);
    const [portefeuilles] = await pool.query(
      `SELECT p.* FROM portFeuilleClients p
       JOIN Clients c ON c.Code = p.Code
       WHERE p.CommercantId = ? ORDER BY p.Id`,
      [commercial.Id]
    );
    if (!portefeuilles.length) {
      throw httpError(404, "Aucune recette trouvée pour ce commercial.");
    }

    const codes = portefeuilles.map((p) => p.Code);
    const stockValues = await getStockValues(codes);
    const [recettes] = await pool.query(
      `SELECT CodeClient, Recette FROM HistoriqueRecettes
       WHERE CodeClient IN (?) ORDER BY Date DESC, Id DESC`,
      [codes]
    );
    const lastRecette = new Map();
    for (const r of recettes) {
      if (!lastRecette.has(r.CodeClient)) lastRecette.set(r.CodeClient, r.Recette);
    }

    const fs = 7;
    let balanceTotal = 0;
    let produitVenduTotal = 0;
    const rows = portefeuilles.map((p) => {
      const balance = p.PriceCompta ?? 0;
      const produitVendu = balance - (stockValues.get(p.Code) ?? 0);
      balanceTotal += balance;
      produitVenduTotal += produitVendu;
      return [
        cell(formatFr(p.visit), fs),
        cell(formatFr(p.depot), fs),
        cell(p.Code, fs),
        cell(p.name, fs),
        cell(p.zone, fs),
        cell(p.phone, fs),
        cell(formatAmount(p.PriceCompta), fs, "right"),
        cell(formatAmount(produitVendu), fs, "right"),
        cell(formatAmount(lastRecette.get(p.Code)), fs, "right"),
        cell(p.Date_RDV, fs),
      ];
    });
    rows.push([
      totalCell("TOTAL", 9, { colSpan: 6 }),
      ...spanFill(5),
      totalCell(balanceTotal > 0 ? formatNumber(balanceTotal) : "", 9),
      totalCell(produitVenduTotal > 0 ? formatNumber(produitVenduTotal) : "", 9),
      totalCell("", 9, { colSpan: 2 }),
      ...spanFill(1),
    ]);
    const header = [
      "Date de visit",
      "Date de LVR",
      "Codes",
      "Client",
      "Zone",
      "Tel",
      "Balances de tiers",
      "Produit vendus",
      "Recette du jour",
      "Date RDV",
    ].map((t) => headerCell(t, 8));
    const widths = relativeWidths([1.2, 1.2, 1, 2, 1, 1.5, 1.3, 1.3, 1.3, 1.2], {
      landscape: true,
      padding: 3,
    });

    const now = today();
    await sendPdf(
      res,
      pageDocument({
        title: `Recette ${commercial.Nom}`,
        subtitle: formatFr(now),
        landscape: true,
        content: [borderedTable(widths, header, rows, 3)],
      }),
      `Recette_${commercial.Nom}_${compactDate(now)}.pdf`
    );
  } catch (err) {
    next(err);
  }
});

// "Fiche de suivi mouvement quincaillerie": one table per client with a
// stock, listing every product. Filtered on the requested commercial,
// which .NET did not do either.
router.get("/GenerateRecapPdf", async (req, res, next) => {
  try {
    const commercial = await getCommercialFromQuery(req);
    const [clients] = await pool.query(
      `SELECT c.Id, c.Code, c.Respnsible_Name, c.Zone, c.Visit_Date, c.Delivery_Date,
              s.Id AS StockId, p.PriceCompta
       FROM Clients c
       JOIN Stocks s ON s.Id = (SELECT MIN(Id) FROM Stocks WHERE ClientId = c.Id)
       LEFT JOIN portFeuilleClients p ON p.Code = c.Code
       WHERE c.CommercantId = ? ORDER BY c.Id`,
      [commercial.Id]
    );
    if (!clients.length) {
      throw httpError(404, "Aucun stock client trouvé pour ce commercial.");
    }

    const [produits] = await pool.query(
      `SELECT p.Id, p.Name, p.PrixActuel FROM Produits p ORDER BY ${produitOrder("p")}`
    );
    const [stockProduits] = await pool.query(
      "SELECT StockId, ProduitId, Quantite FROM StockProduits WHERE StockId IN (?)",
      [clients.map((c) => c.StockId)]
    );
    const quantities = new Map(
      stockProduits.map((sp) => [`${sp.StockId}:${sp.ProduitId}`, sp.Quantite])
    );

    const fs = 6;
    const header = [
      "Depot",
      "Visite",
      "Code Client",
      "Client",
      "Zone",
      "Produit",
      "STK Actuel",
      "Prix Vent",
      "Valeur Actuel",
      "Montant Compta",
      "Montant a payer",
    ].map((t) => headerCell(t, 7));
    const widths = relativeWidths([1, 1, 1, 1.5, 1, 1.5, 1, 1, 1.2, 1.2, 1.2], {
      landscape: true,
      padding: 2,
    });

    const content = clients.map((c) => {
      let valeurActuelle = 0;
      const rows = produits.map((produit) => {
        const quantity = quantities.get(`${c.StockId}:${produit.Id}`);
        const valeur = quantity == null ? null : quantity * produit.PrixActuel;
        valeurActuelle += valeur ?? 0;
        return [
          cell(formatFr(c.Delivery_Date), fs),
          cell(formatFr(c.Visit_Date), fs),
          cell(c.Code, fs),
          cell(c.Respnsible_Name, fs),
          cell(c.Zone, fs),
          cell(produit.Name, fs),
          cell(quantity == null ? "" : formatNumber(quantity), fs, "right"),
          cell(formatAmount(produit.PrixActuel), fs, "right"),
          cell(formatAmount(valeur), fs, "right"),
          cell("", fs),
          cell("", fs),
        ];
      });
      const hasPortefeuille = c.PriceCompta !== null;
      rows.push([
        totalCell("TOTAL Valeur", 8, { colSpan: 8 }),
        ...spanFill(7),
        totalCell(valeurActuelle > 0 ? formatNumber(valeurActuelle) : "", 8),
        totalCell(hasPortefeuille ? formatNumber(c.PriceCompta) : "", 8),
        totalCell(hasPortefeuille ? formatNumber(c.PriceCompta - valeurActuelle) : "", 8),
      ]);
      return { ...borderedTable(widths, header, rows, 2), margin: [0, 0, 0, 20] };
    });

    await sendPdf(
      res,
      pageDocument({
        title: "FICHE DE SUIVI MOUVEMENT QUINCAILLERIE",
        landscape: true,
        content,
      }),
      `STOCK_CLIENT_${commercial.Nom}.pdf`
    );
  } catch (err) {
    next(err);
  }
});

export default router;
