import React, { useState } from "react";
import { Calendar } from "lucide-react";
import "./RecetteHistorique.css";

const RecetteHistorique = () => {
  const [formData, setFormData] = useState({
    dateRecette: "",
  });

  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (error) {
      setError("");
    }
  };

  const validateDateFormat = (dateString) => {
    // Convert date to dd.MM.yyyy format for validation (matching C# logic)
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("de-DE"); // dd.MM.yyyy format

    // Validate the format matches dd.MM.yyyy
    const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
    return dateRegex.test(formattedDate);
  };

  const getHistoriqueRecette = async (selectedDate) => {
    try {
      setLoading(true);
      setError("");

      // Format date as yyyy-MM-dd for API (matching C# ToString("yyyy-MM-dd"))
      const formattedDate = new Date(selectedDate).toISOString().split("T")[0];

      // Construct URL with date parameter (matching C# logic)
      const url = `https://universellepeintre.oneposts.io/api/Stock/RecetteHistorique?date=${formattedDate}`;

      // Make GET request with Authorization header
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        // Read response as JSON (matching C# deserialization)
        const historiqueRecettes = await response.json();

        // Log for debugging (matching C# Console.WriteLine)
        console.log("Response:", historiqueRecettes);

        // Set results to display in table
        setSearchResults(
          Array.isArray(historiqueRecettes) ? historiqueRecettes : []
        );
      } else {
        // Handle error response (matching C# error handling)
        console.error(`Error: ${response.statusText}`);
        setError(
          `Erreur lors de la récupération des données: ${response.statusText}`
        );
      }
    } catch (error) {
      // Handle different types of errors (matching C# exception handling)
      if (error.name === "TypeError" && error.message.includes("fetch")) {
        console.error(`Erreur de requête HTTP: ${error.message}`);
        setError("Erreur de connexion au serveur");
      } else if (error.message.includes("JSON")) {
        console.error(`Erreur de désérialisation JSON: ${error.message}`);
        setError("Erreur lors du traitement des données");
      } else {
        console.error(`Une erreur s'est produite: ${error.message}`);
        setError(error.message || "Une erreur inattendue s'est produite");
      }

      // Fallback demo data for testing in Claude.ai
      // if (!authToken) {
      //   setSearchResults([
      //     {
      //       date: '9/24/2025 12:00:00 AM',
      //       nom: 'siditest',
      //       codeClient: '100100',
      //       recette: 10.00
      //     }
      //   ]);
      // }
    } finally {
      setLoading(false);
    }
  };

  const handleRechercher = async () => {
    // Validate that date is selected
    if (!formData.dateRecette) {
      setError("Veuillez sélectionner une date");
      return;
    }

    // // Validate date format (matching C# validation logic)
    // if (!validateDateFormat(formData.dateRecette)) {
    //   setError('Le format de la date doit être \'dd.MM.yyyy\'.');
    //   return;
    // }

    // Call API to get historical recipe data
    await getHistoriqueRecette(formData.dateRecette);
  };

  const handleRetourner = () => {
    setSearchResults(null);
    setError("");
    setFormData({ dateRecette: "" });
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString("fr-FR") +
        " " +
        date.toLocaleTimeString("fr-FR")
      );
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  return (
    <div className="recette-historique">
      <h1 className="page-title">Recette Historique</h1>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {!searchResults ? (
        <div className="search-container">
          <div className="form-group">
            <label htmlFor="dateRecette">Date de Recette*</label>
            <div className="date-input-container">
              <input
                type="date"
                id="dateRecette"
                name="dateRecette"
                value={formData.dateRecette}
                onChange={handleInputChange}
                className="form-input date-input"
                disabled={loading}
              />
              {/* <Calendar className="date-icon" size={20} /> */}
            </div>
          </div>

          <div className="search-actions">
            <button
              type="button"
              onClick={handleRechercher}
              className="search-btn"
              disabled={loading || !formData.dateRecette}
            >
              {loading ? "Recherche en cours..." : "Rechercher"}
            </button>
          </div>
        </div>
      ) : (
        <div className="results-container">
          <div className="results-header">
            <h2>
              Recette Historique pour le:{" "}
              {new Date(formData.dateRecette).toLocaleDateString("fr-FR")}
            </h2>
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
                  <th>Date</th>
                  <th>Nom</th>
                  <th>Code client</th>
                  <th>Recette</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length > 0 ? (
                  searchResults.map((item, index) => (
                    <tr key={index}>
                      <td className="date">{formatDate(item.date)}</td>
                      <td className="nom">{item.name}</td>
                      <td className="code-client">{item.codeClient}</td>
                      <td className="recette">
                        {item.recette} MRU
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="no-data">
                      Aucune recette trouvée pour cette date
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {searchResults.length > 0 && (
            <div className="summary-section">
              <div className="summary-card">
                <h3>Total des recettes</h3>
                <div className="summary-value">
                  {searchResults.reduce(
                    (sum, item) => sum + (item.recette || 0),
                    0
                  )} MRU
                </div>
              </div>
              <div className="summary-card">
                <h3>Nombre de transactions</h3>
                <div className="summary-value">{searchResults.length}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecetteHistorique;
