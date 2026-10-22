import React, { useState, useEffect } from "react";
import "./Recette.css";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";

const Recette = () => {
  const { authFetch, ensureFreshToken, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState({
    CodeClient: "",
    priseCompta: "",
    Recette_Date: "",
  });

  useEffect(() => {
    ensureFreshToken();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    console.log("Recette data:", formData);
    if (!formData.Recette_Date) {
      toast.error("Veuillez sélectionner une date de recette.");
      return;
    } else if (
      !formData.priseCompta ||
      isNaN(formData.priseCompta) ||
      Number(formData.priseCompta) <= 0
    ) {
      toast.error("Veuillez entrer un montant de recette valide.");
      return;
    } else if (!formData.CodeClient) {
      toast.error("Veuillez entrer un code client.");
      return;
    }

    try {
      if (getRoleClaim()?.[1] == "Admin") {
        toast.error(
          "Vous n'avez pas les droits nécessaires pour enregistrer une recette."
        );
        return;
      }
      const response = await authFetch(
        `${API_BASE}/Stock/recette`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      if (response.ok) {
        toast.success("Recette enregistrée.");
        setFormData({
          CodeClient: "",
          priseCompta: "",
          Recette_Date: "",
        });
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'enregistrement de la recette.");
    }
  };

  return (
    <div className="recette">
      <h1 className="page-title">Recette</h1>

      <div className="form-container">
        <div className="form-group">
          <label htmlFor="CodeClient">Code Client</label>
          <input
            type="text"
            id="CodeClient"
            name="CodeClient"
            value={formData.CodeClient}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Entrez le code client"
          />
        </div>

        <div className="form-group">
          <label htmlFor="priseCompta">Montant de la Recette</label>
          <input
            type="number"
            id="priseCompta"
            name="priseCompta"
            value={formData.priseCompta}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Entrez le montant de la recette"
            step="0.01"
          />
        </div>

        <div className="form-group">
          <label htmlFor="Recette_Date">Date de Recette*</label>
          <div className="date-input-container">
            <input
              type="date"
              id="Recette_Date"
              name="Recette_Date"
              value={formData.Recette_Date}
              onChange={handleInputChange}
              className="form-input date-input"
            />
            {/* <Calendar className="date-icon" size={20} /> */}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleSubmit} className="submit-btn">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default Recette;
