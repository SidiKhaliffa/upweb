import React, { useState, useEffect } from "react";
import { X, Download } from "lucide-react";
import "./PortefeuillesCommercials.css";

const PortefeuillesCommercials = () => {
  const [commercialistes, setCommercialistes] = useState([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [currentPdfType, setCurrentPdfType] = useState("");
  const [currentCommercialName, setCurrentCommercialName] = useState("");
  const [currentCommercialId, setCurrentCommercialId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentApiUrl, setCurrentApiUrl] = useState("");

  const fetchCommercialistes = async () => {
    try {
      const response = await fetch(
        "https://universellepeintre.oneposts.io/api/Commerces",
        {
          method: "GET",
          headers: {
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
        }
      );
      const data = await response.json();
      setCommercialistes(data);
    } catch (error) {
      console.error("Error fetching commercialistes:", error);
    }
  };

  useEffect(() => {
    fetchCommercialistes();
  }, []);

  const handleRecette = async (clientId, clientName) => {
    setCurrentPdfType("Recette");
    setCurrentCommercialName(clientName);
    setCurrentCommercialId(clientId);
    const apiUrl = "https://universellepeintre.oneposts.io/api/Commerces/GenerateRecettePdf";
    setCurrentApiUrl(apiUrl);
    await showPdfInPopup(apiUrl, clientId);
  };

  const handlePortefeuille = async (clientId, clientName) => {
    setCurrentPdfType("Portefeuille");
    setCurrentCommercialName(clientName);
    setCurrentCommercialId(clientId);
    const apiUrl = "https://universellepeintre.oneposts.io/api/Commerces/GenerateRecapPdf";
    setCurrentApiUrl(apiUrl);
    await showPdfInPopup(apiUrl, clientId);
  };

  const showPdfInPopup = async (fileUrl, id) => {
    const urlWithId = `${fileUrl}?idcomerce=${id}`;
    setIsPopupOpen(true);
    setIsLoading(true);
    setPdfUrl("");

    try {
      const response = await fetch(urlWithId, {
        method: "GET",
        headers: {
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        setPdfUrl(url);
      } else {
        const errorMessage = await response.text();
        alert(`Erreur lors du chargement: ${errorMessage}`);
        setIsPopupOpen(false);
      }
    } catch (error) {
      console.error("Error loading PDF:", error);
      alert(`Erreur lors du chargement : ${error.message}`);
      setIsPopupOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadPdf = async () => {
    if (!pdfUrl) {
      alert("Aucun PDF à télécharger.");
      return;
    }

    try {
      // Generate unique file name
      const timestamp = new Date()
        .toISOString()
        .replace(/[-:]/g, "")
        .replace(/\..+/, "")
        .replace("T", "_");
      const fileName = `${currentCommercialName}_${currentPdfType}_${timestamp}.pdf`;

      // Create download link
      const link = document.createElement("a");
      link.href = pdfUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      alert(`PDF téléchargé avec succès : ${fileName}`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert(`Erreur lors du téléchargement : ${error.message}`);
    }
  };

  const closePopup = () => {
    setIsPopupOpen(false);
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl("");
    setCurrentPdfType("");
    setCurrentCommercialName("");
    setCurrentCommercialId(null);
    setCurrentApiUrl("");
  };

  // Clean up blob URL when component unmounts
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        window.URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="portefeuilles-commercials">
      <h1 className="page-title">Portefeuilles des Commercials</h1>

      <div className="table-container">
        <table className="clients-table">
          <thead>
            <tr>
              <th>Nom et Prénom</th>
              <th>Numéro de Téléphone</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {commercialistes.map((commercialiste) => (
              <tr key={commercialiste.id}>
                <td>{commercialiste.nom}</td>
                <td>{commercialiste.telephone}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn recette-btn"
                      onClick={() =>
                        handleRecette(commercialiste.id, commercialiste.nom)
                      }
                    >
                      Recette
                    </button>
                    <button
                      className="action-btn portefeuille-btn"
                      onClick={() =>
                        handlePortefeuille(commercialiste.id, commercialiste.nom)
                      }
                    >
                      Portefeuille
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PDF Popup */}
      {isPopupOpen && (
        <>
          <div className="popup-overlay" onClick={closePopup}></div>
          <div className="pdf-popup">
            <div className="popup-header">
              <h2>
                {currentPdfType} - {currentCommercialName}
              </h2>
              <button className="close-btn" onClick={closePopup}>
                <X size={24} />
              </button>
            </div>
            <div className="popup-content">
              {isLoading ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Chargement du PDF...</p>
                </div>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="PDF Viewer"
                  className="pdf-viewer"
                />
              ) : (
                <div className="loading-container">
                  <p>Erreur de chargement du PDF</p>
                </div>
              )}
            </div>
            <div className="popup-footer">
              <button 
                className="download-btn" 
                onClick={downloadPdf}
                disabled={!pdfUrl || isLoading}
              >
                <Download size={20} />
                Télécharger
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PortefeuillesCommercials;