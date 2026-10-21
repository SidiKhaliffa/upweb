import React, { useState, useEffect, useMemo } from "react";
import { ChevronUp, ChevronDown, RefreshCw, Search } from "lucide-react";
import "./Statistiques.css";
import { useAuth } from "../hooks/useAuth";
import { API_BASE } from "../config";
import { formatAmount, formatNumber } from "../utils/format";

const formatCurrency = formatAmount;
const formatPercentage = (value) => `${(value || 0).toFixed(2)}%`;

// Validated categorical pair (slots 1 & 2) for the two-series stock chart.
const CHART_COLOR_FABRIQUE = "#2a78d6";
const CHART_COLOR_ACTUEL = "#eb6834";
// Single-series magnitude chart: app's own brand blue.
const CHART_COLOR_COVERAGE = "#1e4a72";

// The API appends summary rows to the product list; they are shown as
// totals, not as products.
const TOTAL_ROW = "Total";
const CHIFFRE_AFFAIRE_ROW = "Chiffre D'affaire Total";
// Country-wide coverage line appended to the zone list by the API.
const COUNTRY_ROW = "Mauritanie";
const ZONES_PREVIEW = 10;

const PRODUCT_COLUMNS = [
  { key: "produit", label: "Produit" },
  { key: "stockFabrique", label: "Stock fabriqué", format: formatNumber },
  { key: "stockActuel", label: "Stock actuel", format: formatNumber },
  { key: "pourcentageVente", label: "% des ventes", format: formatPercentage },
  { key: "pourcentageProd", label: "% vendu du produit", format: formatPercentage },
  { key: "montant", label: "Montant", format: formatCurrency },
];

const Bar = ({ value, max, color }) => (
  <div className="bar-track">
    <div
      className="bar-fill"
      style={{
        width: `${max > 0 ? Math.max(0, (value / max) * 100) : 0}%`,
        backgroundColor: color,
      }}
    />
  </div>
);

