import React, { useState } from 'react';
import './ModifierBalanceTier.css';
import { useNavigate } from 'react-router-dom';

const ModifierBalanceTier = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    CodeClient: '',
    priseCompta: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    console.log('Balance Tier data:', formData);
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
      const response = await fetch('https://universellepeintre.oneposts.io/api/Stock/PriseCompta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + localStorage.getItem('token')
        },
        body: JSON.stringify(formData)
      });
      // const data = await response.json();
      if (response.ok) {
        alert('Balance du tier modifiée avec succès!');
        setFormData({
          CodeClient: '',
          priseCompta: ''
        });
      } else {
        alert('Erreur lors de la modification de la balance du tier.');
      }
    }
    catch (error) {
      console.error('Error:', error);
      alert('Une erreur est survenue lors de la modification de la balance.');
    }
  };

  return (
    <div className="modifier-balance-tier">
      <h1 className="page-title">Modifier Balance Tier</h1>
      
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
