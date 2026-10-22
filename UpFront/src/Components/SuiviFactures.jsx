import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import "./SuiviFactures.css";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { toast } from "../utils/toast";
import PdfViewer from "./PdfViewer";

const normalizeProduits = (raw) => {
  // Try to find an array in common payload shapes
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw.data)) arr = raw.data;
  else if (Array.isArray(raw.produits)) arr = raw.produits;
  else if (Array.isArray(raw.result)) arr = raw.result;
  else arr = []; // fallback

  return arr.map((p, i) => {
    if (typeof p === "string") {
      return { id: i, name: p };
    }
    if (!p || typeof p !== "object") {
      return { id: i, name: String(p) };
    }
    return {
      id: p.id ?? p.Id ?? p.code ?? p.Code ?? p.reference ?? p.Reference ?? i,
      name:
        p.nom ??
        p.name ??
        p.label ??
        p.libelle ??
        p.designation ??
        p.titre ??
        (p.description
          ? String(p.description).slice(0, 60)
          : JSON.stringify(p)),
    };
  });
};

const SuiviFactures = () => {
  const { authFetch, ensureFreshToken, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState({
    date: "",
    codeClient: "",
    numeroFacture: "",
    montant: "",
    distributeur: "",
    produit1: "",
    quantite1: "",
    produit2: "",
    quantite2: "",
    produit3: "",
    quantite3: "",
    produit4: "",
    quantite4: "",
    produit5: "",
    quantite5: "",
    produit6: "",
    quantite6: "",
  });

  const [dropdowns, setDropdowns] = useState({
    produit1: false,
    produit2: false,
    produit3: false,
    produit4: false,
    produit5: false,
    produit6: false,
  });

  const [produits, setProduits] = useState([]);
  const [pdf, setPdf] = useState(null);
  const closePdf = useCallback(() => setPdf(null), []);
  const [loading, setLoading] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    ensureFreshToken();
  }, []);

  // Fetch products on component mount
  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      const response = await authFetch(
        `${API_BASE}/Stock/Produits`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const normelized = normalizeProduits(data);
        console.log("Products fetched successfully : ", normelized);
        setProduits(normelized);
      } else {
        console.error("Failed to fetch products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const selectProduit = (dropdown, produit) => {
    const displayName = produit.name ?? produit.Name ?? "";
    setFormData((prev) => ({
      ...prev,
      [dropdown]: displayName,
    }));
    setDropdowns((prev) => ({ ...prev, [dropdown]: false }));
  };

  const clearInputs = () => {
    setFormData({
      date: "",
      codeClient: "",
      numeroFacture: "",
      montant: "",
      distributeur: "",
      produit1: "",
      quantite1: "",
      produit2: "",
      quantite2: "",
      produit3: "",
      quantite3: "",
      produit4: "",
      quantite4: "",
      produit5: "",
      quantite5: "",
      produit6: "",
      quantite6: "",
    });
  };

  const validateForm = () => {
    if (
      !formData.numeroFacture ||
      !formData.montant ||
      !formData.distributeur ||
      !formData.codeClient ||
      !formData.date
    ) {
      toast.error("Tous les champs marqués d'un * sont obligatoires.");
      return false;
    }

    const montant = Number(formData.montant);
    if (!Number.isFinite(montant)) {
      toast.error("Montant doit être un nombre.");
      return false;
    }

    const q1 = Number(formData.quantite1);
    if (!formData.produit1 || !Number.isFinite(q1) || q1 <= 0) {
      toast.error("Le produit 1 et sa quantité (> 0) sont obligatoires.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const stockProduits = [];

    // Add product 1 (required)
    if (formData.produit1 && formData.quantite1) {
      stockProduits.push({
        NameProduit: formData.produit1,
        Quantite: parseInt(formData.quantite1),
      });
    }

    // Add optional products
    const optionalProducts = [
      { name: formData.produit2, qty: formData.quantite2 },
      { name: formData.produit3, qty: formData.quantite3 },
      { name: formData.produit4, qty: formData.quantite4 },
      { name: formData.produit5, qty: formData.quantite5 },
      { name: formData.produit6, qty: formData.quantite6 },
    ];

    optionalProducts.forEach((prod) => {
      if (prod.name && prod.qty) {
        stockProduits.push({
          NameProduit: prod.name,
          Quantite: parseInt(prod.qty),
        });
      }
    });

    const factureData = {
      date: new Date(formData.date).toISOString(),
      CodeClient: formData.codeClient,
      Facture: formData.numeroFacture,
      Montant: parseFloat(formData.montant),
      distribiteur: formData.distributeur,
      StockProduitdto: stockProduits,
    };

    try {
      if (getRoleClaim() == "Admin") {
        toast.error(
          "Vous n'avez pas les droits nécessaires pour ajouter une facture."
        );
        return;
      }
      const response = await authFetch(
        `${API_BASE}/Facture/Add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(factureData),
        }
      );

      if (response.ok) {
        toast.success("Facture enregistrée.");
        clearInputs();
      } else {
        const errorContent = await response.text();
        handleError(response.status, errorContent);
      }
    } catch (error) {
      console.error("Error submitting facture:", error);
      toast.error("Une erreur est survenue lors de l'enregistrement de la facture.");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (statusCode, errorContent) => {
    console.error("Error Content:", errorContent);

    try {
      const errorResponse = JSON.parse(errorContent);
      if (errorResponse.message) {
        toast.error(errorResponse.message);
        return;
      }
      if (errorResponse.Errors) {
        const messages = Object.values(errorResponse.Errors).flat().join("\n");
        toast.error(messages);
        return;
      }
    } catch (e) {
      // If JSON parsing fails, show raw error
    }

    toast.error(errorContent || "Une erreur est survenue.");
  };

  const showPdfInPopup = () =>
    setPdf({
      title: "Suivi des factures",
      urlForDate: (date) =>
        `${API_BASE}/Facture/GenerateFacturePdf?FactureDate=${date}`,
      fileNameForDate: (date) => `factures_${date}.pdf`,
    });

  return (
    <div className="suivi-factures">
      <h1 className="page-title">Factures</h1>

      <div className="form-container">
        <div className="form-header">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Date*</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="codeClient">Code Client*</label>
              <input
                type="text"
                id="codeClient"
                name="codeClient"
                value={formData.codeClient}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="numeroFacture">Numéro de facture*</label>
              <input
                type="text"
                id="numeroFacture"
                name="numeroFacture"
                value={formData.numeroFacture}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="montant">Montant*</label>
              <input
                type="number"
                id="montant"
                name="montant"
                value={formData.montant}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="distributeur">Distributeur*</label>
              <input
                type="text"
                id="distributeur"
                name="distributeur"
                value={formData.distributeur}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {[1, 2, 3, 4, 5, 6].map((n) => {
          const dropdown = `produit${n}`;
          return (
            <div className="form-row product-line" key={n}>
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
                  {dropdowns[dropdown] && (
                    <div className="dropdown-menu">
                      {produits.map((produit) => (
                        <div
                          key={produit.id}
                          className="dropdown-item"
                          onClick={() => selectProduit(dropdown, produit)}
                        >
                          {produit.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor={`quantite${n}`}>Qté {n}{n === 1 && "*"}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  id={`quantite${n}`}
                  name={`quantite${n}`}
                  min="1"
                  step="1"
                  value={formData[`quantite${n}`]}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
          );
        })}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleSubmit}
            className="submit-btn"
            disabled={loading}
          >
            {loading ? "Enregistrement..." : "Enregistrer Facture"}
          </button>

          <button
            type="button"
            onClick={showPdfInPopup}
            className="generate-btn"
          >
            Voir PDF
          </button>
        </div>
      </div>

      <PdfViewer pdf={pdf} onClose={closePdf} />
    </div>
  );
};

export default SuiviFactures;
