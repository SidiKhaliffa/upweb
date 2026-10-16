import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { notImplemented } from "../utils/notImplemented.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  notImplemented("liste des commercialistes")
);

router.get(
  "/GenerateRecettePdf",
  requireAuth,
  notImplemented("PDF recette par commercial (?idcomerce=)")
);

router.get(
  "/GenerateRecapPdf",
  requireAuth,
  notImplemented("PDF récapitulatif/portefeuille par commercial (?idcomerce=)")
);

export default router;
