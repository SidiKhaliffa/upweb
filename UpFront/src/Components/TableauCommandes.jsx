import React, { useState, useCallback } from "react";
import { FileText } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useProduits } from "../hooks/useProduits";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import PdfViewer from "./PdfViewer";
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

const EMPTY_FORM = { codeClient: "", dateLivraison: "", cash: "" };

const TableauCommandes = () => {
  const { authFetch, getRoleClaim } = useAuth();
  const { produits, loading, error, reload } = useProduits();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [lines, setLines] = useState([EMPTY_LINE]);
  const [saving, setSaving] = useState(false);
  const [pdf, setPdf] = useState(null);
  const closePdf = useCallback(() => setPdf(null), []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.codeClient.trim()) {
      toast.error("Saisissez le code client.");
      return;
    }
    if (!formData.dateLivraison) {
      toast.error("Choisissez la date de livraison.");
      return;
    }
    const { error: linesError, items } = productLinesPayload(lines);
    if (linesError) {
      toast.error(linesError);
      return;
    }
    if (getRoleClaim() == "Admin") {
      toast.error("Vous n'avez pas les droits nécessaires pour enregistrer une commande.");
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/Command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CodeClient: formData.codeClient,
          Command_date: formData.dateLivraison,
          cach: formData.cash || "0",
          StockCommanddto: items,
        }),
      });
      if (response.ok) {
        toast.success("Commande enregistrée.");
        setFormData(EMPTY_FORM);
        setLines([EMPTY_LINE]);
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (err) {
      console.error("Error saving command:", err);
      toast.error("Erreur lors de l'enregistrement de la commande.");
    } finally {
      setSaving(false);
    }
  };

  const showPdf = () =>
    setPdf({
      title: "Tableau de commandes",
      urlForDate: (date) => `${API_BASE}/Command/GenerateCommandPdf?commandDate=${date}`,
      fileNameForDate: (date) => `commandes_${date}.pdf`,
    });

  return (
    <Page
      title="Commandes et livraisons"
      description="Préparez les livraisons à faire chez les clients."
      actions={
        <Button variant="secondary" icon={FileText} onClick={showPdf}>
          PDF des commandes
        </Button>
      }
    >
      <Form onSubmit={handleSubmit}>
        <Grid>
          <TextField
            label="Code client"
            required
            name="codeClient"
            value={formData.codeClient}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            label="Date de livraison"
            required
            type="date"
            name="dateLivraison"
            value={formData.dateLivraison}
            onChange={handleInputChange}
          />
          <TextField
            label="Cash (MRU)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            name="cash"
            value={formData.cash}
            onChange={handleInputChange}
          />
        </Grid>

        <Section title="Produits à livrer">
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
            Enregistrer la commande
          </Button>
        </Actions>
      </Form>

      <PdfViewer pdf={pdf} onClose={closePdf} />
    </Page>
  );
};

export default TableauCommandes;
