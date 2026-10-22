import React, { useRef, useState } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import { formatAmount, formatNumber } from "../utils/format";
import ClientPicker from "./ClientPicker";
import { Alert, Button, DataTable, Form, Grid, Page, Section } from "../ui";

// The server ends the list with a "Chiffre D'affaire" total row.
const isTotalRow = (row) => row.produit === "Chiffre D'affaire";

// Dates come as "YYYY-MM-DDTHH:mm:ss"; year 1 means "no date".
const formatDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 1900) return "—";
  return date.toLocaleDateString("fr-FR");
};

const COLUMNS = [
  { key: "date", label: "Date", render: (row) => formatDay(row.date) },
  { key: "produit", label: "Produit", primary: true },
  { key: "quantite", label: "Quantité", align: "right", render: (row) => formatNumber(row.quantite) },
  { key: "montant", label: "Montant", align: "right", render: (row) => formatAmount(row.montant) },
  { key: "commercial", label: "Commercial", render: (row) => row.commercial || "—" },
];

const HistoriquesClient = () => {
  const { authFetch } = useAuth();
  const [codeClient, setCodeClient] = useState("");
  const [result, setResult] = useState(null); // { code, rows, total }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Name of the client picked in the list, for the results title.
  const picked = useRef(null);

  // Picking a client in the list searches right away.
  const handleSearch = async (pickedCode) => {
    const code = (pickedCode ?? codeClient).trim();
    if (!code) {
      toast.error("Veuillez entrer un code client.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(
        `${API_BASE}/Historique?codeclient=${encodeURIComponent(code)}`
      );
      if (!response.ok) {
        setResult(null);
        setError(await readErrorMessage(response));
        return;
      }
      const data = await response.json();
      const rows = Array.isArray(data) ? data : [];
      setResult({
        code,
        name: picked.current?.code === code ? picked.current.name : null,
        rows: rows.filter((row) => !isTotalRow(row)),
        total: rows.find(isTotalRow),
      });
    } catch (err) {
      console.error("Error:", err);
      setError("Erreur lors de la récupération de l'historique.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Page title="Historique client" description="Tous les produits livrés à un client.">
      <Form onSubmit={handleSearch}>
        <Grid>
          <ClientPicker
            label="Client"
            required
            value={codeClient}
            onChange={setCodeClient}
            onSelect={(client) => {
              picked.current = client;
              handleSearch(client.code);
            }}
          />
        </Grid>
        <div>
          <Button type="submit" icon={Search} loading={loading}>
            Rechercher
          </Button>
        </div>
      </Form>

      {error && <Alert>{error}</Alert>}

      {result && (
        <Section title={result.name ? `${result.name} (${result.code})` : `Client ${result.code}`}>
          <DataTable
            columns={COLUMNS}
            rows={result.rows}
            empty="Aucun historique pour ce client."
            footer={
              result.total && result.rows.length > 0
                ? {
                    produit: "Total",
                    // The server's total row carries no quantity.
                    quantite: formatNumber(
                      result.rows.reduce((sum, row) => sum + (Number(row.quantite) || 0), 0)
                    ),
                    montant: formatAmount(result.total.montant),
                  }
                : null
            }
          />
        </Section>
      )}
    </Page>
  );
};

export default HistoriquesClient;
