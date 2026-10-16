import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { notImplemented } from "../utils/notImplemented.js";

const router = Router();

// Expected response shape (from Statistiques.jsx):
// { statistiquProduits: [{ produit, stock_fabrique, stock_actuel,
//     pourcentage_vent, pourcentage_produit, Montant }],
//   coverageDatas: [{ address, coverage }] }
router.get(
  "/",
  requireAuth,
  notImplemented("agrégation statistiques produits + couverture")
);

export default router;
