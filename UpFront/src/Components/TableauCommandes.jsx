import React, { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { ChevronDown, X, Download } from "lucide-react";
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
  const [showPdfPopup, setShowPdfPopup] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const refreshTokenIfNeeded = async () => {
      const currentTime = new Date().toISOString();
  
      if (new Date(currentTime) > new Date(localStorage.getItem("expiration"))) {
        try {
          const refreshResponse = await fetch(
            "https://universellepeintre.oneposts.io/api/User/refresh",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(localStorage.getItem("refreshToken")),
            }
          );
          const refreshData = await refreshResponse.json();
          if (refreshResponse.ok) {
            localStorage.setItem("token", refreshData.accessToken);
            localStorage.setItem("refreshToken", refreshData.refreshToken);
            localStorage.setItem("expiration", refreshData.expiration);
            console.log("Token refreshed successfully");
          } else {
            alert("Votre session a expiré. Veuillez vous reconnecter.");
            navigate("/login");
            return;
          }
        } catch (error) {
          console.error("Error refreshing token:", error);
          alert("Une erreur est survenue lors du rafraîchissement du token.");
          return;
        }
      }
    };
    refreshTokenIfNeeded();
  }, []);

  // Fetch products from API
  useEffect(() => {
    const fetchProduits = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          "https://universellepeintre.oneposts.io/api/Stock/Produits",
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${localStorage.getItem("token")}`,
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
          formData.produit1 && formData.qte1 && {
            NameProduit: formData.produit1,
            Quantite: parseInt(formData.qte1),
          },
          formData.produit2 && formData.qte2 && {
            NameProduit: formData.produit2,
            Quantite: parseInt(formData.qte2),
          },
          formData.produit3 && formData.qte3 && {
            NameProduit: formData.produit3,
            Quantite: parseInt(formData.qte3),
          },
          formData.produit4 && formData.qte4 && {
            NameProduit: formData.produit4,
            Quantite: parseInt(formData.qte4),
          },
          formData.produit5 && formData.qte5 && {
            NameProduit: formData.produit5,
            Quantite: parseInt(formData.qte5),
          },
          formData.produit6 && formData.qte6 && {
            NameProduit: formData.produit6,
            Quantite: parseInt(formData.qte6),
          },
        ].filter(Boolean),
      };

      const token = localStorage.getItem("token");
      const decodeToken = jwtDecode(token);
      if(decodeToken['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] == "Admin"){
        alert("Vous n'avez pas les droits nécessaires pour enregistrer une commande.");
        return;
      }
      const response = await fetch(
        "https://universellepeintre.oneposts.io/api/Command",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
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

  const handleGenererCommandes = async () => {
    try {
      setLoading(true);
      setError(null);
      const date = new Date();
      const formattedDate = date.toISOString().split('T')[0]; // yyyy-MM-dd
      const response = await fetch(
        `https://universellepeintre.oneposts.io/api/Command/GenerateCommandPdf?commandDate=${formattedDate}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF as a blob
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setShowPdfPopup(true);
    } catch (err) {
      setError("Erreur lors de la génération du PDF");
      console.error("Error generating PDF:", err);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = `commandes_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const closePdfPopup = () => {
    setShowPdfPopup(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  };

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
                        onClick={() => selectProduit("produit1", produit.nom || produit.name || produit)}
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">Aucun produit disponible</div>
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
                        onClick={() => selectProduit("produit2", produit.nom || produit.name || produit)}
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">Aucun produit disponible</div>
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
                        onClick={() => selectProduit("produit4", produit.nom || produit.name || produit)}
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">Aucun produit disponible</div>
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
                        onClick={() => selectProduit("produit5", produit.nom || produit.name || produit)}
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">Aucun produit disponible</div>
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
                        onClick={() => selectProduit("produit6", produit.nom || produit.name || produit)}
                      >
                        {produit.nom || produit.name || produit}
                      </div>
                    ))
                  ) : (
                    <div className="dropdown-item">Aucun produit disponible</div>
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
            {loading ? "Génération..." : "Générer les commandes"}
          </button>
        </div>
      </div>

      {/* PDF Popup */}
      {showPdfPopup && (
        <div className="pdf-popup-overlay" onClick={closePdfPopup}>
          <div className="pdf-popup-container" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-popup-header">
              <h2>Commandes PDF</h2>
              <div className="pdf-popup-actions">
                <button
                  onClick={handleDownloadPdf}
                  className="download-pdf-btn"
                  title="Télécharger"
                >
                  <Download size={20} />
                  Télécharger
                </button>
                <button
                  onClick={closePdfPopup}
                  className="close-popup-btn"
                  title="Fermer"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            <div className="pdf-popup-content">
              <iframe
                src={pdfUrl}
                title="PDF Viewer"
                className="pdf-iframe"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TableauCommandes;