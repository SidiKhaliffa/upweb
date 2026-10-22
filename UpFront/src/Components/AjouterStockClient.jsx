import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useProduits } from "../hooks/useProduits";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import { todayIso } from "./PdfViewer";
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

const emptyForm = () => ({ CodeClient: "", Visit_date: todayIso(), description: "" });

// "Ajouter stock client": what is left on the client's shelf at this
// visit. Whatever disappeared since the last visit counts as sold.
const AjouterStockClient = () => {
  const { authFetch, getRoleClaim } = useAuth();
  const { produits, loading, error, reload } = useProduits();
  const [formData, setFormData] = useState(emptyForm);
  const [lines, setLines] = useState([EMPTY_LINE]);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.CodeClient.trim()) {
      toast.error("Le code client ne peut pas être vide.");
      return;
    }
    if (!formData.Visit_date) {
      toast.error("La date de visite ne peut pas être vide.");
      return;
    }
    if (!formData.description.trim()) {
      toast.error("La conclusion ne peut pas être vide.");
      return;
    }
    // 0 is a valid count: the client has none of that product left.
    const { error: linesError, items } = productLinesPayload(lines, { allowZero: true });
    if (linesError) {
      toast.error(linesError);
      return;
    }
    if (getRoleClaim()?.[1] == "Admin") {
      toast.error("Seuls les commerciaux peuvent ajouter du stock client.");
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/Stock/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          CodeClient: formData.CodeClient,
          Visit_date: formData.Visit_date,
          Description: formData.description,
          recipe_day: 0,
          StockProduitdto: items,
        }),
      });
      if (response.ok) {
        toast.success("Stock client enregistré.");
        setFormData(emptyForm());
        setLines([EMPTY_LINE]);
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (err) {
      console.error("Error:", err);
      toast.error("Une erreur est survenue lors de l'ajout du stock.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page
      title="Stock client"
      description="Comptez ce qui reste chez le client lors de la visite."
    >
      <Form onSubmit={handleSubmit}>
        <Grid>
          <TextField
            label="Code client"
            required
            name="CodeClient"
            value={formData.CodeClient}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            label="Date de visite"
            required
            type="date"
            name="Visit_date"
            value={formData.Visit_date}
            max={todayIso()}
            onChange={handleInputChange}
          />
          <TextField
            label="Conclusion"
            required
            full
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Ex. : repasser jeudi, demande du P30"
          />
        </Grid>

        <Section title="Stock compté">
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
            Enregistrer le stock
          </Button>
        </Actions>
      </Form>
    </Page>
  );
};

export default AjouterStockClient;
