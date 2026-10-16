import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { notImplemented } from "../utils/notImplemented.js";

const router = Router();

router.post(
  "/Add",
  requireAuth,
  notImplemented(
    "ajout de facture (date, CodeClient, Facture, Montant, distribiteur, StockProduitdto)"
  )
);

router.get(
  "/GenerateFacturePdf",
  requireAuth,
  notImplemented("génération du PDF de facture (lib PDF .NET à identifier)")
);

export default router;
