import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import "./Peintres.css";

const API_URL = `${API_BASE}/Peintres`;

const EMPTY_FORM = { nom: "", telephone: "", telephone2: "" };

const Peintres = () => {
  const { authFetch } = useAuth();
  const [peintres, setPeintres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.nom.trim() || !formData.telephone.trim()) {
      setMessage({ type: "error", text: "Le nom et le téléphone sont obligatoires." });
      return;
    }

    setIsSaving(true);
    try {
      const response = await authFetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (!response.ok) {
        setMessage({ type: "error", text: data.message || "Erreur lors de l'ajout du peintre." });
        return;
      }
      setPeintres((prev) =>
        [...prev, data].sort((a, b) => a.nom.localeCompare(b.nom))
      );
      setFormData(EMPTY_FORM);
      setMessage({ type: "success", text: `${data.nom} a été ajouté.` });
    } catch {
      setMessage({ type: "error", text: "Une erreur est survenue lors de l'ajout." });
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
    <div className="peintres">
      <h1 className="peintres-title">Peintres</h1>

      <form className="peintres-card" onSubmit={handleSubmit}>
        <h2 className="peintres-subtitle">Ajouter un peintre</h2>
        <div className="peintres-form-row">
          <div className="peintres-form-group">
            <label htmlFor="peintre-nom">Nom *</label>
            <input
              type="text"
              id="peintre-nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              className="peintres-input"
              maxLength={255}
            />
          </div>
          <div className="peintres-form-group">
            <label htmlFor="peintre-telephone">Téléphone *</label>
            <input
              type="tel"
              id="peintre-telephone"
              name="telephone"
              value={formData.telephone}
              onChange={handleInputChange}
              className="peintres-input"
            />
          </div>
          <div className="peintres-form-group">
            <label htmlFor="peintre-telephone2">Téléphone 2</label>
            <input
              type="tel"
              id="peintre-telephone2"
              name="telephone2"
              value={formData.telephone2}
              onChange={handleInputChange}
              className="peintres-input"
            />
          </div>
        </div>

        {message && (
          <div className={`peintres-message ${message.type}`}>{message.text}</div>
        )}

        <div className="peintres-actions">
          <button type="submit" className="peintres-btn" disabled={isSaving}>
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </button>
        </div>
      </form>

      <div className="peintres-card">
        <div className="peintres-list-header">
          <h2 className="peintres-subtitle">
            Liste des peintres {!isLoading && !loadError && `(${peintres.length})`}
          </h2>
          <div className="peintres-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Rechercher par nom ou téléphone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <p className="peintres-empty">Chargement...</p>
        ) : loadError ? (
          <div className="peintres-message error">
            {loadError}{" "}
            <button type="button" className="peintres-link" onClick={loadPeintres}>
              Réessayer
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="peintres-empty">
            {query ? "Aucun peintre ne correspond à la recherche." : "Aucun peintre enregistré."}
          </p>
        ) : (
          <div className="peintres-table-container">
            <table className="peintres-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Téléphone</th>
                  <th>Ajouté le</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nom}</td>
                    <td>
                      {p.telephone}
                      {p.telephone2 && (
                        <span className="peintres-phone2">{p.telephone2}</span>
                      )}
                    </td>
                    <td>{new Date(p.createdAt).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Peintres;
