import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { notImplemented } from "../utils/notImplemented.js";

const router = Router();

router.post(
  "/",
  requireAuth,
  notImplemented("création de commande (CodeClient, Command_date, cach, StockCommanddto)")
);

router.get(
  "/GenerateCommandPdf",
  requireAuth,
  notImplemented("génération du PDF des commandes (lib PDF .NET à identifier)")
);

export default router;
