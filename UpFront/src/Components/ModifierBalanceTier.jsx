import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import ClientPicker from "./ClientPicker";
import { Actions, Button, Form, Grid, Page, TextField } from "../ui";

const EMPTY_FORM = { CodeClient: "", priseCompta: "" };

const ModifierBalanceTier = () => {
  const { authFetch, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
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
    if (formData.priseCompta === "" || !Number.isFinite(Number(formData.priseCompta))) {
      toast.error("Veuillez entrer un montant valide.");
      return;
    }
    if (getRoleClaim()?.[1] == "Admin") {
      toast.error("Vous n'avez pas les droits nécessaires pour modifier la balance.");
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/Stock/PriseCompta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success("Balance du client modifiée.");
        setFormData(EMPTY_FORM);
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue lors de la modification de la balance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Balance client" description="Remplace le solde comptable d'un client.">
      <Form onSubmit={handleSubmit}>
        <Grid>
          <ClientPicker
            label="Client"
            required
            value={formData.CodeClient}
            onChange={(code) => setFormData((prev) => ({ ...prev, CodeClient: code }))}
          />
          <TextField
            label="Nouvelle balance (MRU)"
            required
            type="number"
            inputMode="decimal"
            step="0.01"
            name="priseCompta"
            value={formData.priseCompta}
            onChange={handleInputChange}
          />
        </Grid>
        <Actions>
          <Button type="submit" loading={saving}>
            Enregistrer la balance
          </Button>
        </Actions>
      </Form>
    </Page>
  );
};

export default ModifierBalanceTier;
