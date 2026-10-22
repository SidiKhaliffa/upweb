import { useCallback, useEffect, useState } from "react";
import { API_BASE } from "../config";
import { useAuth } from "./useAuth";

// The product list rarely changes: it is loaded once and shared by every
// page (commandes, factures, stock client) instead of on each visit.
let cache = null;

const toName = (p) => (typeof p === "string" ? p : p?.name ?? p?.nom ?? p?.Name ?? "");

export function useProduits() {
  const { authFetch } = useAuth();
  const [produits, setProduits] = useState(cache ?? []);
  const [loading, setLoading] = useState(!cache);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/Stock/Produits`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      cache = (Array.isArray(data) ? data : []).map(toName).filter(Boolean);
      setProduits(cache);
    } catch (err) {
      console.error("Error fetching produits:", err);
      setError("Impossible de charger la liste des produits.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!cache) load();
  }, []);

  return { produits, loading, error, reload: load };
}
