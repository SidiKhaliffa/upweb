import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { httpError } from "../utils/httpError.js";
import { withTransaction } from "../utils/transaction.js";
import { parseDateInput, toNetDateTime } from "../utils/dates.js";
import { getCurrentCommercial, requireText } from "../utils/business.js";

const router = Router();

// Not ported from the .NET ClientsController: the unauthenticated
// DELETE deleteClient, and the one-off update_code/update_portfeuille
// fixes. UpFront only uses the creation below.

// Reads a field case-insensitively under any of its names, like .NET's
// model binding. UpFront sends "nomSociete" and "coordonneesGPS", names
// .NET never matched, so the société and GPS were silently dropped.
function pick(body, ...names) {
  const wanted = names.map((n) => n.toLowerCase());
  for (const [key, value] of Object.entries(body ?? {})) {
    if (wanted.includes(key.toLowerCase()) && value !== "") return value;
  }
  return null;
}

// Client picker in UpFront's forms: matches the code, the responsible's
// name, the société, the zone or the phone number (case and accent
// insensitive, thanks to the column collation). Codes that start with
// the text come first, then names that do.
router.get("/search", requireAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q ?? "").trim();
    if (q.length < 2) return res.json([]);
    // % and _ typed by the user are literal characters, not wildcards.
    const like = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    const [rows] = await pool.query(
      `SELECT c.Code AS code, c.Respnsible_Name AS name, c.Name_Society AS societe,
              TRIM(c.Zone) AS zone, c.Phone_Number AS phone, c.Visit_Date AS lastVisit,
              (SELECT p.PricePayer FROM portFeuilleClients p
               WHERE p.Code = c.Code ORDER BY p.Id LIMIT 1) AS solde
       FROM Clients c
       WHERE c.Code LIKE ? OR c.Respnsible_Name LIKE ? OR c.Name_Society LIKE ?
          OR c.Zone LIKE ? OR c.Phone_Number LIKE ?
       ORDER BY (c.Code = ?) DESC, (c.Code LIKE ?) DESC, (c.Respnsible_Name LIKE ?) DESC,
                c.Respnsible_Name
       LIMIT 10`,
      [`${like}%`, `%${like}%`, `%${like}%`, `%${like}%`, `%${like}%`, q, `${like}%`, `${like}%`]
    );
    res.json(
      rows.map((r) => ({
        ...r,
        lastVisit: r.lastVisit && r.lastVisit.getUTCFullYear() > 1900 ? toNetDateTime(r.lastVisit) : null,
      }))
    );
  } catch (err) {
    next(err);
  }
});

const optionalDate = (value, field) =>
  value == null ? null : parseDateInput(value, field);

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const body = req.body;
    const client = {
      Code: requireText(pick(body, "Code"), "Le code client est obligatoire."),
      Respnsible_Name: requireText(
        pick(body, "Respnsible_Name"),
        "Le nom du responsable est obligatoire."
      ),
      Phone_Number: requireText(
        pick(body, "Phone_Number"),
        "Le téléphone est obligatoire."
      ),
      Zone: requireText(pick(body, "Zone"), "La zone est obligatoire."),
      Name_Society: pick(body, "Name_Society", "nomSociete"),
      Gérant: pick(body, "Gérant", "gerant"),
      Solvabilité: pick(body, "Solvabilité", "solvabilite"),
      CoordonnéesGPS: pick(body, "CoordonnéesGPS", "coordonneesGPS"),
      Recommandation: pick(body, "Recommandation"),
      Visit_Date: optionalDate(pick(body, "Visit_Date"), "Visit_Date"),
      Delivery_Date: optionalDate(pick(body, "Delivery_Date"), "Delivery_Date"),
      Description: pick(body, "Description"),
    };

    await withTransaction(async (conn) => {
      const commercial = await getCurrentCommercial(conn, req.user);
      try {
        await conn.query("INSERT INTO Clients SET ?", [
          { ...client, CommercantId: commercial.Id },
        ]);
        // Every client gets an empty portefeuille, as in .NET.
        await conn.query(
          `INSERT INTO portFeuilleClients
             (Code, name, zone, phone, CommercantId, PriceCompta, currentPrice, LastPrise, PricePayer)
           VALUES (?, ?, ?, ?, ?, 0, 0, 0, 0)`,
          [
            client.Code,
            client.Respnsible_Name,
            client.Zone,
            client.Phone_Number,
            commercial.Id,
          ]
        );
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          throw httpError(409, "Un client avec ce code existe déjà.");
        }
        throw err;
      }
    });

    res.status(201).json({ message: "Client inscrit." });
  } catch (err) {
    next(err);
  }
});

export default router;
