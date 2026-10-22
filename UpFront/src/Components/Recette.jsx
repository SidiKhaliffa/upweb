import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import ClientPicker from "./ClientPicker";
import { todayIso } from "./PdfViewer";
import { Actions, Button, Form, Grid, Page, TextField } from "../ui";

const emptyForm = () => ({ CodeClient: "", priseCompta: "", Recette_Date: todayIso() });

const Recette = () => {
  const { authFetch, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.CodeClient.trim()) {
      toast.error("Veuillez entrer un code client.");
      return;
    }
    if (!(Number(formData.priseCompta) > 0)) {
      toast.error("Veuillez entrer un montant de recette valide.");
      return;
    }
    if (!formData.Recette_Date) {
      toast.error("Veuillez sélectionner une date de recette.");
      return;
    }
    if (getRoleClaim()?.[1] == "Admin") {
      toast.error("Vous n'avez pas les droits nécessaires pour enregistrer une recette.");
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/Stock/recette`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success("Recette enregistrée.");
        setFormData(emptyForm());
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'enregistrement de la recette.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Recette" description="Argent encaissé chez un client.">
      <Form onSubmit={handleSubmit}>
        <Grid>
          <ClientPicker
            label="Client"
            required
            value={formData.CodeClient}
            onChange={(code) => setFormData((prev) => ({ ...prev, CodeClient: code }))}
          />
          <TextField
            label="Montant (MRU)"
            required
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            name="priseCompta"
            value={formData.priseCompta}
            onChange={handleInputChange}
          />
          <TextField
            label="Date"
            required
            type="date"
            name="Recette_Date"
            value={formData.Recette_Date}
            max={todayIso()}
            onChange={handleInputChange}
          />
        </Grid>
        <Actions>
          <Button type="submit" loading={saving}>
            Enregistrer la recette
          </Button>
        </Actions>
      </Form>
    </Page>
  );
};

export default Recette;
