import crypto from "crypto";
import { Router } from "express";
import pool from "../config/db.js";
import { verifyNetIdentityPasswordV3 } from "../utils/netIdentityPassword.js";
import { buildAuthResponse } from "../utils/jwt.js";

const router = Router();

// Matches the .NET backend's existing rows in RefreshTokens: 7-day
// lifetime, opaque 64-byte random token stored base64 (88 chars).
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS) || 7;

const INVALID_CREDENTIALS = { message: "Identifiant ou mot de passe incorrect." };

// ASP.NET Identity looks users up by NormalizedUserName, which is the
// user name upper-cased (ToUpperInvariant).
async function findUserByUserName(userName) {
  const [rows] = await pool.query(
    `SELECT Id, UserName, PasswordHash, LockoutEnabled,
            LockoutEnd > UTC_TIMESTAMP(6) AS isLockedOut
     FROM AspNetUsers WHERE NormalizedUserName = ? LIMIT 1`,
    [userName.toUpperCase()]
  );
  return rows[0] || null;
}

// The frontend checks admins with `role[1] == "Admin"`, so admins (who
// have both User and Admin) must get ["User", "Admin"] in that order —
// sort Admin last explicitly rather than relying on join order.
async function findRoles(userId) {
  const [rows] = await pool.query(
    `SELECT r.Name FROM AspNetUserRoles ur
     JOIN AspNetRoles r ON r.Id = ur.RoleId
     WHERE ur.UserId = ?
     ORDER BY r.Name = 'Admin', r.Name`,
    [userId]
  );
  return rows.map((row) => row.Name);
}

async function createRefreshToken(userId) {
  const token = crypto.randomBytes(64).toString("base64");
  await pool.query(
    `INSERT INTO RefreshTokens (Token, UserId, Created, Expires)
     VALUES (?, ?, UTC_TIMESTAMP(6), UTC_TIMESTAMP(6) + INTERVAL ? DAY)`,
    [token, userId, REFRESH_TOKEN_DAYS]
  );
  return token;
}

function isPasswordValid(passwordHash, password) {
  if (!passwordHash) return false;
  try {
    return verifyNetIdentityPasswordV3(passwordHash, password);
  } catch {
    // Unknown hash format: treat as a failed login rather than a 500.
    return false;
  }
}

router.post("/login", async (req, res, next) => {
  try {
    const { userName, password } = req.body;
    if (!userName || !password) {
      return res
        .status(400)
        .json({ message: "Identifiant et mot de passe requis." });
    }

    const row = await findUserByUserName(userName);
    if (!row || !isPasswordValid(row.PasswordHash, password)) {
      return res.status(401).json(INVALID_CREDENTIALS);
    }

    if (row.LockoutEnabled && row.isLockedOut) {
      return res
        .status(401)
        .json({ message: "Compte verrouillé. Réessayez plus tard." });
    }

    const user = {
      id: row.Id,
      userName: row.UserName,
      roles: await findRoles(row.Id),
    };
    const refreshToken = await createRefreshToken(row.Id);
    res.json(buildAuthResponse(user, refreshToken));
  } catch (err) {
    next(err);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    // The frontend sends the refresh token as a bare JSON string body
    // (`JSON.stringify(localStorage.getItem("refreshToken"))`), not an
    // object — express.json() parses that straight into req.body here.
    const refreshToken = req.body;
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(400).json({ message: "Refresh token manquant." });
    }

    // Revoke-then-check in one statement so the same token can't be
    // used twice by two concurrent requests.
    const [result] = await pool.query(
      `UPDATE RefreshTokens SET Revoked = UTC_TIMESTAMP(6)
       WHERE Token = ? AND Revoked IS NULL AND Expires > UTC_TIMESTAMP(6)`,
      [refreshToken]
    );
    if (result.affectedRows === 0) {
      return res.status(401).json({ message: "Refresh token invalide." });
    }

    const [rows] = await pool.query(
      `SELECT u.Id, u.UserName FROM RefreshTokens rt
       JOIN AspNetUsers u ON u.Id = rt.UserId
       WHERE rt.Token = ? LIMIT 1`,
      [refreshToken]
    );
    const row = rows[0];
    if (!row) {
      return res.status(401).json({ message: "Utilisateur introuvable." });
    }

    const user = {
      id: row.Id,
      userName: row.UserName,
      roles: await findRoles(row.Id),
    };
    const newRefreshToken = await createRefreshToken(row.Id);
    res.json(buildAuthResponse(user, newRefreshToken));
  } catch (err) {
    next(err);
  }
});

export default router;
