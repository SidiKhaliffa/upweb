import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useProduits } from "../hooks/useProduits";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import ClientPicker from "./ClientPicker";
import { todayIso } from "./PdfViewer";
import {
  Actions,
  Alert,
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

const PREVIEW_DELAY_MS = 300;

const formatDay = (value) => new Date(value).toLocaleDateString("fr-FR", { timeZone: "UTC" });

// "Unigloss : 5" — or "Unigloss : 0 + 3 livrés" for a product delivered
// since the last count.
const describeProduit = ({ name, stock, livre }) =>
  livre > 0 ? `${name} : ${stock} + ${livre} livré${livre > 1 ? "s" : ""}` : `${name} : ${stock}`;

// "Ajouter stock client": what is left on the client's shelf at this
// visit. Whatever disappeared since the last visit counts as sold.
const AjouterStockClient = () => {
  const { authFetch, getRoleClaim } = useAuth();
  const { produits, loading, error, reload } = useProduits();
  const [formData, setFormData] = useState(emptyForm);
  const [lines, setLines] = useState([EMPTY_LINE]);
  const [saving, setSaving] = useState(false);
  // The client's previous stock: whatever is not counted now goes to 0.
  const [previous, setPrevious] = useState(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setPrevious(null);
    const code = formData.CodeClient.trim();
    if (!code) return undefined;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const response = await authFetch(
          `${API_BASE}/Stock/client?code=${encodeURIComponent(code)}`
        );
        if (response.ok && !cancelled) setPrevious(await response.json());
      } catch {
        // No preview: the count is still saved, just without the reminder.
      }
    }, PREVIEW_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [formData.CodeClient]);

  // Editing the form again cancels a pending confirmation.
  useEffect(() => setConfirming(false), [formData, lines]);

  const counted = new Set(lines.filter((l) => l.produit).map((l) => l.produit.toLowerCase()));
  const uncounted = (previous?.produits ?? []).filter((p) => !counted.has(p.name.toLowerCase()));

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
    if (uncounted.length && !confirming) {
      setConfirming(true);
      return;
    }
    save(items);
  };

  const save = async (items) => {
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
        setPrevious(null);
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
          <ClientPicker
            label="Client"
            required
            value={formData.CodeClient}
            onChange={(code) => setFormData((prev) => ({ ...prev, CodeClient: code }))}
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
          {previous?.produits.length > 0 && (
            <Alert type="info">
              {previous.lastVisit
                ? `Stock au dernier comptage (${formatDay(previous.lastVisit)})`
                : "Stock actuel"}{" "}
              : {previous.produits.map(describeProduit).join(", ")}. Un produit non compté sera
              mis à 0 (vendu).
            </Alert>
          )}
          <ProductLines
            lines={lines}
            onChange={setLines}
            produits={produits}
            loading={loading}
            error={error}
            onRetry={reload}
          />
        </Section>

        {confirming ? (
          <Alert type="warning">
            <span>
              Non compté{uncounted.length > 1 ? "s" : ""} :{" "}
              <strong>{uncounted.map(describeProduit).join(", ")}</strong>.{" "}
              {uncounted.length > 1 ? "Ces produits seront mis" : "Ce produit sera mis"} à 0
              (vendu{uncounted.length > 1 ? "s" : ""}). Confirmer ?
            </span>
            <Actions>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={saving}>
                Revenir au comptage
              </Button>
              <Button type="submit" loading={saving}>
                Confirmer et enregistrer
              </Button>
            </Actions>
          </Alert>
        ) : (
          <Actions>
            <Button type="submit" loading={saving}>
              Enregistrer le stock
            </Button>
          </Actions>
        )}
      </Form>
    </Page>
  );
};

export default AjouterStockClient;
