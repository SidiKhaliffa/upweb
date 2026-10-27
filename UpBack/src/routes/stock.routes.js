import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import { withTransaction } from "../utils/transaction.js";
import { parseDateInput, dayOf, toNetDateTime } from "../utils/dates.js";
import {
  getCurrentCommercial,
  getClientByCode,
  getPortefeuilleByCode,
  getProduitsByName,
  findProduit,
  parseProductLines,
  requireText,
  requireAmount,
  refreshProduitPercentages,
} from "../utils/business.js";

const router = Router();

// The .NET StockController also exposed DELETE routes that wiped every
// stock, recette and portefeuille without authentication. They are
// deliberately not ported.

router.use(requireAuth);

router.get("/Produits", async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      "SELECT Name AS name FROM Produits ORDER BY Id"
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// One StockVisites row: the count of one product at this visit, and what
// was sold since the previous one (stock then + delivered since - stock
// now). Unknown (NULL) on the first count or for a back-dated visit.
async function visitHistoryRow(conn, { client, produit, prevVisit, visitDate, current, quantity }) {
  const row = {
    ClientId: client.Id,
    ProduitId: produit.Id,
    VisitDate: visitDate,
    PrevVisitDate: prevVisit,
    StockAvant: current ? current.Quantite : null,
    Livre: 0,
    StockCompte: quantity,
    Vendu: null,
  };
  if (!current || !prevVisit || visitDate <= toNetDateTime(prevVisit).replace("T", " ")) return row;

  const [[{ livre }]] = await conn.query(
    `SELECT COALESCE(SUM(Quantite), 0) AS livre FROM Historiques
     WHERE ClientId = ? AND NameProduit = ? AND Delivery_date > ? AND Delivery_date <= ?`,
    [client.Id, produit.Name, prevVisit, visitDate]
  );
  row.Livre = Number(livre);
  row.Vendu = row.StockAvant + row.Livre - quantity;
  return row;
}

// The StockVisites table comes from sql/003_create_stock_visites.sql.
// Until it is created, visits are saved without their history rather
// than failing.
async function saveVisitHistory(conn, rows) {
  if (!rows.length) return;
  try {
    await conn.query(
      `INSERT INTO StockVisites
         (ClientId, ProduitId, VisitDate, PrevVisitDate, StockAvant, Livre, StockCompte, Vendu)
       VALUES ?`,
      [rows.map((r) => [r.ClientId, r.ProduitId, r.VisitDate, r.PrevVisitDate, r.StockAvant, r.Livre, r.StockCompte, r.Vendu])]
    );
  } catch (err) {
    if (err.code !== "ER_NO_SUCH_TABLE") throw err;
    console.warn("StockVisites table missing: run sql/003_create_stock_visites.sql");
  }
}

// "Ajouter stock client": records what is left at the client on this
// visit, and the value of that stock in the portefeuille.
router.post("/update", async (req, res, next) => {
  try {
    const code = requireText(req.body?.CodeClient, "Le code client est obligatoire.");
    const visitDate = parseDateInput(req.body?.Visit_date, "Visit_date");
    const description = req.body?.Description ?? null;
    const lines = parseProductLines(req.body?.StockProduitdto);
    const names = lines.map((l) => l.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      throw httpError(400, "Un même produit apparaît plusieurs fois.");
    }

    await withTransaction(async (conn) => {
      const client = await getClientByCode(conn, code);
      await getCurrentCommercial(conn, req.user);

      await conn.query(
        "UPDATE Clients SET Visit_Date = ?, Description = COALESCE(?, Description) WHERE Id = ?",
        [visitDate, description, client.Id]
      );

      const [stocks] = await conn.query(
        "SELECT Id FROM Stocks WHERE ClientId = ? ORDER BY Id LIMIT 1 FOR UPDATE",
        [client.Id]
      );
      let stockId = stocks[0]?.Id;
      if (!stockId) {
        const [inserted] = await conn.query(
          "INSERT INTO Stocks (Quantity, Produit_Vendue, PrixDeVenteTotal, ClientId) VALUES (0, 0, 0, ?)",
          [client.Id]
        );
        stockId = inserted.insertId;
      }

      const produits = await getProduitsByName(conn, lines.map((l) => l.name));
      const [existingRows] = await conn.query(
        "SELECT ProduitId, Quantite FROM StockProduits WHERE StockId = ? FOR UPDATE",
        [stockId]
      );
      const existing = new Map(existingRows.map((r) => [r.ProduitId, r]));

      // Previous visit: what was counted then, plus what was delivered
      // since, minus what is counted now, is what the client sold.
      const prevVisit =
        client.Visit_Date && client.Visit_Date.getUTCFullYear() > 1900 ? client.Visit_Date : null;
      const history = [];

      let stockValue = 0;
      for (const { name, quantity } of lines) {
        const produit = findProduit(produits, name);
        const value = produit.PrixActuel * quantity;
        const current = existing.get(produit.Id);
        history.push(
          await visitHistoryRow(conn, { client, produit, prevVisit, visitDate, current, quantity })
        );
        if (current) {
          await conn.query(
            "UPDATE StockProduits SET Quantite = ?, prix_actuell = ? WHERE StockId = ? AND ProduitId = ?",
            [quantity, value, stockId, produit.Id]
          );
        } else {
          await conn.query(
            "INSERT INTO StockProduits (StockId, ProduitId, Quantite, prix_vent, prix_actuell) VALUES (?, ?, ?, 0, ?)",
            [stockId, produit.Id, quantity, value]
          );
        }
        stockValue += value;
      }

      await conn.query("UPDATE Stocks SET Quantity = ? WHERE Id = ?", [
        lines.reduce((sum, l) => sum + l.quantity, 0),
        stockId,
      ]);

      // .NET did "PricePayer += PriceCompta - previousStockValue", which
      // grew the amount owed on every visit. The amount owed is the
      // balance minus the stock still at the client.
      await conn.query(
        `UPDATE portFeuilleClients
         SET visit = ?, Date_RDV = COALESCE(?, Date_RDV),
             currentPrice = ?, PricePayer = COALESCE(PriceCompta, 0) - ?
         WHERE Code = ?`,
        [visitDate, description, stockValue, stockValue, code]
      );

      await saveVisitHistory(conn, history);

      // Also recomputes Produits.StockActuel from the new counts.
      await refreshProduitPercentages(conn);
    });

    res.json({ message: "Stock client mis à jour." });
  } catch (err) {
    next(err);
  }
});

// "Modifier balance de tier": sets the client's balance.
router.post("/PriseCompta", async (req, res, next) => {
  try {
    const code = requireText(req.body?.CodeClient, "Le code client est obligatoire.");
    const amount = requireAmount(req.body?.priseCompta, "Montant invalide.");

    await withTransaction(async (conn) => {
      const portefeuille = await getPortefeuilleByCode(conn, code, { required: false });
      if (portefeuille) {
        await conn.query(
          "UPDATE portFeuilleClients SET PriceCompta = ?, PricePayer = ? - COALESCE(currentPrice, 0) WHERE Id = ?",
          [amount, amount, portefeuille.Id]
        );
        return;
      }
      const client = await getClientByCode(conn, code);
      const commercial = await getCurrentCommercial(conn, req.user);
      await conn.query(
        `INSERT INTO portFeuilleClients
           (Code, name, zone, phone, CommercantId, PriceCompta, currentPrice, LastPrise, PricePayer)
         VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?)`,
        [
          client.Code,
          client.Respnsible_Name,
          client.Zone,
          client.Phone_Number,
          commercial.Id,
          amount,
          amount,
        ]
      );
    });

    res.json({ message: "Balance mise à jour." });
  } catch (err) {
    next(err);
  }
});

// A payment received from the client: lowers the balance and is logged.
router.post("/recette", async (req, res, next) => {
  try {
    const code = requireText(req.body?.CodeClient, "Le code client est obligatoire.");
    const amount = requireAmount(req.body?.priseCompta, "Montant invalide.");
    if (amount <= 0) throw httpError(400, "Le montant doit être positif.");
    const date = parseDateInput(req.body?.Recette_Date, "Recette_Date");

    await withTransaction(async (conn) => {
      const client = await getClientByCode(conn, code);
      const portefeuille = await getPortefeuilleByCode(conn, code);

      // Same double-submit guard as .NET, but reported instead of
      // answering "succès" without saving anything.
      const [duplicates] = await conn.query(
        "SELECT 1 FROM HistoriqueRecettes WHERE CodeClient = ? AND Recette = ? AND DATE(Date) = ? LIMIT 1",
        [code, amount, dayOf(date)]
      );
      if (duplicates.length) {
        throw httpError(409, "Cette recette est déjà enregistrée pour ce client à cette date.");
      }

      await conn.query(
        `UPDATE portFeuilleClients
         SET PriceCompta = COALESCE(PriceCompta, 0) - ?, PricePayer = COALESCE(PricePayer, 0) - ?
         WHERE Id = ?`,
        [amount, amount, portefeuille.Id]
      );
      await conn.query(
        "INSERT INTO HistoriqueRecettes (Date, Name, CodeClient, Recette) VALUES (?, ?, ?, ?)",
        [date, client.Respnsible_Name, code, amount]
      );
    });

    res.json({ message: "Recette enregistrée." });
  } catch (err) {
    next(err);
  }
});

router.get("/RecetteHistorique", async (req, res, next) => {
  try {
    const day = dayOf(parseDateInput(req.query.date, "date"));
    const [rows] = await pool.query(
      `SELECT Date, Name, CodeClient, Recette FROM HistoriqueRecettes
       WHERE Date >= ? AND Date < ? + INTERVAL 1 DAY ORDER BY Date, Id`,
      [day, day]
    );
    res.json(
      rows.map((r) => ({
        date: toNetDateTime(r.Date),
        name: r.Name,
        codeClient: r.CodeClient,
        recette: r.Recette,
      }))
    );
  } catch (err) {
    next(err);
  }
});

export default router;
