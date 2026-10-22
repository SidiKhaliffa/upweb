import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";
import {
  Actions,
  Alert,
  Button,
  DataTable,
  Form,
  Grid,
  Input,
  Page,
  Section,
  TextField,
} from "../ui";

const API_URL = `${API_BASE}/Peintres`;

const EMPTY_FORM = { nom: "", telephone: "", telephone2: "" };

const COLUMNS = [
  { key: "nom", label: "Nom", primary: true },
  {
    key: "telephone",
    label: "Téléphone",
    render: (p) => (
      <>
        {p.telephone}
        {p.telephone2 && <span className="ui-cell-sub">{p.telephone2}</span>}
      </>
    ),
  },
  {
    key: "createdAt",
    label: "Ajouté le",
    render: (p) => new Date(p.createdAt).toLocaleDateString("fr-FR"),
  },
];

const Peintres = () => {
  const { authFetch } = useAuth();
  const [peintres, setPeintres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  const loadPeintres = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await authFetch(API_URL);
      if (!response.ok) throw new Error();
      setPeintres(await response.json());
    } catch {
      setLoadError("Impossible de charger la liste des peintres.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPeintres();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.nom.trim() || !formData.telephone.trim()) {
      toast.error("Le nom et le téléphone sont obligatoires.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await authFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        toast.error(await readErrorMessage(response));
        return;
      }
      const data = await response.json();
      setPeintres((prev) => [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setFormData(EMPTY_FORM);
      toast.success(`${data.nom} a été ajouté.`);
    } catch {
      toast.error("Une erreur est survenue lors de l'ajout.");
    } finally {
      setIsSaving(false);
    }
  };

  const query = search.trim().toLowerCase();
  const filtered = query
    ? peintres.filter(
        (p) =>
          p.nom.toLowerCase().includes(query) ||
          p.telephone.includes(query) ||
          p.telephone2?.includes(query)
      )
    : peintres;

  return (
    <Page title="Peintres" description="Les peintres partenaires et leurs contacts.">
      <Section title="Ajouter un peintre">
        <Form onSubmit={handleSubmit}>
          <Grid>
            <TextField
              label="Nom"
              required
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              maxLength={255}
              autoComplete="off"
            />
            <TextField
              label="Téléphone"
              required
              type="tel"
              inputMode="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleInputChange}
              autoComplete="off"
            />
            <TextField
              label="Téléphone 2"
              type="tel"
              inputMode="tel"
              name="telephone2"
              value={formData.telephone2}
              onChange={handleInputChange}
              autoComplete="off"
            />
          </Grid>
          <Actions>
            <Button type="submit" loading={isSaving}>
              Ajouter le peintre
            </Button>
          </Actions>
        </Form>
      </Section>

      <Section
        title={`Liste des peintres${!isLoading && !loadError ? ` (${peintres.length})` : ""}`}
        actions={
          <div className="ui-search">
            <Search size={18} />
            <Input
              type="search"
              placeholder="Nom ou téléphone"
              aria-label="Rechercher un peintre"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      >
        {loadError ? (
          <Alert>
            {loadError}
            <Button variant="ghost" size="sm" onClick={loadPeintres}>
              Réessayer
            </Button>
          </Alert>
        ) : (
          <DataTable
            columns={COLUMNS}
            rows={isLoading ? [] : filtered}
            rowKey={(p) => p.id}
            empty={
              isLoading
                ? "Chargement…"
                : query
                  ? "Aucun peintre ne correspond à la recherche."
                  : "Aucun peintre enregistré."
            }
          />
        )}
      </Section>
    </Page>
  );
};

export default Peintres;
