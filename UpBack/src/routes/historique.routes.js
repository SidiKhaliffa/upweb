import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import { toNetDateTime } from "../utils/dates.js";
import { requireText } from "../utils/business.js";

const router = Router();

// The .NET DELETE delete / deleteHisorique routes (no auth, wiped every
// historique) are deliberately not ported.

// .NET's default DateTime, used for the "Chiffre D'affaire" total row.
const NO_DATE = "0001-01-01T00:00:00";

router.get("/", requireAuth, async (req, res, next) => {
  try {
    // UpFront sends ?codeclient=, .NET bound it case-insensitively.
    const code = requireText(
      req.query.codeClient ?? req.query.codeclient,
      "Le code client est obligatoire."
    );
    const [clients] = await pool.query(
      "SELECT Id FROM Clients WHERE Code = ?",
      [code]
    );
    if (!clients.length) throw httpError(404, "Client introuvable.");

    const [rows] = await pool.query(
      `SELECT NameProduit, Quantite, Montant, Delivery_date, distributeur
       FROM Historiques WHERE ClientId = ? ORDER BY Id`,
      [clients[0].Id]
    );
    const historique = rows.map((h) => ({
      produit: h.NameProduit,
      quantite: h.Quantite,
      montant: h.Montant,
      date: toNetDateTime(h.Delivery_date),
      commercial: h.distributeur,
    }));
    historique.push({
      produit: "Chiffre D'affaire",
      quantite: 0,
      montant: rows.reduce((sum, h) => sum + h.Montant, 0),
      date: NO_DATE,
      commercial: null,
    });
    res.json(historique);
  } catch (err) {
    next(err);
  }
});

export default router;
