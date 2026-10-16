import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Token manquant." });
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return res.status(401).json({ message: "Token invalide ou expiré." });
  }
}
