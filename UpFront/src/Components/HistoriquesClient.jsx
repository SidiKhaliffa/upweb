import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './HistoriquesClient.css';

const HistoriquesClient = ({ authToken }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    codeClient: ''
  });
  
  const [searchResults, setSearchResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRechercher = async () => {
    if (!formData.codeClient.trim()) {
      alert('Veuillez entrer un code client');
      return;
    }

    console.log('Recherche historique pour client:', formData.codeClient);
    setIsLoading(true);
    setError(null);

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
        `https://universellepeintre.oneposts.io/api/Historique?codeclient=${formData.codeClient}`, 
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem("token")}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Données reçues:', data);
        setSearchResults(data);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Erreur lors de la récupération de l\'historique.');
      
      if (!authToken) {
        setSearchResults([
          {
            produit: 'Chiffre D\'affaire',
            quantite: 0,
            montant: 0,
            date: '1/1/0001 12:00:00 AM'
          }
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetourner = () => {
    setSearchResults(null);
    setError(null);
    setFormData({ codeClient: '' });
  };

  const formatDate = (dateString) => {
    if (dateString === '1/1/0001 12:00:00 AM') {
      return 'N/A';
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="historiques-client">
      <h1 className="page-title">Historiques du Client</h1>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {!searchResults ? (
        <div className="search-container">
          <div className="form-group">
            <label htmlFor="codeClient">Code de Client</label>
            <input
              type="text"
              id="codeClient"
              name="codeClient"
              value={formData.codeClient}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Entrez le code client"
              disabled={isLoading}
            />
          </div>

          <div className="search-actions">
            <button 
              type="button" 
              onClick={handleRechercher} 
              className="search-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Recherche...' : 'Rechercher'}
            </button>
          </div>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <h2>Historique pour le client: {formData.codeClient}</h2>
            <button 
              type="button" 
              onClick={handleRetourner} 
              className="return-btn"
            >
              Retourner
            </button>
          </div>

          <div className="table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Quantité</th>
                  <th>Montant</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <tr key={index}>
                      <td className="product-name">{item.produit}</td>
                      <td className="quantity">{item.quantite}</td>
                      <td className="amount">{item.montant}</td>
                      <td className="date">{formatDate(item.date)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      Aucun historique trouvé pour ce client
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoriquesClient;