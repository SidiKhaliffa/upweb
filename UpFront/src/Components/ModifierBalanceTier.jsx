import React, { useState, useEffect } from "react";
import "./ModifierBalanceTier.css";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { readErrorMessage } from "../utils/http";
import { toast } from "../utils/toast";

const ModifierBalanceTier = () => {
  const { authFetch, ensureFreshToken, getRoleClaim } = useAuth();
  const [formData, setFormData] = useState({
    CodeClient: "",
    priseCompta: "",
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
    // Handle form submission here
    try {
      if (getRoleClaim()?.[1] == "Admin") {
        toast.error(
          "Vous n'avez pas les droits nécessaires pour modifier la balance."
        );
        return;
      }
      const response = await authFetch(
        `${API_BASE}/Stock/PriseCompta`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        }
      );
      // const data = await response.json();
      if (response.ok) {
        toast.success("Balance du client modifiée.");
        setFormData({
          CodeClient: "",
          priseCompta: "",
        });
      } else {
        toast.error(await readErrorMessage(response));
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Une erreur est survenue lors de la modification de la balance.");
    }
  };

  return (
    <div className="modifier-balance-tier">
      <h1 className="page-title">Balance client</h1>

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
          <label htmlFor="priseCompta">Montant de la Balance</label>
          <input
            type="number"
            id="priseCompta"
            name="priseCompta"
            value={formData.priseCompta}
            onChange={handleInputChange}
            className="form-input"
            placeholder="Entrez le montant"
            step="0.01"
          />
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

export default ModifierBalanceTier;
