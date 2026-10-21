import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/auth.js";
import { STOCK_ACTUEL_SQL } from "../utils/business.js";

const router = Router();

// The .NET DELETE delete route (no auth, reset every product's stock to
// 0) is deliberately not ported.

// Reference number of zones for the "Mauritanie" coverage line. .NET
// divided List.Capacity (an internal buffer size, not the zone count) by
// this value, so the percentage was meaningless.
const ZONES_MAURITANIE = 30;

const round2 = (value) => Math.round(value * 100) / 100;

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const [produits] = await pool.query(
      `SELECT p.Name, p.stock, ${STOCK_ACTUEL_SQL} AS StockActuel, p.PrixActuel
       FROM Produits p ORDER BY p.Id`
    );
    const totalStock = produits.reduce((sum, p) => sum + p.stock, 0);

    // Stock actuel and percentages are computed live instead of read from
    // the stored columns, which .NET left stale after stock updates.
    const statistiquProduits = produits.map((p) => {
      const vendu = p.stock - p.StockActuel;
      return {
        produit: p.Name,
        stock_fabrique: p.stock,
        stock_actuel: p.StockActuel,
        pourcentage_vent: totalStock > 0 ? round2((vendu / totalStock) * 100) : 0,
        pourcentage_produit: p.stock > 0 ? round2((vendu / p.stock) * 100) : 0,
        montant: p.stock * p.PrixActuel,
      };
    });
    const stockActuelTotal = produits.reduce((sum, p) => sum + p.StockActuel, 0);
    const montantTotal = statistiquProduits.reduce((sum, p) => sum + p.montant, 0);
    statistiquProduits.push(
      {
        produit: "Total",
        stock_fabrique: totalStock,
        stock_actuel: stockActuelTotal,
        pourcentage_vent: 0,
        pourcentage_produit: 0,
        montant: 0,
      },
      {
        produit: "Chiffre D'affaire Total",
        stock_fabrique: totalStock,
        stock_actuel: stockActuelTotal,
        pourcentage_vent: 0,
        pourcentage_produit: 0,
        montant: montantTotal,
      }
    );

    const [zones] = await pool.query(
      // TRIM: "CLINIQUE" and "CLINIQUE " are the same zone typed twice.
      "SELECT TRIM(Zone) AS Zone, COUNT(*) AS n FROM Clients GROUP BY TRIM(Zone) ORDER BY MIN(Id)"
    );
    const clientCount = zones.reduce((sum, z) => sum + z.n, 0);
    const coverageDatas = zones.map((z) => ({
      address: z.Zone,
      coverage: round2((z.n / clientCount) * 100),
    }));
    coverageDatas.push({
      address: "Mauritanie",
      coverage: Math.min(100, round2((zones.length / ZONES_MAURITANIE) * 100)),
    });

    res.json({ statistiquProduits, coverageDatas });
  } catch (err) {
    next(err);
  }
});

export default router;
