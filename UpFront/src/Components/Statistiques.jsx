import React, { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, RefreshCw, Search } from "lucide-react";
import "./Statistiques.css";
import { useAuth } from "../hooks/useAuth";

const numberFormatter = new Intl.NumberFormat("fr-FR");
const formatNumber = (value) => numberFormatter.format(value || 0);
const formatCurrency = (value) => `${formatNumber(value)} MRU`;

// Validated categorical pair (slots 1 & 2) for the two-series stock chart.
const CHART_COLOR_FABRIQUE = "#2a78d6";
const CHART_COLOR_ACTUEL = "#eb6834";
// Single-series magnitude chart: app's own brand blue.
const CHART_COLOR_COVERAGE = "#1e4a72";

const roundedTopBarPath = (x, y, width, height, radius) => {
  if (height <= 0) return "";
  const r = Math.min(radius, width / 2, height);
  return `M ${x},${y + height} L ${x},${y + r} Q ${x},${y} ${x + r},${y} L ${
    x + width - r
  },${y} Q ${x + width},${y} ${x + width},${y + r} L ${x + width},${
    y + height
  } Z`;
};

const roundedRightBarPath = (x, y, width, height, radius) => {
  if (width <= 0) return "";
  const r = Math.min(radius, height / 2, width);
  return `M ${x},${y} L ${x + width - r},${y} Q ${x + width},${y} ${
    x + width
  },${y + r} L ${x + width},${y + height - r} Q ${x + width},${y + height} ${
    x + width - r
  },${y + height} L ${x},${y + height} Z`;
};

const ProductStockChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);

  if (!data.length) return null;

  const maxValue = Math.max(
    1,
    ...data.flatMap((item) => [item.stockFabrique || 0, item.stockActuel || 0])
  );
  const barWidth = 18;
  const barGap = 2;
  const groupGap = 26;
  const groupWidth = barWidth * 2 + barGap;
  const chartHeight = 180;
  const chartWidth = data.length * (groupWidth + groupGap);
  const scaleY = (value) => (value / maxValue) * chartHeight;

  return (
    <div className="chart-block">
      <div className="chart-legend">
        <span className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: CHART_COLOR_FABRIQUE }}
          />
          Stock Fabriqué
        </span>
        <span className="legend-item">
          <span
            className="legend-swatch"
            style={{ backgroundColor: CHART_COLOR_ACTUEL }}
          />
          Stock Actuel
        </span>
      </div>
      <div className="table-container chart-scroll">
        <svg
          width={chartWidth}
          height={chartHeight + 36}
          role="img"
          aria-label="Comparaison du stock fabriqué et du stock actuel par produit"
        >
          <line
            x1={0}
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#c3c2b7"
            strokeWidth="1"
          />
          {data.map((item, index) => {
            const groupX = index * (groupWidth + groupGap);
            const fabriqueHeight = scaleY(item.stockFabrique || 0);
            const actuelHeight = scaleY(item.stockActuel || 0);
            const label =
              item.produit && item.produit.length > 9
                ? `${item.produit.slice(0, 8)}…`
                : item.produit;
            return (
              <g key={`${item.produit}-${index}`}>
                <path
                  d={roundedTopBarPath(
                    groupX,
                    chartHeight - fabriqueHeight,
                    barWidth,
                    fabriqueHeight,
                    4
                  )}
                  fill={CHART_COLOR_FABRIQUE}
                  onMouseEnter={() =>
                    setHovered({
                      produit: item.produit,
                      series: "Stock Fabriqué",
                      value: item.stockFabrique,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                />
                <path
                  d={roundedTopBarPath(
                    groupX + barWidth + barGap,
                    chartHeight - actuelHeight,
                    barWidth,
                    actuelHeight,
                    4
                  )}
                  fill={CHART_COLOR_ACTUEL}
                  onMouseEnter={() =>
                    setHovered({
                      produit: item.produit,
                      series: "Stock Actuel",
                      value: item.stockActuel,
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                />
                <text
                  x={groupX + barWidth + barGap / 2}
                  y={chartHeight + 18}
                  textAnchor="middle"
                  className="chart-axis-label"
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="chart-tooltip" aria-live="polite">
        {hovered
          ? `${hovered.produit} — ${hovered.series} : ${formatNumber(
              hovered.value
            )}`
          : "Survolez une barre pour voir le détail"}
      </div>
    </div>
  );
};

const CoverageChart = ({ data }) => {
  const [hovered, setHovered] = useState(null);

  if (!data.length) return null;

  const sorted = [...data].sort((a, b) => b.couverture - a.couverture);
  const maxValue = Math.max(100, ...sorted.map((item) => item.couverture || 0));
  const barHeight = 18;
  const chartWidthScale = 100; // percentage-of-row width unit, scaled by CSS

  return (
    <div className="chart-block">
      <div className="coverage-chart-rows">
        {sorted.map((item, index) => {
          const widthPct = ((item.couverture || 0) / maxValue) * chartWidthScale;
          return (
            <div
              className="coverage-chart-row"
              key={`${item.adresse}-${index}`}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="coverage-chart-label">{item.adresse}</span>
              <div className="coverage-chart-track">
                <svg
                  width="100%"
                  height={barHeight}
                  viewBox={`0 0 100 ${barHeight}`}
                  preserveAspectRatio="none"
                  role="img"
                  aria-label={`${item.adresse} : ${item.couverture?.toFixed(2)}%`}
                >
                  <path
                    d={roundedRightBarPath(0, 0, widthPct, barHeight, 4)}
                    fill={CHART_COLOR_COVERAGE}
                  />
                </svg>
              </div>
              <span className="coverage-chart-value">
                {(item.couverture || 0).toFixed(2)}%
              </span>
            </div>
          );
        })}
      </div>
      <div className="chart-tooltip" aria-live="polite">
        {hovered
          ? `${hovered.adresse} : ${(hovered.couverture || 0).toFixed(2)}%`
          : "Survolez une zone pour voir le détail"}
      </div>
    </div>
  );
};

const Statistiques = () => {
  const { authFetch, ensureFreshToken } = useAuth();
  const [productStats, setProductStats] = useState([]);
  const [coverageStats, setCoverageStats] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    ensureFreshToken();
  }, []);

  // Function to fetch statistics from API
  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch(
        "https://api.universellepeinture.com/api/Statistique",
        {
          method: "GET",
          headers: {
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
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "produit",
    direction: "asc",
  });

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" }
    );
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <ChevronUp size={14} />
    ) : (
      <ChevronDown size={14} />
    );
  };

  const filteredAndSortedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? productStats.filter((item) =>
          item.produit?.toLowerCase().includes(term)
        )
      : productStats;

    const { key, direction } = sortConfig;
    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      if (typeof aVal === "string" || typeof bVal === "string") {
        return direction === "asc"
          ? (aVal || "").localeCompare(bVal || "")
          : (bVal || "").localeCompare(aVal || "");
      }
      return direction === "asc"
        ? (aVal || 0) - (bVal || 0)
        : (bVal || 0) - (aVal || 0);
    });
    return sorted;
  }, [productStats, searchTerm, sortConfig]);

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

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button
            type="button"
            className="retry-button"
            onClick={fetchStatistics}
          >
            <RefreshCw size={14} />
            Réessayer
          </button>
        </div>
      )}

      {isLoading && (
        <div className="loading">Chargement des statistiques...</div>
      )}

      <div className="statistics-container">
        {/* Products Statistics Table */}
        <div className="stats-section">
          <h2 className="section-title">Statistiques des Produits</h2>

          <ProductStockChart data={productStats} />

          <div className="table-toolbar">
            <div className="search-input-group">
              <Search size={16} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="table-container">
            <table className="stats-table products-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => handleSort("produit")}>
                    Produit {renderSortIcon("produit")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("stockFabrique")}
                  >
                    Stock Fabriqué {renderSortIcon("stockFabrique")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("stockActuel")}
                  >
                    Stock Actuel {renderSortIcon("stockActuel")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("pourcentageVente")}
                  >
                    Pourcentage de Vente {renderSortIcon("pourcentageVente")}
                  </th>
                  <th
                    className="sortable"
                    onClick={() => handleSort("pourcentageProd")}
                  >
                    Pourcentage par prod {renderSortIcon("pourcentageProd")}
                  </th>
                  <th className="sortable" onClick={() => handleSort("montant")}>
                    Montant {renderSortIcon("montant")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.length > 0 ? (
                  filteredAndSortedProducts.map((product, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "even-row" : "odd-row"}
                    >
                      <td className="product-name">{product.produit}</td>
                      <td className="numeric-value">
                        {formatNumber(product.stockFabrique)}
                      </td>
                      <td className="numeric-value">
                        {formatNumber(product.stockActuel)}
                      </td>
                      <td className="numeric-value">
                        {formatPercentage(product.pourcentageVente)}
                      </td>
                      <td className="numeric-value">
                        {formatPercentage(product.pourcentageProd)}
                      </td>
                      <td className="currency-value">
                        {formatCurrency(product.montant)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="no-data">
                      {isLoading
                        ? "Chargement..."
                        : productStats.length > 0
                        ? "Aucun produit ne correspond à la recherche"
                        : "Aucune donnée disponible"}
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

          <CoverageChart data={coverageStats} />

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
          <div className="summary-value">{formatCurrency(getTotalMontant())}</div>
        </div>
        <div className="summary-card">
          <h3>Stock Moyen</h3>
          <div className="summary-value">{formatNumber(getAverageStock())}</div>
        </div>
      </div>
    </div>
  );
};

export default Statistiques;
