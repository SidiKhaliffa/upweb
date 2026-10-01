import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const API_BASE = "https://api.universellepeinture.com/api";
const ROLE_CLAIM =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export const useAuth = () => {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expiration");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Refreshes the access token if it has expired. Returns the current
  // (possibly refreshed) access token, or null if the session is gone.
  const ensureFreshToken = async () => {
    const expiration = localStorage.getItem("expiration");
    if (expiration && new Date() <= new Date(expiration)) {
      return localStorage.getItem("token");
    }

    try {
      const refreshResponse = await fetch(`${API_BASE}/User/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localStorage.getItem("refreshToken")),
      });
      const refreshData = await refreshResponse.json();

      if (!refreshResponse.ok) {
        alert("Votre session a expiré. Veuillez vous reconnecter.");
        logout();
        return null;
      }

      localStorage.setItem("token", refreshData.accessToken);
      localStorage.setItem("refreshToken", refreshData.refreshToken);
      localStorage.setItem("expiration", refreshData.expiration);
      console.log("Token refreshed successfully");
      return refreshData.accessToken;
    } catch (error) {
      console.error("Error refreshing token:", error);
      alert("Une erreur est survenue lors du rafraîchissement du token.");
      return null;
    }
  };

  // fetch() wrapper that refreshes the token first if needed, then attaches
  // the Authorization header automatically.
  const authFetch = async (url, options = {}) => {
    const token = await ensureFreshToken();
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
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
