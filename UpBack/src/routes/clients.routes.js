import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { notImplemented } from "../utils/notImplemented.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  notImplemented(
    "inscription client (code, zone, nomSociete, recommandation, Respnsible_Name, Phone_Number, coordonneesGPS)"
  )
);

export default router;
