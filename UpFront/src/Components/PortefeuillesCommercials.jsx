import React, { useState, useEffect, useCallback } from "react";
import { FileText, Wallet } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import PdfViewer from "./PdfViewer";
import { Alert, Button, DataTable, Page } from "../ui";

const PortefeuillesCommercials = () => {
  const { authFetch } = useAuth();
  const [commerciaux, setCommerciaux] = useState(null);
  const [error, setError] = useState(null);
  const [pdf, setPdf] = useState(null);
  const closePdf = useCallback(() => setPdf(null), []);

  useEffect(() => {
    (async () => {
      try {
        const response = await authFetch(`${API_BASE}/Commerces`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        setCommerciaux(await response.json());
      } catch (err) {
        console.error("Error fetching commerciaux:", err);
        setError("Impossible de charger la liste des commerciaux.");
      }
    })();
  }, []);

  const showRecette = ({ id, nom }) =>
    setPdf({
      title: `Recette – ${nom}`,
      url: `${API_BASE}/Commerces/GenerateRecettePdf?idcomerce=${id}`,
      fileName: `Recette_${nom}.pdf`,
    });

  const showPortefeuille = ({ id, nom }) =>
    setPdf({
      title: `Portefeuille – ${nom}`,
      url: `${API_BASE}/Commerces/GenerateRecapPdf?idcomerce=${id}`,
      fileName: `Portefeuille_${nom}.pdf`,
    });

  const columns = [
    { key: "nom", label: "Commercial", primary: true },
    { key: "telephone", label: "Téléphone", render: (row) => row.telephone || "—" },
    {
      key: "actions",
      label: "Documents",
      actions: true,
      render: (row) => (
        <div className="ui-actions-inline">
          <Button variant="secondary" size="sm" icon={FileText} onClick={() => showRecette(row)}>
            Recette
          </Button>
          <Button variant="secondary" size="sm" icon={Wallet} onClick={() => showPortefeuille(row)}>
            Portefeuille
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Page
      title="Portefeuilles commerciaux"
      description="Recettes et stock chez les clients de chaque commercial, en PDF."
    >
      {error && <Alert>{error}</Alert>}
      {commerciaux && (
        <DataTable
          columns={columns}
          rows={commerciaux}
          rowKey={(row) => row.id}
          empty="Aucun commercial enregistré."
        />
      )}
      <PdfViewer pdf={pdf} onClose={closePdf} />
    </Page>
  );
};

export default PortefeuillesCommercials;
