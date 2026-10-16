import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { notImplemented } from "../utils/notImplemented.js";

const router = Router();

router.get(
  "/Produits",
  requireAuth,
  notImplemented("liste des produits (table Stock/Produits inconnue)")
);

router.post(
  "/recette",
  requireAuth,
  notImplemented("enregistrement d'une recette (CodeClient, priseCompta, Recette_Date)")
);

router.post(
  "/PriseCompta",
  requireAuth,
  notImplemented("modification de la balance du tiers (CodeClient, priseCompta)")
);

router.post(
  "/update",
  requireAuth,
  notImplemented("ajout de stock client (CodeClient, Visit_date, Description, StockProduitdto)")
);

router.get(
  "/RecetteHistorique",
  requireAuth,
  notImplemented("historique des recettes par date")
);

export default router;
