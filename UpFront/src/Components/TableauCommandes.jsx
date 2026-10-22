import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import "./TableauCommandes.css";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import PdfViewer from "./PdfViewer";

const LIGNES = [1, 2, 3, 4, 5, 6];

const EMPTY_FORM = {
  codeClient: "",
  dateLivraison: "",
  cash: "",
  ...Object.fromEntries(LIGNES.flatMap((n) => [[`produit${n}`, ""], [`qte${n}`, ""]])),
};

const produitName = (produit) => produit.nom || produit.name || produit;

// Server errors come as {message} from UpBack or as plain text from .NET.
async function readErrorMessage(response) {
  const text = await response.text();
  try {
    return JSON.parse(text).message || text;
  } catch {
    return text || `Erreur ${response.status}`;
  }
}

const TableauCommandes = () => {
  const { authFetch, ensureFreshToken, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState(EMPTY_FORM);
  // Name of the product dropdown currently open ("produit1"...), or null.
  const [openDropdown, setOpenDropdown] = useState(null);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdf, setPdf] = useState(null);
  const closePdf = useCallback(() => setPdf(null), []);

  useEffect(() => {
    ensureFreshToken();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProduits = async () => {
      try {
        setLoading(true);
        const response = await authFetch(`${API_BASE}/Stock/Produits`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await response.json();
        setProduits(data);
        setError(null);
      } catch (err) {
        setError("Erreur lors du chargement des produits");
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduits();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDropdown = (dropdown) => {
    setOpenDropdown((prev) => (prev === dropdown ? null : dropdown));
  };

  const selectProduit = (dropdown, produit) => {
    setFormData((prev) => ({
      ...prev,
      [dropdown]: produit,
    }));
    setOpenDropdown(null);
  };

  const handleEnregistrer = async () => {
    setError(null);

    if (getRoleClaim() == "Admin") {
      alert("Vous n'avez pas les droits nécessaires pour enregistrer une commande.");
      return;
    }

    if (!formData.codeClient.trim()) {
      setError("Saisissez le code client.");
      return;
    }
    if (!formData.dateLivraison) {
      setError("Choisissez la date de livraison.");
      return;
    }
    if (!LIGNES.some((n) => formData[`produit${n}`])) {
      setError("Ajoutez au moins un produit avec sa quantité.");
      return;
    }

    // A product without a quantity (or the reverse) used to be dropped
    // silently from the commande.
    const incomplete = LIGNES.find(
      (n) => Boolean(formData[`produit${n}`]) !== Boolean(formData[`qte${n}`])
    );
    if (incomplete) {
      setError(`Ligne ${incomplete} : choisissez le produit et sa quantité.`);
      return;
    }

    const commandData = {
      CodeClient: formData.codeClient,
      Command_date: formData.dateLivraison,
      cach: formData.cash || "0",
      StockCommanddto: LIGNES.filter((n) => formData[`produit${n}`]).map((n) => ({
        NameProduit: formData[`produit${n}`],
        Quantite: parseInt(formData[`qte${n}`]),
      })),
    };

    try {
      setLoading(true);
      const response = await authFetch(`${API_BASE}/Command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(commandData),
      });

      if (!response.ok) {
        setError(await readErrorMessage(response));
        return;
      }

      alert("Commande enregistrée avec succès!");
      setFormData(EMPTY_FORM);
    } catch (err) {
      setError("Erreur lors de l'enregistrement de la commande");
      console.error("Error saving command:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenererCommandes = () =>
    setPdf({
      title: "Tableau de commandes",
      urlForDate: (date) =>
        `${API_BASE}/Command/GenerateCommandPdf?commandDate=${date}`,
      fileNameForDate: (date) => `commandes_${date}.pdf`,
    });

  return (
    <div className="tableau-commandes">
      <h1 className="page-title">Tableau de Commandes</h1>

      {error && <div className="error-message">{error}</div>}

      <div className="form-container">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="codeClient">Code Client*</label>
            <input
              type="text"
              id="codeClient"
              name="codeClient"
              value={formData.codeClient}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateLivraison">Date de Délivraison*</label>
            <div className="date-input-container">
              <input
                type="date"
                id="dateLivraison"
                name="dateLivraison"
                value={formData.dateLivraison}
                onChange={handleInputChange}
                className="form-input date-input"
                required
              />
            </div>
          </div>
        </div>

        {LIGNES.map((n) => {
          const dropdown = `produit${n}`;
          return (
            <div className="form-row" key={n}>
              <div className="form-group">
                <label>Produit {n}{n === 1 && "*"}</label>
                <div className="dropdown-container">
                  <div
                    className="dropdown-trigger"
                    onClick={() => toggleDropdown(dropdown)}
                  >
                    <span>{formData[dropdown] || "Sélectionner un produit"}</span>
                    <ChevronDown size={20} />
                  </div>
                  {openDropdown === dropdown && (
                    <div className="dropdown-menu">
                      {loading ? (
                        <div className="dropdown-item">Chargement...</div>
                      ) : produits.length > 0 ? (
                        <>
                          {formData[dropdown] && (
                            <div
                              className="dropdown-item"
                              onClick={() => selectProduit(dropdown, "")}
                            >
                              <em>Aucun</em>
                            </div>
                          )}
                          {produits.map((produit, index) => (
                            <div
                              key={index}
                              className="dropdown-item"
                              onClick={() =>
                                selectProduit(dropdown, produitName(produit))
                              }
                            >
                              {produitName(produit)}
                            </div>
                          ))}
                        </>
                      ) : (
                        <div className="dropdown-item">Aucun produit disponible</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={`qte${n}`}>Qté {n}{n === 1 && "*"}</label>
                <input
                  type="number"
                  id={`qte${n}`}
                  name={`qte${n}`}
                  value={formData[`qte${n}`]}
                  onChange={handleInputChange}
                  className="form-input"
                  min="1"
                />
              </div>
            </div>
          );
        })}

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="cash">Cash</label>
            <input
              type="number"
              id="cash"
              name="cash"
              value={formData.cash}
              onChange={handleInputChange}
              className="form-input"
              step="0.01"
              min="0"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleEnregistrer}
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
          <button
            type="button"
            onClick={handleGenererCommandes}
            className="generate-btn"
            disabled={loading}
          >
            Générer les commandes
          </button>
        </div>
      </div>

      <PdfViewer pdf={pdf} onClose={closePdf} />
    </div>
  );
};

export default TableauCommandes;
