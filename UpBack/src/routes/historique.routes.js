import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { notImplemented } from "../utils/notImplemented.js";

const router = Router();

router.get(
  "/",
  requireAuth,
  notImplemented("historique par code client (?codeclient=)")
);

export default router;
