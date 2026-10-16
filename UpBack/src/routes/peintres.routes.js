import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Table created by sql/001_create_peintres.sql — not part of the .NET
// backend, so this resource only exists on UpBack.

const PHONE_PATTERN = /^\+?\d{6,20}$/;

// Spaces, dots and dashes are stripped so "22 33-44.55" and "22334455"
// hit the same UNIQUE index instead of creating a duplicate painter.
function normalizePhone(value) {
  return String(value ?? "").replace(/[\s.-]/g, "");
}

const SELECT_COLUMNS =
  "Id AS id, Nom AS nom, Telephone AS telephone, Telephone2 AS telephone2, CreatedAt AS createdAt";

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM Peintres ORDER BY Nom`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const nom = String(req.body?.nom ?? "").trim();
    const telephone = normalizePhone(req.body?.telephone);
    const telephone2 = normalizePhone(req.body?.telephone2) || null;

    if (!nom || nom.length > 255) {
      return res.status(400).json({ message: "Le nom est obligatoire." });
    }
    if (!PHONE_PATTERN.test(telephone)) {
      return res
        .status(400)
        .json({ message: "Numéro de téléphone invalide." });
    }
    if (telephone2 && !PHONE_PATTERN.test(telephone2)) {
      return res
        .status(400)
        .json({ message: "Deuxième numéro de téléphone invalide." });
    }
    if (telephone2 === telephone) {
      return res
        .status(400)
        .json({ message: "Les deux numéros sont identiques." });
    }

    const [result] = await pool.query(
      "INSERT INTO Peintres (Nom, Telephone, Telephone2) VALUES (?, ?, ?)",
      [nom, telephone, telephone2]
    );
    const [rows] = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM Peintres WHERE Id = ?`,
      [result.insertId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Un peintre avec ce numéro existe déjà." });
    }
    next(err);
  }
});

export default router;
