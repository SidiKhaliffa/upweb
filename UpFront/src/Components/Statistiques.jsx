import React, { useState, useEffect } from "react";
import "./Statistiques.css";

const Statistiques = ({ authToken }) => {
  const [productStats, setProductStats] = useState([]);
  const [coverageStats, setCoverageStats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to fetch statistics from API
  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        "https://universellepeintre.oneposts.io/api/Statistique",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const jsonString = await response.text();
        const statistiques = JSON.parse(jsonString);

        console.log("Statistics loaded:", statistiques);

        if (statistiques) {
          if (statistiques.statistiquProduits) {
            const mappedProducts = statistiques.statistiquProduits.map(
              (item) => ({
                produit: item.produit,
                stockFabrique: item.stock_fabrique,
                stockActuel: item.stock_actuel,
                pourcentageVente: item.pourcentage_vent,
                pourcentageProd: item.pourcentage_produit,
                montant: item.Montant || 0,
              })
            );
            setProductStats(mappedProducts);
          }

          if (statistiques.coverageDatas) {
            const mappedCoverage = statistiques.coverageDatas.map((item) => ({
              adresse: item.address,
              couverture: parseFloat(item.coverage), // Convert to number, default to 0
            }));
            setCoverageStats(mappedCoverage);
          }
        }
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      setError("Erreur lors du chargement des statistiques");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [authToken]);

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(2)}%`;
  };

  const getTotalMontant = () => {
    return productStats.reduce((sum, item) => sum + (item.montant || 0), 0);
  };

  const getAverageStock = () => {
    if (productStats.length === 0) return 0;
    const totalStock = productStats.reduce(
      (sum, item) => sum + (item.stockActuel || 0),
      0
    );
    return (totalStock / productStats.length).toFixed(0);
  };

  return (
    <div className="statistiques">
      <h1 className="page-title">Statistiques</h1>

      {error && <div className="error-message">{error}</div>}

      {isLoading && (
        <div className="loading">Chargement des statistiques...</div>
      )}

      <div className="statistics-container">
        {/* Products Statistics Table */}
        <div className="stats-section">
          <h2 className="section-title">Statistiques des Produits</h2>
          <div className="table-container">
            <table className="stats-table products-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Stock Fabriqué</th>
                  <th>Stock Actuel</th>
                  <th>Pourcentage de Vente</th>
                  <th>Pourcentage par prod</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {productStats.length > 0 ? (
                  productStats.map((product, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      <td className="product-name">{product.produit}</td>
                      <td className="numeric-value">{product.stockFabrique}</td>
                      <td className="numeric-value">{product.stockActuel}</td>
                      <td className="numeric-value">
                        {formatPercentage(product.pourcentageVente)}
                      </td>
                      <td className="numeric-value">
                        {formatPercentage(product.pourcentageProd)}
                      </td>
                      <td className="currency-value">
                        {product.montant}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      {isLoading ? "Chargement..." : "Aucune donnée disponible"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coverage Statistics Table */}
        <div className="stats-section">
          <h2 className="section-title">Couverture par Zone</h2>
          <div className="table-container">
            <table className="stats-table coverage-table">
              <thead>
                <tr>
                  <th>Adresse</th>
                  <th>Couverture (%)</th>
                </tr>
              </thead>
              <tbody>
                {coverageStats.length > 0 ? (
                  coverageStats.map((location, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      <td className="address-name">{location.adresse}</td>
                      <td className="coverage-value">
                        {location.couverture.toFixed(2)}%
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="2" className="no-data">
                      {isLoading ? "Chargement..." : "Aucune donnée disponible"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <h3>Total Produits</h3>
          <div className="summary-value">{productStats.length}</div>
        </div>
        <div className="summary-card">
          <h3>Zones Couvertes</h3>
          <div className="summary-value">{coverageStats.length}</div>
        </div>
        <div className="summary-card">
          <h3>Couverture Moyenne</h3>
          <div className="summary-value">
            {coverageStats.length > 0
              ? `${(
                  coverageStats.reduce(
                    (sum, item) => sum + (parseFloat(item.couverture) || 0),
                    0
                  ) / coverageStats.length
                ).toFixed(2)}%`
              : "0%"}
          </div>
        </div>
        <div className="summary-card">
          <h3>Montant Total</h3>
          <div className="summary-value">{getTotalMontant()}</div>
        </div>
        <div className="summary-card">
          <h3>Stock Moyen</h3>
          <div className="summary-value">{getAverageStock()}</div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;