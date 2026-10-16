import crypto from "crypto";
import jwt from "jsonwebtoken";

// The frontend (UpFront) decodes this exact claim URI to read the user's
// role — it's ASP.NET's ClaimTypes.Role constant, not a custom claim name.
// Keeping it identical means src/hooks/useAuth.js and every component that
// calls getRoleClaim() need zero changes when this backend replaces the
// .NET one.
export const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export function signAccessToken(user) {
  // user.roles is an ARRAY even for a single role. .NET serializes
  // multiple Claim(ClaimTypes.Role, ...) entries as a JSON array under
  // one claim name, but collapses to a bare string when there's only
  // one. The frontend has call sites written against BOTH shapes
  // (`role == "Admin"` and `role[1] == "Admin"`) — a single-element
  // array satisfies the first via JS's array-to-string coercion
  // (`["Admin"] == "Admin"` is true) while still supporting the
  // second if a user ever has two roles. Don't "simplify" this to a
  // bare string without checking every getRoleClaim() call site in
  // UpFront first.
  //
  // The other claim names (unique_name, isAdmin as a string, jti) copy a
  // real token issued by the .NET backend.
  return jwt.sign(
    {
      sub: String(user.id),
      unique_name: user.userName,
      jti: crypto.randomUUID(),
      isAdmin: String(user.roles.includes("Admin")),
      [ROLE_CLAIM]: user.roles,
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "1h",
      // Same secret/issuer/audience as the .NET backend's "JWT" settings,
      // so tokens from either backend are accepted by the other.
      ...(process.env.JWT_ISSUER && { issuer: process.env.JWT_ISSUER }),
      ...(process.env.JWT_AUDIENCE && { audience: process.env.JWT_AUDIENCE }),
    }
  );
}

export function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}

// Mirrors the .NET response shape the frontend already expects
// (Login.jsx reads accessToken/refreshToken/expiration/user). The refresh
// token is an opaque value stored in the RefreshTokens table, not a JWT.
export function buildAuthResponse(user, refreshToken) {
  const accessToken = signAccessToken(user);
  const decoded = jwt.decode(accessToken);
  return {
    accessToken,
    refreshToken,
    expiration: new Date(decoded.exp * 1000).toISOString(),
    user: { id: user.id, userName: user.userName, roles: user.roles },
  };
}
