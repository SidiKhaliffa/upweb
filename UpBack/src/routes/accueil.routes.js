import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { ROLE_CLAIM } from "../utils/jwt.js";
import { parseDateInput, dayOf, toNetDateTime } from "../utils/dates.js";

const router = Router();

// A client not visited for this many days shows up in "clients à visiter";
// overdue clients come first, then those never visited.
const VISIT_DELAY_DAYS = 30;
// How many recettes the home page lists (clients that owe money and
// clients to visit are all listed).
const LIST_SIZE = 5;

const isAdmin = (user) => {
  const roles = user?.[ROLE_CLAIM];
  return Array.isArray(roles) ? roles.includes("Admin") : roles === "Admin";
};

// Home page figures for one day (?date=YYYY-MM-DD, the user's local day;
// defaults to today in UTC, which is Mauritania's time). A commercial sees
// their own clients; an admin, or an account with no commercial, sees all.
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const day = dayOf(
      req.query.date
        ? parseDateInput(req.query.date, "date")
        : new Date().toISOString().slice(0, 10) + " 00:00:00"
    );

    const [commerces] = await pool.query("SELECT Id, Nom FROM Commerces WHERE Nom = ? LIMIT 1", [
      req.user?.unique_name ?? "",
    ]);
    const commercial = !isAdmin(req.user) && commerces.length ? commerces[0] : null;
    // Appended to queries on a table aliased "c" (Clients) or "p"
    // (portFeuilleClients), both of which carry CommercantId.
    // The id comes from the database and is an integer, so it is inlined.
    const scope = (alias) => (commercial ? ` AND ${alias}.CommercantId = ${Number(commercial.Id)}` : "");

    const [
      [[recettes]],
      [recetteRows],
      [[factures]],
      [commandRows],
      [[upcoming]],
      [[soldes]],
      [soldeRows],
      [[visites]],
      [visiteRows],
    ] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(r.Recette), 0) AS total
         FROM HistoriqueRecettes r JOIN Clients c ON c.Code = r.CodeClient
         WHERE r.Date >= ? AND r.Date < ? + INTERVAL 1 DAY${scope("c")}`,
        [day, day]
      ),
      pool.query(
        `SELECT r.CodeClient AS code, c.Respnsible_Name AS name, c.Zone AS zone, r.Recette AS recette
         FROM HistoriqueRecettes r JOIN Clients c ON c.Code = r.CodeClient
         WHERE r.Date >= ? AND r.Date < ? + INTERVAL 1 DAY${scope("c")}
         ORDER BY r.Id DESC LIMIT ${LIST_SIZE}`,
        [day, day]
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(f.Montant), 0) AS total
         FROM Factures f JOIN Clients c ON c.Id = f.ClientId
         WHERE f.date >= ? AND f.date < ? + INTERVAL 1 DAY${scope("c")}`,
        [day, day]
      ),
      pool.query(
        `SELECT Id, Code, client, Zone, phone, distrubitaire, produit, Qte, A_Payer, Cach
         FROM Commands
         WHERE Command_Date >= ? AND Command_Date < ? + INTERVAL 1 DAY
         ORDER BY Id`,
        [day, day]
      ),
      pool.query(
        `SELECT COUNT(*) AS count FROM Commands
         WHERE Code IS NOT NULL
           AND Command_Date >= ? + INTERVAL 1 DAY AND Command_Date < ? + INTERVAL 8 DAY
           ${commercial ? "AND distrubitaire = ?" : ""}`,
        commercial ? [day, day, commercial.Nom] : [day, day]
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(p.PricePayer), 0) AS total
         FROM portFeuilleClients p WHERE p.PricePayer > 0${scope("p")}`
      ),
      pool.query(
        `SELECT p.Code AS code, p.name, p.zone, p.phone, p.PricePayer AS amount
         FROM portFeuilleClients p WHERE p.PricePayer > 0${scope("p")}
         ORDER BY p.PricePayer DESC`
      ),
      pool.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(c.Visit_Date IS NULL), 0) AS never FROM Clients c
         WHERE (c.Visit_Date IS NULL OR c.Visit_Date < ? - INTERVAL ${VISIT_DELAY_DAYS} DAY)${scope("c")}`,
        [day]
      ),
      pool.query(
        `SELECT c.Code AS code, c.Respnsible_Name AS name, c.Zone AS zone, c.Phone_Number AS phone,
                c.Visit_Date AS lastVisit
         FROM Clients c
         WHERE (c.Visit_Date IS NULL OR c.Visit_Date < ? - INTERVAL ${VISIT_DELAY_DAYS} DAY)${scope("c")}
         ORDER BY c.Visit_Date IS NULL, c.Visit_Date`,
        [day]
      ),
    ]);

    // One Commands row per product; the first row of an order carries the
    // client, the next ones (Code NULL) only the product.
    const livraisons = [];
    for (const row of commandRows) {
      if (row.Code != null || !livraisons.length) {
        livraisons.push({
          code: row.Code,
          client: row.client,
          zone: row.Zone?.trim() || null,
          phone: row.phone,
          commercial: row.distrubitaire,
          aPayer: row.A_Payer,
          cash: row.Cach,
          produits: [],
        });
      }
      livraisons.at(-1).produits.push({ produit: row.produit, quantite: row.Qte });
    }
    const mesLivraisons = commercial
      ? livraisons.filter((l) => l.commercial === commercial.Nom)
      : livraisons;

    res.json({
      date: day,
      commercial: commercial?.Nom ?? null,
      recettes: { ...recettes, items: recetteRows },
      factures,
      livraisons: { count: mesLivraisons.length, upcoming: upcoming.count, items: mesLivraisons },
      soldes: { ...soldes, items: soldeRows },
      visites: {
        delayDays: VISIT_DELAY_DAYS,
        count: visites.count,
        never: Number(visites.never),
        items: visiteRows.map((v) => ({
          ...v,
          lastVisit: v.lastVisit ? toNetDateTime(v.lastVisit) : null,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
