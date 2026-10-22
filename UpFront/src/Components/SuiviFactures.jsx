import React, { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useProduits } from "../hooks/useProduits";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import PdfViewer, { todayIso } from "./PdfViewer";
import {
  Actions,
  Button,
  EMPTY_LINE,
  Form,
  Grid,
  Page,
  ProductLines,
  Section,
  TextField,
  productLinesPayload,
} from "../ui";

const emptyForm = () => ({
  date: todayIso(),
  codeClient: "",
  numeroFacture: "",
  montant: "",
  distributeur: "",
});

const REQUIRED = [
  ["date", "la date"],
  ["codeClient", "le code client"],
  ["numeroFacture", "le numéro de facture"],
  ["montant", "le montant"],
  ["distributeur", "le distributeur"],
];

const SuiviFactures = () => {
  const { authFetch, getRoleClaim } = useAuth();
  const { produits, loading, error, reload } = useProduits();
  const [formData, setFormData] = useState(emptyForm);
  const [lines, setLines] = useState([EMPTY_LINE]);
  const [saving, setSaving] = useState(false);
  const [pdf, setPdf] = useState(null);
  const closePdf = useCallback(() => setPdf(null), []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    const missing = REQUIRED.find(([key]) => !String(formData[key]).trim());
    if (missing) {
      toast.error(`Veuillez saisir ${missing[1]}.`);
      return;
    }
    const montant = Number(formData.montant);
    if (!Number.isFinite(montant) || montant < 0) {
      toast.error("Le montant doit être un nombre positif.");
      return;
    }
    const { error: linesError, items } = productLinesPayload(lines);
    if (linesError) {
      toast.error(linesError);
      return;
    }
    if (getRoleClaim() == "Admin") {
      toast.error("Vous n'avez pas les droits nécessaires pour ajouter une facture.");
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/Facture/Add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formData.date,
          CodeClient: formData.codeClient,
          Facture: formData.numeroFacture,
          Montant: montant,
          distribiteur: formData.distributeur,
          StockProduitdto: items,
        }),
      });
      if (response.ok) {
        toast.success("Facture enregistrée.");
        setFormData(emptyForm());
        setLines([EMPTY_LINE]);
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (err) {
      console.error("Error submitting facture:", err);
      toast.error("Une erreur est survenue lors de l'enregistrement de la facture.");
    } finally {
      setSaving(false);
    }
  };

  const showPdf = () =>
    setPdf({
      title: "Suivi des factures",
      urlForDate: (date) => `${API_BASE}/Facture/GenerateFacturePdf?FactureDate=${date}`,
      fileNameForDate: (date) => `factures_${date}.pdf`,
    });

  return (
    <Page
      title="Factures"
      description="Le montant s'ajoute à la balance du client, les produits au stock fabriqué."
      actions={
        <Button variant="secondary" icon={FileText} onClick={showPdf}>
          PDF des factures
        </Button>
      }
    >
      <Form onSubmit={handleSubmit}>
        <Grid>
          <TextField
            label="Date"
            required
            type="date"
            name="date"
            value={formData.date}
            onChange={handleInputChange}
          />
          <TextField
            label="Code client"
            required
            name="codeClient"
            value={formData.codeClient}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            label="Numéro de facture"
            required
            name="numeroFacture"
            value={formData.numeroFacture}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            label="Montant (MRU)"
            required
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            name="montant"
            value={formData.montant}
            onChange={handleInputChange}
          />
          <TextField
            label="Distributeur"
            required
            name="distributeur"
            value={formData.distributeur}
            onChange={handleInputChange}
          />
        </Grid>

        <Section title="Produits facturés">
          <ProductLines
            lines={lines}
            onChange={setLines}
            produits={produits}
            loading={loading}
            error={error}
            onRetry={reload}
          />
        </Section>

        <Actions>
          <Button type="submit" loading={saving}>
            Enregistrer la facture
          </Button>
        </Actions>
      </Form>

      <PdfViewer pdf={pdf} onClose={closePdf} />
    </Page>
  );
};

export default SuiviFactures;
