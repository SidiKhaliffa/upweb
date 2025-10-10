import React, { useState, useEffect } from "react";
import { ChevronDown, Download, X } from "lucide-react";
import "./SuiviFactures.css";

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
  const [pdfPopupOpen, setPdfPopupOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Token storage (you'll need to implement your own token management)
  const getToken = () => {
    return localStorage.getItem("token") || "";
  };

  // Fetch products on component mount
  useEffect(() => {
    fetchProduits();
  }, []);

  const fetchProduits = async () => {
    try {
      const response = await fetch(
        "https://universellepeintre.oneposts.io/api/Stock/Produits",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${getToken()}`,
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
      alert("Tous les champs marqués d'un * sont obligatoires.");
      return false;
    }

    const montant = Number(formData.montant);
    if (!Number.isFinite(montant)) {
      alert("Montant doit être un nombre.");
      return false;
    }

    const q1 = Number(formData.quantite1);
    if (!formData.produit1 || !Number.isFinite(q1) || q1 <= 0) {
      alert("Le produit 1 et sa quantité (> 0) sont obligatoires.");
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
      const response = await fetch(
        "https://universellepeintre.oneposts.io/api/Facture/Add",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(factureData),
        }
      );

      if (response.ok) {
        alert("Les données ont été ajoutées avec succès.");
        clearInputs();
      } else {
        const errorContent = await response.text();
        handleError(response.status, errorContent);
      }
    } catch (error) {
      console.error("Error submitting facture:", error);
      alert("Une erreur est survenue lors de l'enregistrement de la facture.");
    } finally {
      setLoading(false);
    }
  };

  const handleError = (statusCode, errorContent) => {
    console.error("Error Content:", errorContent);

    try {
      const errorResponse = JSON.parse(errorContent);
      if (errorResponse.Errors) {
        const messages = Object.values(errorResponse.Errors).flat().join("\n");
        alert(messages);
        return;
      }
    } catch (e) {
      // If JSON parsing fails, show raw error
    }

    alert(`Une erreur est survenue: ${errorContent}`);
  };

  const showPdfInPopup = async () => {
    const date = new Date().toISOString().split("T")[0];
    const url = `https://universellepeintre.oneposts.io/api/Facture/GenerateFacturePdf?FactureDate=${date}`;
    setCurrentPdfUrl(url);
    setPdfPopupOpen(true);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        alert(`Error: ${errorMessage}`);
        setPdfPopupOpen(false);
        return;
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert(`An error occurred: ${error.message}`);
      setPdfPopupOpen(false);
    }
  };

  const downloadPdf = async () => {
    if (!currentPdfUrl) {
      alert("Aucun PDF à télécharger.");
      return;
    }

    try {
      const response = await fetch(currentPdfUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `facture_${new Date()
          .toISOString()
          .replace(/[:.]/g, "-")}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert("PDF téléchargé avec succès");
      } else {
        alert("Erreur lors du téléchargement du fichier.");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(`Erreur lors du téléchargement : ${error.message}`);
    }
  };

  const closePdfPopup = () => {
    setPdfPopupOpen(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl("");
    }
  };

  return (
    <div className="suivi-factures">
      <h1 className="page-title">Suivi De Factures</h1>

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
              <label htmlFor="numeroFacture">Numero Facture*</label>
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

        <div className="products-grid">
          <div className="products-column">
            {/* Produit 1 */}
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
                    {produits.map((produit) => (
                      <div
                        key={produit.id}
                        className="dropdown-item"
                        onClick={() => selectProduit("produit1", produit)}
                      >
                        {produit.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quantite1">Quantité 1*</label>
              <input
                type="number"
                id="quantite1"
                name="quantite1"
                min="1"
                step="1"
                value={formData.quantite1}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Produit 2 */}
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
                    {produits.map((produit) => (
                      <div
                        key={produit.id}
                        className="dropdown-item"
                        onClick={() => selectProduit("produit2", produit)}
                      >
                        {produit.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quantite2">Quantité 2</label>
              <input
                type="number"
                id="quantite2"
                name="quantite2"
                min="1"
                step="1"
                value={formData.quantite2}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="products-column">
            {/* Produit 3 */}
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
                    {produits.map((produit) => (
                      <div
                        key={produit.id}
                        className="dropdown-item"
                        onClick={() => selectProduit("produit3", produit)}
                      >
                        {produit.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quantite3">Quantité 3</label>
              <input
                type="number"
                id="quantite3"
                name="quantite3"
                min="1"
                step="1"
                value={formData.quantite3}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Produit 4 */}
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
                    {produits.map((produit) => (
                      <div
                        key={produit.id}
                        className="dropdown-item"
                        onClick={() => selectProduit("produit4", produit)}
                      >
                        {produit.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quantite4">Quantité 4</label>
              <input
                type="number"
                id="quantite4"
                name="quantite4"
                min="1"
                step="1"
                value={formData.quantite4}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="products-column">
            {/* Produit 5 */}
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
                    {produits.map((produit) => (
                      <div
                        key={produit.id}
                        className="dropdown-item"
                        onClick={() => selectProduit("produit5", produit)}
                      >
                        {produit.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quantite5">Quantité 5</label>
              <input
                type="number"
                id="quantite5"
                name="quantite5"
                min="1"
                step="1"
                value={formData.quantite5}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Produit 6 */}
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
                    {produits.map((produit) => (
                      <div
                        key={produit.id}
                        className="dropdown-item"
                        onClick={() => selectProduit("produit6", produit)}
                      >
                        {produit.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="quantite6">Quantité 6</label>
              <input
                type="number"
                id="quantite6"
                name="quantite6"
                min="1"
                step="1"
                value={formData.quantite6}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

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
            className="submit-btn"
            style={{
              marginLeft: "20px",
              background: "linear-gradient(135deg, #28a745, #20c997)",
            }}
          >
            Voir PDF
          </button>
        </div>
      </div>

      {/* PDF Popup */}
      {pdfPopupOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "12px",
              width: "90%",
              maxWidth: "1200px",
              height: "90%",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "20px",
                borderBottom: "1px solid #e1e5e9",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "24px",
                  color: "#1e4a72",
                  fontWeight: 600,
                }}
              >
                Aperçu PDF
              </h2>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={downloadPdf}
                  style={{
                    padding: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "6px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  title="Télécharger"
                >
                  <Download size={24} color="#1e4a72" />
                </button>
                <button
                  onClick={closePdfPopup}
                  style={{
                    padding: "10px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "6px",
                    transition: "background-color 0.2s",
                  }}
                  onMouseOver={(e) =>
                    (e.currentTarget.style.backgroundColor = "#f8f9fa")
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                  title="Fermer"
                >
                  <X size={24} color="#1e4a72" />
                </button>
              </div>
            </div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              {pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  style={{ width: "100%", height: "100%", border: "none" }}
                  title="PDF Viewer"
                />
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    fontSize: "18px",
                    color: "#666",
                  }}
                >
                  <p>Chargement du PDF...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuiviFactures;
