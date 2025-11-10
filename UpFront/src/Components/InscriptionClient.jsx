import React, { useState } from "react";
import "./InscriptionClient.css";
import { useNavigate } from "react-router-dom";

const InscriptionClient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    code: "",
    zone: "",
    nomSociete: "",
    recommandation: "",
    Respnsible_Name: "",
    Phone_Number: "",
    coordonneesGPS: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    console.log("Inscription data:", formData);
    // Handle form submission here

    const currentTime = new Date().toISOString();

    if(new Date(currentTime) > new Date(localStorage.getItem("expiration"))) {
      try {
        const refreshResponse = await fetch("https://universellepeintre.oneposts.io/api/User/refresh", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            refreshToken: localStorage.getItem("refreshToken"),
          }),
        });
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

    try {
      const response = await fetch(
        "https://universellepeintre.oneposts.io/api/Clients",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify(formData),
        }
      );
      const data = await response.json();
      if (response.ok) {
        alert("Client inscrit avec succès!");
        setFormData({
          code: "",
          zone: "",
          nomSociete: "",
          recommandation: "",
          Respnsible_Name: "",
          Phone_Number: "",
          coordonneesGPS: "",
        });
      } else {
        alert(data.message || "Erreur lors de l'inscription du client.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Une erreur est survenue lors de l'inscription.");
    }
  };

  return (
    <div className="inscription-client">
      <h1 className="page-title">Inscription Du Client</h1>

      <div className="form-container">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="code">Code*</label>
            <input
              type="text"
              id="code"
              name="code"
              value={formData.code}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="zone">Zone *</label>
            <input
              type="text"
              id="zone"
              name="zone"
              value={formData.zone}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nomSociete">Nom de la Societe</label>
            <input
              type="text"
              id="nomSociete"
              name="nomSociete"
              value={formData.nomSociete}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="recommandation">Recommandation</label>
            <input
              type="text"
              id="recommandation"
              name="recommandation"
              value={formData.recommandation}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="Respnsible_Name">Nom du responsable *</label>
            <input
              type="text"
              id="Respnsible_Name"
              name="Respnsible_Name"
              value={formData.Respnsible_Name}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Phone_Number">Numero de Telephone*</label>
            <input
              type="tel"
              id="Phone_Number"
              name="Phone_Number"
              value={formData.Phone_Number}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label htmlFor="coordonneesGPS">CoordonneesGPS</label>
            <input
              type="text"
              id="coordonneesGPS"
              name="coordonneesGPS"
              value={formData.coordonneesGPS}
              onChange={handleInputChange}
              className="form-input"
            />
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

export default InscriptionClient;
