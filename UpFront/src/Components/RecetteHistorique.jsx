import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { formatAmount, formatNumber } from "../utils/format";
import { todayIso } from "./PdfViewer";
import { Alert, DataTable, Field, Input, Page, Section, Stats } from "../ui";

const COLUMNS = [
  { key: "name", label: "Commercial", primary: true },
  { key: "codeClient", label: "Code client" },
  { key: "recette", label: "Recette", align: "right", render: (row) => formatAmount(row.recette) },
];

const RecetteHistorique = () => {
  const { authFetch } = useAuth();
  const [date, setDate] = useState(todayIso);
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // The list follows the picked date: no "Rechercher" step needed.
  useEffect(() => {
    if (!date) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const response = await authFetch(`${API_BASE}/Stock/RecetteHistorique?date=${date}`);
        if (cancelled) return;
        if (!response.ok) {
          setRows(null);
          setError(await readErrorMessage(response));
          return;
        }
        const data = await response.json();
        if (!cancelled) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error:", err);
        if (!cancelled) setError("Impossible de charger les recettes. Vérifiez votre connexion.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [date]);

  const total = (rows ?? []).reduce((sum, row) => sum + (Number(row.recette) || 0), 0);
  const dayLabel = date ? new Date(`${date}T00:00:00`).toLocaleDateString("fr-FR") : "";

  return (
    <Page title="Historique des recettes" description="Les recettes encaissées un jour donné.">
      <div className="ui-grid">
        <Field label="Date" htmlFor="recette-date">
          <Input
            id="recette-date"
            type="date"
            value={date}
            max={todayIso()}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </Field>
      </div>

      {error && <Alert>{error}</Alert>}

      {rows && (
        <Section title={`Recettes du ${dayLabel}`}>
          <Stats
            items={[
              { label: "Total encaissé", value: formatAmount(total) },
              { label: "Nombre de recettes", value: formatNumber(rows.length) },
            ]}
          />
          <DataTable
            columns={COLUMNS}
            rows={rows}
            empty={loading ? "Chargement…" : "Aucune recette ce jour-là."}
          />
        </Section>
      )}
    </Page>
  );
};

export default RecetteHistorique;
