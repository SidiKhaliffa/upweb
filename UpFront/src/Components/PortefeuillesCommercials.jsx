import React, { useState, useEffect, useCallback } from "react";
import "./PortefeuillesCommercials.css";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import PdfViewer from "./PdfViewer";

const PortefeuillesCommercials = () => {
  const { authFetch, ensureFreshToken } = useAuth();
  const [commercialistes, setCommercialistes] = useState([]);
  const [pdf, setPdf] = useState(null);
  const closePdf = useCallback(() => setPdf(null), []);

  useEffect(() => {
    ensureFreshToken();
  }, []);

  const fetchCommercialistes = async () => {
    try {
      const response = await authFetch(
        `${API_BASE}/Commerces`,
        {
          method: "GET",
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

  const handleRecette = (id, nom) =>
    setPdf({
      title: `Recette – ${nom}`,
      url: `${API_BASE}/Commerces/GenerateRecettePdf?idcomerce=${id}`,
      fileName: `Recette_${nom}.pdf`,
    });

  const handlePortefeuille = (id, nom) =>
    setPdf({
      title: `Portefeuille – ${nom}`,
      url: `${API_BASE}/Commerces/GenerateRecapPdf?idcomerce=${id}`,
      fileName: `Portefeuille_${nom}.pdf`,
    });

  return (
    <div className="portefeuilles-commercials">
      <h1 className="page-title">Portefeuilles commerciaux</h1>

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
                        handlePortefeuille(
                          commercialiste.id,
                          commercialiste.nom
                        )
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

      <PdfViewer pdf={pdf} onClose={closePdf} />
    </div>
  );
};

export default PortefeuillesCommercials;
