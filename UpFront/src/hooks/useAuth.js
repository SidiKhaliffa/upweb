import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { API_BASE } from "../config";
import { toast } from "../utils/toast";

const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

// Refresh a little before the real expiry, so a token can't expire while
// a request is on its way to the server.
const EXPIRY_MARGIN_MS = 60 * 1000;

const isTokenFresh = () => {
  const expiration = localStorage.getItem("expiration");
  return (
    Boolean(localStorage.getItem("token")) &&
    Boolean(expiration) &&
    Date.now() < new Date(expiration).getTime() - EXPIRY_MARGIN_MS
  );
};

class SessionExpiredError extends Error {}

// The server revokes a refresh token as soon as it is used. When several
// requests found the token expired at once, each one used to refresh with
// the same refresh token: the first succeeded and the others were refused,
// which logged the user out. All callers now share one refresh.
let refreshInFlight = null;

async function refreshTokens() {
  const usedRefreshToken = localStorage.getItem("refreshToken");
  if (!usedRefreshToken) throw new SessionExpiredError();

  const response = await fetch(`${API_BASE}/User/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(usedRefreshToken),
  });

  if (!response.ok) {
    // Another tab may have refreshed with the same token a moment ago:
    // its new tokens are already in localStorage.
    if (localStorage.getItem("refreshToken") !== usedRefreshToken && isTokenFresh()) {
      return localStorage.getItem("token");
    }
    if (response.status === 400 || response.status === 401) {
      throw new SessionExpiredError();
    }
    // Server or network trouble: keep the session, the next call retries.
    throw new Error(`Refresh failed with status ${response.status}`);
  }

  const data = await response.json();
  localStorage.setItem("token", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
  localStorage.setItem("expiration", data.expiration);
  return data.accessToken;
}

function sharedRefresh() {
  if (!refreshInFlight) {
    refreshInFlight = refreshTokens().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

export const useAuth = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiration");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Returns a valid access token, refreshing it first if it is about to
  // expire. Returns null, and logs out, only when the session is really
  // over (refresh token expired or revoked).
  const ensureFreshToken = async ({ force = false } = {}) => {
    if (!force && isTokenFresh()) {
      return localStorage.getItem("token");
    }
    try {
      return await sharedRefresh();
    } catch (error) {
      if (error instanceof SessionExpiredError) {
        // Several callers can land here together: warn only once.
        if (localStorage.getItem("token")) {
          toast.info("Votre session a expiré. Veuillez vous reconnecter.");
          logout();
        }
        return null;
      }
      console.error("Error refreshing token:", error);
      // Keep the current token: the request may still go through, and the
      // next call tries the refresh again.
      return localStorage.getItem("token");
    }
  };

  // fetch() wrapper that refreshes the token first if needed, then attaches
  // the Authorization header. A 401 (token revoked or expired server-side)
  // triggers one refresh and one retry.
  const authFetch = async (url, options = {}) => {
    const send = (token) =>
      fetch(url, {
        ...options,
        headers: {
          ...(options.headers || {}),
          Authorization: `Bearer ${token}`,
        },
      });

    const token = await ensureFreshToken();
    const response = await send(token);
    if (response.status !== 401 || !token) return response;

    const newToken = await ensureFreshToken({ force: true });
    return newToken ? send(newToken) : response;
  };

  const getDecodedToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return null;
    try {
      return jwtDecode(token);
    } catch (error) {
      console.error("Error decoding token:", error);
      return null;
    }
  };

  const getRoleClaim = () => {
    const decoded = getDecodedToken();
    return decoded ? decoded[ROLE_CLAIM] : null;
  };

  return {
    authFetch,
    ensureFreshToken,
    getDecodedToken,
    getRoleClaim,
    logout,
  };
};
