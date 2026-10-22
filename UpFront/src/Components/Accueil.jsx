import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { formatAmount, formatNumber } from "../utils/format";
import { todayIso } from "./PdfViewer";
import { Alert, Button, Card, List, Stats } from "../ui";
import "./Accueil.css";

const DAY_MS = 24 * 60 * 60 * 1000;

const userName = () => {
  try {
    return JSON.parse(localStorage.getItem("user"))?.userName ?? "";
  } catch {
    return "";
  }
};

const longDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const plural = (n, word) => `${formatNumber(n)} ${word}${n > 1 ? "s" : ""}`;

const lastVisitLabel = (lastVisit, today) => {
  if (!lastVisit) return "Jamais visité";
  const days = Math.round((new Date(`${today}T00:00:00`) - new Date(lastVisit.slice(0, 10) + "T00:00:00")) / DAY_MS);
  return `Dernière visite il y a ${plural(days, "jour")}`;
};

const place = (...parts) => parts.filter(Boolean).join(" · ");

// Home page: what needs doing today, for the logged-in commercial (or
// everyone, for an admin).
const Accueil = () => {
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = todayIso();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/Accueil?date=${today}`);
      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }
      setData(await response.json());
    } catch (err) {
      console.error("Error loading home page:", err);
      setError("Impossible de charger les chiffres du jour. Vérifiez votre connexion.");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const name = userName();

  return (
    <div className="accueil">
      <header className="accueil-header">
        <div>
          <h1>Bonjour{name ? `, ${name}` : ""}</h1>
          <p className="accueil-date">{longDate(today)}</p>
        </div>
        <Button variant="secondary" size="sm" icon={RefreshCw} loading={loading} onClick={load}>
          Actualiser
        </Button>
      </header>

      {error && (
        <Alert>
          {error}
          <Button variant="ghost" size="sm" onClick={load}>
            Réessayer
          </Button>
        </Alert>
      )}

      {data && (
        <>
          <Stats
            items={[
              {
                label: "Recettes du jour",
                value: formatAmount(data.recettes.total),
                hint: plural(data.recettes.count, "recette"),
              },
              {
                label: "Factures du jour",
                value: formatAmount(data.factures.total),
                hint: plural(data.factures.count, "facture"),
              },
              {
                label: "Livraisons du jour",
                value: formatNumber(data.livraisons.count),
                hint: `${formatNumber(data.livraisons.upcoming)} dans les 7 prochains jours`,
              },
              {
                label: "Montant dû par les clients",
                value: formatAmount(data.soldes.total),
                hint: plural(data.soldes.count, "client"),
              },
            ]}
          />

          <div className="accueil-grid">
            <Card title="Livraisons du jour" count={formatNumber(data.livraisons.count)}>
              <List
                empty="Aucune livraison prévue aujourd'hui."
                items={data.livraisons.items.map((l, i) => ({
                  key: `${l.code}-${i}`,
                  title: l.client || l.code,
                  meta: place(
                    l.zone,
                    l.produits.map((p) => `${p.produit} ×${formatNumber(p.quantite)}`).join(", ")
                  ),
                  value: l.aPayer ? formatAmount(l.aPayer) : null,
                  phone: l.phone,
                }))}
              />
            </Card>

            <Card title="Soldes à recouvrer" count={plural(data.soldes.count, "client")}>
              {/* Every client that owes money, biggest amount first. */}
              <List
                scroll
                empty="Aucun client ne doit d'argent."
                items={data.soldes.items.map((s) => ({
                  key: s.code,
                  title: s.name || s.code,
                  meta: place(`Code ${s.code}`, s.zone),
                  value: formatAmount(s.amount),
                  phone: s.phone,
                }))}
              />
            </Card>

            <Card
              title="Clients à visiter"
              count={plural(data.visites.count, "client")}
              footer={
                data.visites.count
                  ? `Pas de visite depuis ${data.visites.delayDays} jours ou plus` +
                    (data.visites.never ? `, dont ${plural(data.visites.never, "client")} jamais visité${data.visites.never > 1 ? "s" : ""}.` : ".")
                  : null
              }
            >
              {/* Every client to visit, longest without a visit first. */}
              <List
                scroll
                empty="Tous les clients ont été visités récemment."
                items={data.visites.items.map((v) => ({
                  key: v.code,
                  title: v.name || v.code,
                  meta: place(v.zone?.trim(), lastVisitLabel(v.lastVisit, today)),
                  phone: v.phone,
                }))}
              />
            </Card>

            <Card title="Recettes du jour" count={plural(data.recettes.count, "recette")}>
              <List
                empty="Aucune recette enregistrée aujourd'hui."
                items={data.recettes.items.map((r, i) => ({
                  key: `${r.code}-${i}`,
                  title: r.name || r.code,
                  meta: place(`Code ${r.code}`, r.zone?.trim()),
                  value: formatAmount(r.recette),
                }))}
              />
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default Accueil;
