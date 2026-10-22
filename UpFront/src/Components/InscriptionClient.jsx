import React, { useState } from "react";
import { MapPin } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import { Actions, Button, Field, Form, Grid, Input, Page, TextField } from "../ui";

const EMPTY_FORM = {
  code: "",
  zone: "",
  nomSociete: "",
  recommandation: "",
  Respnsible_Name: "",
  Phone_Number: "",
  coordonneesGPS: "",
};

const REQUIRED = [
  ["code", "le code"],
  ["zone", "la zone"],
  ["Respnsible_Name", "le nom du responsable"],
  ["Phone_Number", "le numéro de téléphone"],
];

const InscriptionClient = () => {
  const { authFetch, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Commerciaux register clients on site: the phone's position fills the
  // GPS field.
  const fillPosition = () => {
    if (!navigator.geolocation) {
      toast.error("La localisation n'est pas disponible sur cet appareil.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFormData((prev) => ({
          ...prev,
          coordonneesGPS: `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`,
        }));
        setLocating(false);
      },
      () => {
        toast.error("Position introuvable. Autorisez la localisation et réessayez.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const handleSubmit = async () => {
    const missing = REQUIRED.find(([key]) => !formData[key].trim());
    if (missing) {
      toast.error(`Veuillez saisir ${missing[1]}.`);
      return;
    }
    if (getRoleClaim()?.[1] == "Admin") {
      toast.error("Vous n'avez pas les droits pour inscrire un client.");
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`${API_BASE}/Clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success("Client inscrit.");
        setFormData(EMPTY_FORM);
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue lors de l'inscription.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Inscription client" description="Ajoute un nouveau client et son portefeuille.">
      <Form onSubmit={handleSubmit}>
        <Grid>
          <TextField
            label="Code client"
            required
            name="code"
            value={formData.code}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            label="Zone"
            required
            name="zone"
            value={formData.zone}
            onChange={handleInputChange}
          />
          <TextField
            label="Nom du responsable"
            required
            name="Respnsible_Name"
            value={formData.Respnsible_Name}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            label="Numéro de téléphone"
            required
            type="tel"
            inputMode="tel"
            name="Phone_Number"
            value={formData.Phone_Number}
            onChange={handleInputChange}
            autoComplete="off"
          />
          <TextField
            label="Nom de la société"
            name="nomSociete"
            value={formData.nomSociete}
            onChange={handleInputChange}
          />
          <TextField
            label="Recommandation"
            name="recommandation"
            value={formData.recommandation}
            onChange={handleInputChange}
          />
          <Field label="Coordonnées GPS" htmlFor="coordonneesGPS" full>
            <div className="ui-input-row">
              <Input
                id="coordonneesGPS"
                name="coordonneesGPS"
                value={formData.coordonneesGPS}
                onChange={handleInputChange}
                placeholder="18.0735, -15.9582"
              />
              <Button variant="secondary" icon={MapPin} loading={locating} onClick={fillPosition}>
                Ma position
              </Button>
            </div>
          </Field>
        </Grid>
        <Actions>
          <Button type="submit" loading={saving}>
            Inscrire le client
          </Button>
        </Actions>
      </Form>
    </Page>
  );
};

export default InscriptionClient;
