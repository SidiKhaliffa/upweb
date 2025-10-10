import React, { useState } from "react";
import { ChevronDown} from "lucide-react";
import "./TableauCommandes.css";

const TableauCommandes = () => {
  const [formData, setFormData] = useState({
    codeClient: "",
    qte1: "",
    produit1: "",
    qte2: "",
    produit2: "",
    qte3: "",
    produit3: "",
    dateLivraison: "",
    cash: "",
  });

  const [dropdowns, setDropdowns] = useState({
    produit1: false,
    produit2: false,
    produit3: false,
  });

  const produits = [
    "Produit A",
    "Produit B",
    "Produit C",
    "Produit D",
    "Produit E",
  ];

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

  const handleEnregistrer = () => {
    console.log("Commande data:", formData);
    // Handle save logic here
  };

  const handleGenererCommandes = () => {
    console.log("Generating commands:", formData);
    // Handle generate commands logic here
  };

  return (
    <div className="tableau-commandes">
      <h1 className="page-title">Tableau de Commandes</h1>

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
                  {produits.map((produit, index) => (
                    <div
                      key={index}
                      className="dropdown-item"
                      onClick={() => selectProduit("produit1", produit)}
                    >
                      {produit}
                    </div>
                  ))}
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
                  {produits.map((produit, index) => (
                    <div
                      key={index}
                      className="dropdown-item"
                      onClick={() => selectProduit("produit2", produit)}
                    >
                      {produit}
                    </div>
                  ))}
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
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="produit3">Produit 3</label>
            <div className="dropdown-container">
              <div
                className="dropdown-trigger"
                onClick={() => toggleDropdown("produit3")}
              >
                <span>{formData.produit3 || "Sélectionner un produit"}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.produit3 && (
                <div className="dropdown-menu">
                  {produits.map((produit, index) => (
                    <div
                      key={index}
                      className="dropdown-item"
                      onClick={() => selectProduit("produit3", produit)}
                    >
                      {produit}
                    </div>
                  ))}
                </div>
              )}
            </div>
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
              />
              {/* <Calendar className="date-icon" size={20} /> */}
            </div>
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
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleEnregistrer}
            className="submit-btn"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={handleGenererCommandes}
            className="generate-btn"
          >
            Générer les commandes
          </button>
        </div>
      </div>
    </div>
  );
};

export default TableauCommandes;
