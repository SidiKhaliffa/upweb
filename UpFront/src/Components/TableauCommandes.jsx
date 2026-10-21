import React, { useState, useEffect, useCallback } from "react";
import { ChevronDown } from "lucide-react";
import "./TableauCommandes.css";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import PdfViewer from "./PdfViewer";

const TableauCommandes = () => {
  const { authFetch, ensureFreshToken, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState({
    codeClient: "",
    qte1: "",
    produit1: "",
    qte2: "",
    produit2: "",
    qte3: "",
    produit3: "",
    qte4: "",
    produit4: "",
    qte5: "",
    produit5: "",
    qte6: "",
    produit6: "",
    dateLivraison: "",
    cash: "",
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
        const response = await authFetch(
          `${API_BASE}/Stock/Produits`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

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
    setDropdowns((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  const selectProduit = (dropdown, produit) => {
    setFormData((prev) => ({
      ...prev,
      [dropdown]: produit,
    }));
    setDropdowns((prev) => ({
      ...prev,
      [dropdown]: false,
    }));
  };

  const handleEnregistrer = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare the command data
      const commandData = {
        CodeClient: formData.codeClient,
        Command_date: formData.dateLivraison,
        cach: formData.cash || "0",
        StockCommanddto: [
          formData.produit1 &&
            formData.qte1 && {
              NameProduit: formData.produit1,
              Quantite: parseInt(formData.qte1),
            },
          formData.produit2 &&
            formData.qte2 && {
              NameProduit: formData.produit2,
              Quantite: parseInt(formData.qte2),
            },
          formData.produit3 &&
            formData.qte3 && {
              NameProduit: formData.produit3,
              Quantite: parseInt(formData.qte3),
            },
          formData.produit4 &&
            formData.qte4 && {
              NameProduit: formData.produit4,
              Quantite: parseInt(formData.qte4),
            },
          formData.produit5 &&
            formData.qte5 && {
              NameProduit: formData.produit5,
              Quantite: parseInt(formData.qte5),
            },
          formData.produit6 &&
            formData.qte6 && {
              NameProduit: formData.produit6,
              Quantite: parseInt(formData.qte6),
            },
        ].filter(Boolean),
      };

      if (getRoleClaim() == "Admin") {
        alert(
          "Vous n'avez pas les droits nécessaires pour enregistrer une commande."
        );
        return;
      }
      const response = await authFetch(
        `${API_BASE}/Command`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(commandData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save command");
      }

      const result = await response;
      console.log("helllooooo");
      alert("Commande enregistrée avec succès!");
      console.log("Command saved:", result);

      // Reset form
      setFormData({
        codeClient: "",
        qte1: "",
        produit1: "",
        qte2: "",
        produit2: "",
        qte3: "",
        produit3: "",
        qte4: "",
        produit4: "",
        qte5: "",
        produit5: "",
        qte6: "",
        produit6: "",
        dateLivraison: "",
        cash: "",
      });
    } catch (err) {
      setError("Erreur lors de l'enregistrement de la commande");
      console.error("Error saving command:", err);
      alert("Erreur lors de l'enregistrement de la commande");
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
            <label htmlFor="qte1">Qté1</label>
            <input
              type="number"
              id="qte1"
              name="qte1"
              value={formData.qte1}
              onChange={handleInputChange}
              className="form-input"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="produit1">Produit 1*</label>
            <div className="dropdown-container">
              <div
                className="dropdown-trigger"
                onClick={() => toggleDropdown("produit1")}
              >
                <span>{formData.produit1 || "Sélectionner un produit"}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.produit1 && (
                <div className="dropdown-menu">
                  {loading ? (
                    <div className="dropdown-item">Chargement...</div>
                  ) : produits.length > 0 ? (
                    produits.map((produit, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() =>
                          selectProduit(
                            "produit1",
                            produit.nom || produit.name || produit
                          )
                        }
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">
                      Aucun produit disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="qte2">Qté2</label>
            <input
              type="number"
              id="qte2"
              name="qte2"
              value={formData.qte2}
              onChange={handleInputChange}
              className="form-input"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="produit2">Produit 2</label>
            <div className="dropdown-container">
              <div
                className="dropdown-trigger"
                onClick={() => toggleDropdown("produit2")}
              >
                <span>{formData.produit2 || "Sélectionner un produit"}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.produit2 && (
                <div className="dropdown-menu">
                  {loading ? (
                    <div className="dropdown-item">Chargement...</div>
                  ) : produits.length > 0 ? (
                    produits.map((produit, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() =>
                          selectProduit(
                            "produit2",
                            produit.nom || produit.name || produit
                          )
                        }
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">
                      Aucun produit disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="qte3">Qté3</label>
            <input
              type="number"
              id="qte3"
              name="qte3"
              value={formData.qte3}
              onChange={handleInputChange}
              className="form-input"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="produit4">Produit 4</label>
            <div className="dropdown-container">
              <div
                className="dropdown-trigger"
                onClick={() => toggleDropdown("produit4")}
              >
                <span>{formData.produit4 || "Sélectionner un produit"}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.produit4 && (
                <div className="dropdown-menu">
                  {loading ? (
                    <div className="dropdown-item">Chargement...</div>
                  ) : produits.length > 0 ? (
                    produits.map((produit, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() =>
                          selectProduit(
                            "produit4",
                            produit.nom || produit.name || produit
                          )
                        }
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">
                      Aucun produit disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="qte4">Qté4</label>
            <input
              type="number"
              id="qte4"
              name="qte4"
              value={formData.qte4}
              onChange={handleInputChange}
              className="form-input"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="produit5">Produit 5</label>
            <div className="dropdown-container">
              <div
                className="dropdown-trigger"
                onClick={() => toggleDropdown("produit5")}
              >
                <span>{formData.produit5 || "Sélectionner un produit"}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.produit5 && (
                <div className="dropdown-menu">
                  {loading ? (
                    <div className="dropdown-item">Chargement...</div>
                  ) : produits.length > 0 ? (
                    produits.map((produit, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() =>
                          selectProduit(
                            "produit5",
                            produit.nom || produit.name || produit
                          )
                        }
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">
                      Aucun produit disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="qte5">Qté5</label>
            <input
              type="number"
              id="qte5"
              name="qte5"
              value={formData.qte5}
              onChange={handleInputChange}
              className="form-input"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="produit6">Produit 6</label>
            <div className="dropdown-container">
              <div
                className="dropdown-trigger"
                onClick={() => toggleDropdown("produit6")}
              >
                <span>{formData.produit6 || "Sélectionner un produit"}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.produit6 && (
                <div className="dropdown-menu">
                  {loading ? (
                    <div className="dropdown-item">Chargement...</div>
                  ) : produits.length > 0 ? (
                    produits.map((produit, index) => (
                      <div
                        key={index}
                        className="dropdown-item"
                        onClick={() =>
                          selectProduit(
                            "produit6",
                            produit.nom || produit.name || produit
                          )
                        }
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">
                      Aucun produit disponible
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="qte6">Qté6</label>
            <input
              type="number"
              id="qte6"
              name="qte6"
              value={formData.qte6}
              onChange={handleInputChange}
              className="form-input"
              min="0"
            />
          </div>
        </div>

        <div className="form-row">
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

          <div className="form-group">
            {/* Empty column for layout consistency */}
          </div>
        </div>

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