// Horizontal bars so full product names fit on any screen width.
const ProductStockChart = ({ data }) => {
  if (!data.length) return null;
  const max = Math.max(
    1,
    ...data.flatMap((item) => [item.stockFabrique || 0, item.stockActuel || 0])
  );

  return (
    <div className="chart-block">
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-swatch" style={{ backgroundColor: CHART_COLOR_FABRIQUE }} />
          Stock fabriqué
        </span>
        <span className="legend-item">
          <span className="legend-swatch" style={{ backgroundColor: CHART_COLOR_ACTUEL }} />
          Stock actuel
        </span>
      </div>
      <div className="bar-rows">
        {data.map((item) => (
          <div className="bar-row" key={item.produit}>
            <span className="bar-label" title={item.produit}>
              {item.produit}
            </span>
            <div className="bar-pair">
              <div className="bar-line">
                <Bar value={item.stockFabrique} max={max} color={CHART_COLOR_FABRIQUE} />
                <span className="bar-value">{formatNumber(item.stockFabrique)}</span>
              </div>
              <div className="bar-line">
                <Bar value={item.stockActuel} max={max} color={CHART_COLOR_ACTUEL} />
                <span className="bar-value">{formatNumber(item.stockActuel)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CoverageChart = ({ data }) => {
  const [showAll, setShowAll] = useState(false);
  if (!data.length) return null;

  const sorted = [...data].sort((a, b) => b.couverture - a.couverture);
  const visible = showAll ? sorted : sorted.slice(0, ZONES_PREVIEW);
  const max = Math.max(1, ...sorted.map((item) => item.couverture || 0));

  return (
    <div className="chart-block">
      <div className="bar-rows">
        {visible.map((item) => (
          <div className="bar-row coverage-row" key={item.adresse}>
            <span className="bar-label" title={item.adresse}>
              {item.adresse}
            </span>
            <div className="bar-line">
              <Bar value={item.couverture} max={max} color={CHART_COLOR_COVERAGE} />
              <span className="bar-value">{formatPercentage(item.couverture)}</span>
            </div>
          </div>
        ))}
      </div>
      {sorted.length > ZONES_PREVIEW && (
        <button
          type="button"
          className="show-more-button"
          onClick={() => setShowAll((prev) => !prev)}
        >
          {showAll
            ? "Afficher moins"
            : `Afficher les ${sorted.length} zones`}
        </button>
      )}
    </div>
  );
};

const Statistiques = () => {
  const { authFetch, ensureFreshToken } = useAuth();
  const [productStats, setProductStats] = useState([]);
  const [totals, setTotals] = useState(null);
  const [coverageStats, setCoverageStats] = useState([]);
  const [countryCoverage, setCountryCoverage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "produit", direction: "asc" });

  useEffect(() => {
    ensureFreshToken();
  }, []);

  const fetchStatistics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/Statistique`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const statistiques = await response.json();

      const rows = (statistiques?.statistiquProduits || []).map((item) => ({
        produit: item.produit,
        stockFabrique: item.stock_fabrique,
        stockActuel: item.stock_actuel,
        pourcentageVente: item.pourcentage_vent,
        pourcentageProd: item.pourcentage_produit,
        // The API sends camelCase "montant"; "Montant" was always undefined.
        montant: item.montant ?? item.Montant ?? 0,
      }));
      const summaryNames = [TOTAL_ROW, CHIFFRE_AFFAIRE_ROW];
      const products = rows.filter((row) => !summaryNames.includes(row.produit));
      setProductStats(products);
      setTotals({
        stockFabrique: products.reduce((sum, p) => sum + (p.stockFabrique || 0), 0),
        stockActuel: products.reduce((sum, p) => sum + (p.stockActuel || 0), 0),
        montant: products.reduce((sum, p) => sum + (p.montant || 0), 0),
      });

      const zones = (statistiques?.coverageDatas || []).map((item) => ({
        adresse: item.address,
        couverture: parseFloat(item.coverage) || 0,
      }));
      setCoverageStats(zones.filter((zone) => zone.adresse !== COUNTRY_ROW));
      setCountryCoverage(
        zones.find((zone) => zone.adresse === COUNTRY_ROW)?.couverture ?? null
      );
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

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "produit" ? "asc" : "desc" }
    );
  };

  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
  };

  const filteredAndSortedProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const filtered = term
      ? productStats.filter((item) => item.produit?.toLowerCase().includes(term))
      : productStats;

    const { key, direction } = sortConfig;
    const factor = direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) =>
      key === "produit"
        ? factor * (a.produit || "").localeCompare(b.produit || "")
        : factor * ((a[key] || 0) - (b[key] || 0))
    );
  }, [productStats, searchTerm, sortConfig]);

  const summaryCards = [
    { label: "Produits", value: formatNumber(productStats.length) },
    { label: "Stock fabriqué", value: formatNumber(totals?.stockFabrique) },
    { label: "Stock actuel", value: formatNumber(totals?.stockActuel) },
    { label: "Chiffre d'affaires", value: formatCurrency(totals?.montant) },
    { label: "Zones couvertes", value: formatNumber(coverageStats.length) },
    {
      label: "Couverture Mauritanie",
      value: countryCoverage === null ? "—" : formatPercentage(countryCoverage),
    },
  ];

  return (
    <div className="statistiques">
      <div className="statistiques-header">
        <h1 className="page-title">Statistiques</h1>
        <button
          type="button"
          className="refresh-button"
          onClick={fetchStatistics}
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "spinning" : ""} />
          <span>Actualiser</span>
        </button>
      </div>

      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button type="button" className="retry-button" onClick={fetchStatistics}>
            <RefreshCw size={14} />
            Réessayer
          </button>
        </div>
      )}

      <div className="summary-cards">
        {summaryCards.map((card) => (
          <div className="summary-card" key={card.label}>
            <h3>{card.label}</h3>
            <div className="summary-value">{isLoading ? "…" : card.value}</div>
          </div>
        ))}
      </div>

      <div className="stats-section">
        <h2 className="section-title">Stock par produit</h2>
        <ProductStockChart data={productStats} />
      </div>

      <div className="stats-section">
        <div className="section-header">
          <h2 className="section-title">Détail des produits</h2>
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
          <table className="stats-table">
            <thead>
              <tr>
                {PRODUCT_COLUMNS.map((column) => (
                  <th
                    key={column.key}
                    className={`sortable ${column.format ? "numeric" : ""}`}
                    onClick={() => handleSort(column.key)}
                  >
                    {column.label} {renderSortIcon(column.key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedProducts.length > 0 ? (
                filteredAndSortedProducts.map((product) => (
                  <tr key={product.produit}>
                    {PRODUCT_COLUMNS.map((column) => (
                      <td
                        key={column.key}
                        data-label={column.format ? column.label : undefined}
                        className={column.format ? "numeric" : "product-name"}
                      >
                        {column.format ? column.format(product[column.key]) : product[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={PRODUCT_COLUMNS.length} className="no-data">
                    {isLoading
                      ? "Chargement..."
                      : productStats.length > 0
                      ? "Aucun produit ne correspond à la recherche"
                      : "Aucune donnée disponible"}
                  </td>
                </tr>
              )}
            </tbody>
            {totals && productStats.length > 0 && (
              <tfoot>
                <tr>
                  <td className="product-name">Total</td>
                  <td className="numeric" data-label="Stock fabriqué">
                    {formatNumber(totals.stockFabrique)}
                  </td>
                  <td className="numeric" data-label="Stock actuel">
                    {formatNumber(totals.stockActuel)}
                  </td>
                  <td className="numeric empty-cell" />
                  <td className="numeric empty-cell" />
                  <td className="numeric" data-label="Montant">
                    {formatCurrency(totals.montant)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="stats-section">
        <h2 className="section-title">Couverture par zone</h2>
        <p className="section-subtitle">Part des clients dans chaque zone</p>
        {coverageStats.length > 0 ? (
          <CoverageChart data={coverageStats} />
        ) : (
          <p className="no-data">{isLoading ? "Chargement..." : "Aucune donnée disponible"}</p>
        )}
      </div>
    </div>
  );
};

export default Statistiques;
