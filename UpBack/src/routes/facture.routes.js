import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import { withTransaction } from "../utils/transaction.js";
import { parseDateInput, dayOf, formatFr, formatFrDay } from "../utils/dates.js";
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
import {
  borderedTable,
  cell,
  formatAmount,
  headerCell,
  pageDocument,
  relativeWidths,
  sendPdf,
  signatures,
} from "../utils/pdf.js";

const router = Router();

// The .NET DELETE deletFacture route (no auth, deleted every facture) is
// deliberately not ported.

router.use(requireAuth);

// A delivery invoiced to the client: raises the client's balance and the
// products' stock, and logs each product in the client's historique.
router.post("/Add", async (req, res, next) => {
  try {
    const code = requireText(req.body?.CodeClient, "Le code client est obligatoire.");
    const numero = requireText(req.body?.Facture, "Le numéro de facture est obligatoire.");
    const montant = requireAmount(req.body?.Montant, "Montant invalide.");
    if (montant < 0) throw httpError(400, "Le montant ne peut pas être négatif.");
    const distributeur = requireText(
      req.body?.distribiteur,
      "Le distributeur est obligatoire."
    );
    const date = parseDateInput(req.body?.date, "date");
    const lines = parseProductLines(req.body?.StockProduitdto);

    await withTransaction(async (conn) => {
      const client = await getClientByCode(conn, code);
      const commercial = await getCurrentCommercial(conn, req.user);
      const portefeuille = await getPortefeuilleByCode(conn, code);
      const produits = await getProduitsByName(conn, lines.map((l) => l.name));

      await conn.query(
        `INSERT INTO Factures (date, clientName, Adress, Code, facture, Montant, distributeur, ClientId)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [date, client.Respnsible_Name, client.Zone, code, numero, montant, distributeur, client.Id]
      );

      // PricePayer moves with PriceCompta: .NET left it behind, so the
      // amount owed no longer matched the balance after each facture.
      await conn.query(
        `UPDATE portFeuilleClients
         SET PriceCompta = COALESCE(PriceCompta, 0) + ?,
             PricePayer = COALESCE(PricePayer, 0) + ?,
             LastPrise = ?, depot = ?
         WHERE Id = ?`,
        [montant, montant, montant, date, portefeuille.Id]
      );

      for (const { name, quantity } of lines) {
        const produit = findProduit(produits, name);
        await conn.query(
          "UPDATE Produits SET StockActuel = StockActuel + ?, stock = stock + ? WHERE Id = ?",
          [quantity, quantity, produit.Id]
        );
        // .NET never set Delivery_date here, so every historique line was
        // dated 01/01/0001. The facture date is the delivery date.
        await conn.query(
          `INSERT INTO Historiques (NameProduit, Quantite, Delivery_date, Montant, distributeur, ClientId)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [produit.Name, quantity, date, produit.PrixActuel * quantity, commercial.Nom, client.Id]
        );
      }

      await refreshProduitPercentages(conn);
    });

    res.status(201).json({ message: "Facture enregistrée." });
  } catch (err) {
    next(err);
  }
});

// "Suivi des factures" PDF for one day, same layout as the .NET one.
router.get("/GenerateFacturePdf", async (req, res, next) => {
  try {
    const date = parseDateInput(req.query.FactureDate, "FactureDate");
    const day = dayOf(date);
    const [factures] = await pool.query(
      `SELECT date, clientName, Adress, Code, facture, Montant, distributeur
       FROM Factures WHERE date >= ? AND date < ? + INTERVAL 1 DAY ORDER BY Id`,
      [day, day]
    );
    if (!factures.length) {
      throw httpError(404, "Aucune facture trouvée pour cette date.");
    }

    const fs = 8;
    const header = [
      "Date",
      "Client",
      "Adresse",
      "Code",
      "Numéro de facture",
      "Montant",
      "Distributeur",
    ].map((t) => headerCell(t, 9));
    const rows = factures.map((f) => [
      cell(formatFr(f.date), fs),
      cell(f.clientName, fs),
      cell(f.Adress, fs),
      cell(f.Code, fs),
      cell(f.facture, fs),
      cell(formatAmount(f.Montant), fs, "right"),
      cell(f.distributeur, fs),
    ]);
    const widths = relativeWidths([1.2, 2, 2, 1, 1.5, 1.2, 1.5], {
      landscape: false,
      padding: 4,
    });

    await sendPdf(
      res,
      pageDocument({
        title: "SUIVI DES FACTURES",
        subtitle: formatFrDay(date),
        landscape: false,
        content: [
          borderedTable(widths, header, rows, 4),
          signatures(
            ["Responsable Commercial", "Comptable", "Directeur Général"],
            { landscape: false }
          ),
        ],
      }),
      `Etats_${day.replaceAll("-", "")}.pdf`
    );
  } catch (err) {
    next(err);
  }
});

export default router;
