import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import { withTransaction } from "../utils/transaction.js";
import { parseDateInput, dayOf, formatFrDay } from "../utils/dates.js";
import {
  getClientByCode,
  getPortefeuilleByCode,
  getProduitsByName,
  findProduit,
  parseProductLines,
  requireText,
} from "../utils/business.js";
import {
  borderedTable,
  cell,
  formatAmount,
  formatNumber,
  headerCell,
  pageDocument,
  relativeWidths,
  sendPdf,
  signatures,
  spanFill,
  totalCell,
} from "../utils/pdf.js";

const router = Router();

router.use(requireAuth);

// One Commands row per product. Like .NET, only the first row carries the
// client details, so the PDF lists them once per order.
router.post("/", async (req, res, next) => {
  try {
    const code = requireText(req.body?.CodeClient, "Le code client est obligatoire.");
    const date = parseDateInput(req.body?.Command_date, "Command_date");
    const cash = req.body?.cach || null;
    const lines = parseProductLines(req.body?.StockCommanddto, "StockCommanddto");
    if (!lines.length || lines.some((l) => l.quantity === 0)) {
      throw httpError(400, "Ajoutez au moins un produit avec une quantité.");
    }

    await withTransaction(async (conn) => {
      const client = await getClientByCode(conn, code);
      const portefeuille = await getPortefeuilleByCode(conn, code);
      const [commerces] = await conn.query(
        "SELECT Nom FROM Commerces WHERE Id = ?",
        [client.CommercantId]
      );
      const [stocks] = await conn.query(
        "SELECT Quantity, Produit_Vendue FROM Stocks WHERE ClientId = ? ORDER BY Id LIMIT 1",
        [client.Id]
      );
      const produits = await getProduitsByName(conn, lines.map((l) => l.name));

      for (const [i, { name, quantity }] of lines.entries()) {
        const produit = findProduit(produits, name);
        const row = {
          produit: produit.Name,
          Qte: quantity,
          poids: produit.poid,
          // .NET multiplied by a "poid" UpFront never sends, so the total
          // weight was always 0. The product's weight is the right one.
          TotalPoids: quantity * produit.poid,
          Command_Date: date,
        };
        if (i === 0) {
          Object.assign(row, {
            Code: code,
            client: client.Respnsible_Name,
            distrubitaire: commerces[0]?.Nom ?? null,
            A_Payer: (portefeuille.PriceCompta ?? 0) - (portefeuille.currentPrice ?? 0),
            Cach: cash,
            phone: client.Phone_Number,
            Zone: client.Zone,
            Valeur_Stock: stocks[0]?.Quantity ?? 0,
            Produit_Vendue: stocks[0]?.Produit_Vendue ?? 0,
          });
        }
        await conn.query("INSERT INTO Commands SET ?", [row]);
      }
    });

    res.status(201).json({ message: "Commande enregistrée." });
  } catch (err) {
    next(err);
  }
});

// "Tableau de commandes" PDF for one day, same layout as the .NET one.
router.get("/GenerateCommandPdf", async (req, res, next) => {
  try {
    const date = parseDateInput(req.query.commandDate, "commandDate");
    const day = dayOf(date);
    const [commands] = await pool.query(
      `SELECT * FROM Commands
       WHERE Command_Date >= ? AND Command_Date < ? + INTERVAL 1 DAY ORDER BY Id`,
      [day, day]
    );
    if (!commands.length) {
      throw httpError(404, "Aucune commande trouvée pour cette date.");
    }

    const fs = 7;
    const header = [
      "Distributeur",
      "Client",
      "Produits",
      "Qté",
      "Poids",
      "Total Poids",
      "Produit Vendu",
      "Zone",
      "Codes",
      "Cash",
      "Téléphone",
      "A PAYER",
    ].map((t) => headerCell(t, 8));
    const rows = commands.map((c) => [
      cell(c.distrubitaire, fs),
      cell(c.client, fs),
      cell(c.produit, fs),
      cell(formatNumber(c.Qte), fs, "right"),
      cell(formatNumber(c.poids), fs, "right"),
      cell(formatNumber(c.TotalPoids), fs, "right"),
      cell(c.Produit_Vendue == null ? "" : formatNumber(c.Produit_Vendue), fs, "right"),
      cell(c.Zone, fs),
      cell(c.Code, fs),
      cell(c.Cach, fs),
      cell(c.phone, fs),
      cell(formatAmount(c.A_Payer), fs, "right"),
    ]);
    const totalPoids = commands.reduce((sum, c) => sum + c.TotalPoids, 0);
    rows.push([
      totalCell("TOTAL", 9, { colSpan: 5 }),
      ...spanFill(4),
      totalCell(formatNumber(totalPoids), 9),
      ...Array.from({ length: 6 }, () => totalCell("", 9)),
    ]);
    const widths = relativeWidths([1.5, 1.5, 1.5, 0.8, 0.8, 1, 1, 1, 1, 1, 1.2, 1], {
      landscape: true,
      padding: 3,
    });

    await sendPdf(
      res,
      pageDocument({
        title: "TABLEAU DE COMMANDES",
        subtitle: formatFrDay(date),
        landscape: true,
        content: [
          borderedTable(widths, header, rows, 3),
          signatures(["Responsable Commercial", "Directeur Général"], {
            landscape: true,
          }),
        ],
      }),
      `CommandDetails_${day.replaceAll("-", "")}.pdf`
    );
  } catch (err) {
    next(err);
  }
});

export default router;
