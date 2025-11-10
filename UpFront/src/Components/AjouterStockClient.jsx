// import React, { useState, useEffect } from "react";
// import { ChevronDown, Calendar } from "lucide-react";
// import "./AjouterStockClient.css";

// const AjouterStockClient = () => {
//   const [formData, setFormData] = useState({
//     CodeClient: "",
//     Visit_date: "",
//     produit1: "",
//     quantite1: "",
//     produit2: "",
//     quantite2: "",
//     produit3: "",
//     quantite3: "",
//     produit4: "",
//     quantite4: "",
//     produit5: "",
//     quantite5: "",
//     produit6: "",
//     Description: "",
//   });

//   const [dropdowns, setDropdowns] = useState({
//     produit1: false,
//     produit2: false,
//     produit3: false,
//     produit4: false,
//     produit5: false,
//     produit6: false,
//   });

//   const [productList, setProductList] = useState([]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: value,
//     }));
//   };

//   const toggleDropdown = (dropdown) => {
//     setDropdowns((prev) => ({
//       ...prev,
//       [dropdown]: !prev[dropdown],
//     }));
//   };

//   const selectProduit = (dropdown, produit) => {
//     setFormData((prev) => ({
//       ...prev,
//       [dropdown]: produit,
//     }));
//     setDropdowns((prev) => ({
//       ...prev,
//       [dropdown]: false,
//     }));
//   };

//   const fetchProduits = async () => {
//     console.log("Fetching produits...");
//     try {
//       const response = await fetch(
//         "https://universellepeintre.oneposts.io/api/Stock/Produits",
//         {
//           method: "GET",
//           headers: {
//             Authorization: "Bearer " + localStorage.getItem("token"),
//           },
//         }
//       );
//       const data = await response.json();
//       console.log("Produits fetched:", data);
//       if(!response.ok) {
//         throw new Error(data.message || "Failed to fetch produits");
//       }
//       setProductList(data);
//     } catch (error) {
//       console.error("Error fetching produits:", error);
//       return [];
//     }
//   };
//   useEffect(() => {
//     fetchProduits();
//   }, []);

//   const handleSubmit = () => {
//     console.log("Stock data:", formData);
//     // Handle form submission here
//   };

//   return (
//     <div className="ajouter-stock-client">
//       <h1 className="page-title">Ajouter au Stock Client</h1>

//       <div className="form-container">
//         <div className="form-row">
//           <div className="form-group">
//             <label htmlFor="CodeClient">Code Client*</label>
//             <input
//               type="text"
//               id="CodeClient"
//               name="CodeClient"
//               value={formData.CodeClient}
//               onChange={handleInputChange}
//               className="form-input"
//             />
//           </div>

//           <div className="form-group">
//             <label htmlFor="Visit_date">Date de Délivration*</label>
//             <div className="date-input-container">
//               <input
//                 type="date"
//                 id="Visit_date"
//                 name="Visit_date"
//                 value={formData.Visit_date}
//                 onChange={handleInputChange}
//                 className="form-input date-input"
//               />
//               {/* <Calendar className="date-icon" size={20} /> */}
//             </div>
//           </div>
//           <div className="form-group">
//             <label htmlFor="Description">Conclusion*</label>
//             <input
//               type="text"
//               id="Description"
//               name="Description"
//               value={formData.Description}
//               onChange={handleInputChange}
//               className="form-input"
//             />
//           </div>
//         </div>

//         <div className="products-grid">
//           <div className="products-column">
//             {/* Produit 1 */}
//             <div className="form-group">
//               <label htmlFor="produit1">Produit 1*</label>
//               <div className="dropdown-container">
//                 <div
//                   className="dropdown-trigger"
//                   onClick={() => toggleDropdown("produit1")}
//                 >
//                   <span>{formData.produit1 || "Sélectionner un produit"}</span>
//                   <ChevronDown size={20} />
//                 </div>
//                 {dropdowns.produit1 && (
//                   <div className="dropdown-menu">
//                     {produits.map((produit, index) => (
//                       <div
//                         key={index}
//                         className="dropdown-item"
//                         onClick={() => selectProduit("produit1", produit)}
//                       >
//                         {produit}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="form-group">
//               <label htmlFor="quantite1">Quantité 1*</label>
//               <input
//                 type="number"
//                 id="quantite1"
//                 name="quantite1"
//                 value={formData.quantite1}
//                 onChange={handleInputChange}
//                 className="form-input"
//               />
//             </div>

//             {/* Produit 2 */}
//             <div className="form-group">
//               <label htmlFor="produit2">Produit 2</label>
//               <div className="dropdown-container">
//                 <div
//                   className="dropdown-trigger"
//                   onClick={() => toggleDropdown("produit2")}
//                 >
//                   <span>{formData.produit2 || "Sélectionner un produit"}</span>
//                   <ChevronDown size={20} />
//                 </div>
//                 {dropdowns.produit2 && (
//                   <div className="dropdown-menu">
//                     {produits.map((produit, index) => (
//                       <div
//                         key={index}
//                         className="dropdown-item"
//                         onClick={() => selectProduit("produit2", produit)}
//                       >
//                         {produit}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="form-group">
//               <label htmlFor="quantite2">Quantité 2</label>
//               <input
//                 type="number"
//                 id="quantite2"
//                 name="quantite2"
//                 value={formData.quantite2}
//                 onChange={handleInputChange}
//                 className="form-input"
//               />
//             </div>
//           </div>

//           <div className="products-column">
//             {/* Produit 3 */}
//             <div className="form-group">
//               <label htmlFor="produit3">Produit 3</label>
//               <div className="dropdown-container">
//                 <div
//                   className="dropdown-trigger"
//                   onClick={() => toggleDropdown("produit3")}
//                 >
//                   <span>{formData.produit3 || "Sélectionner un produit"}</span>
//                   <ChevronDown size={20} />
//                 </div>
//                 {dropdowns.produit3 && (
//                   <div className="dropdown-menu">
//                     {produits.map((produit, index) => (
//                       <div
//                         key={index}
//                         className="dropdown-item"
//                         onClick={() => selectProduit("produit3", produit)}
//                       >
//                         {produit}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="form-group">
//               <label htmlFor="quantite3">Quantité 3</label>
//               <input
//                 type="number"
//                 id="quantite3"
//                 name="quantite3"
//                 value={formData.quantite3}
//                 onChange={handleInputChange}
//                 className="form-input"
//               />
//             </div>

//             {/* Produit 4 */}
//             <div className="form-group">
//               <label htmlFor="produit4">Produit 4</label>
//               <div className="dropdown-container">
//                 <div
//                   className="dropdown-trigger"
//                   onClick={() => toggleDropdown("produit4")}
//                 >
//                   <span>{formData.produit4 || "Sélectionner un produit"}</span>
//                   <ChevronDown size={20} />
//                 </div>
//                 {dropdowns.produit4 && (
//                   <div className="dropdown-menu">
//                     {produits.map((produit, index) => (
//                       <div
//                         key={index}
//                         className="dropdown-item"
//                         onClick={() => selectProduit("produit4", produit)}
//                       >
//                         {produit}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="form-group">
//               <label htmlFor="quantite4">Quantité 4</label>
//               <input
//                 type="number"
//                 id="quantite4"
//                 name="quantite4"
//                 value={formData.quantite4}
//                 onChange={handleInputChange}
//                 className="form-input"
//               />
//             </div>
//           </div>

//           <div className="products-column">
//             {/* Produit 5 */}
//             <div className="form-group">
//               <label htmlFor="produit5">Produit 5</label>
//               <div className="dropdown-container">
//                 <div
//                   className="dropdown-trigger"
//                   onClick={() => toggleDropdown("produit5")}
//                 >
//                   <span>{formData.produit5 || "Sélectionner un produit"}</span>
//                   <ChevronDown size={20} />
//                 </div>
//                 {dropdowns.produit5 && (
//                   <div className="dropdown-menu">
//                     {produits.map((produit, index) => (
//                       <div
//                         key={index}
//                         className="dropdown-item"
//                         onClick={() => selectProduit("produit5", produit)}
//                       >
//                         {produit}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="form-group">
//               <label htmlFor="quantite5">Quantité 5</label>
//               <input
//                 type="number"
//                 id="quantite5"
//                 name="quantite5"
//                 value={formData.quantite5}
//                 onChange={handleInputChange}
//                 className="form-input"
//               />
//             </div>

//             {/* Produit 6 */}
//             <div className="form-group">
//               <label htmlFor="produit6">Produit 6</label>
//               <div className="dropdown-container">
//                 <div
//                   className="dropdown-trigger"
//                   onClick={() => toggleDropdown("produit6")}
//                 >
//                   <span>{formData.produit6 || "Sélectionner un produit"}</span>
//                   <ChevronDown size={20} />
//                 </div>
//                 {dropdowns.produit6 && (
//                   <div className="dropdown-menu">
//                     {produits.map((produit, index) => (
//                       <div
//                         key={index}
//                         className="dropdown-item"
//                         onClick={() => selectProduit("produit6", produit)}
//                       >
//                         {produit}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>
//             </div>

//           </div>
//         </div>
//         <div className="form-actions">
//           <button type="button" onClick={handleSubmit} className="submit-btn">
//             Ajouter au Stock
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AjouterStockClient;

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./AjouterStockClient.css";

const API_URL = "https://universellepeintre.oneposts.io/api/Stock/Produits";

const normalizeProduits = (raw) => {
  // Try to find an array in common payload shapes
  let arr = [];
  if (Array.isArray(raw)) arr = raw;
  else if (Array.isArray(raw.data)) arr = raw.data;
  else if (Array.isArray(raw.produits)) arr = raw.produits;
  else if (Array.isArray(raw.result)) arr = raw.result;
  else arr = []; // fallback

  return arr.map((p, i) => {
    if (typeof p === "string") {
      return { id: i, name: p };
    }
    if (!p || typeof p !== "object") {
      return { id: i, name: String(p) };
    }
    return {
      id: p.id ?? p.Id ?? p.code ?? p.Code ?? p.reference ?? p.Reference ?? i,
      name:
        p.nom ??
        p.name ??
        p.label ??
        p.libelle ??
        p.designation ??
        p.titre ??
        (p.description
          ? String(p.description).slice(0, 60)
          : JSON.stringify(p)),
    };
  });
};

const AjouterStockClient = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    CodeClient: "",
    Visit_date: "",
    produit1: "",
    quantite1: "",
    produit2: "",
    quantite2: "",
    produit3: "",
    quantite3: "",
    produit4: "",
    quantite4: "",
    produit5: "",
    quantite5: "",
    produit6: "",
    quantite6: "",
    description: "", // Changed from Description to description to match C#
  });

  const [dropdowns, setDropdowns] = useState({
    produit1: false,
    produit2: false,
    produit3: false,
    produit4: false,
    produit5: false,
    produit6: false,
  });

  const [produits, setProduits] = useState([]); // normalized {id,name}
  const [loadingProduits, setLoadingProduits] = useState(false);
  const [produitsError, setProduitsError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate date format (dd.MM.yyyy like in C#)
  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    if (value) {
      // Convert from HTML date format (yyyy-MM-dd) to dd.MM.yyyy for validation
      const dateObj = new Date(value);
      const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}.${(dateObj.getMonth() + 1).toString().padStart(2, '0')}.${dateObj.getFullYear()}`;
      
      // Validate format dd.MM.yyyy
      const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
      if (!dateRegex.test(formattedDate)) {
        alert("Le format de la date doit être 'dd.MM.yyyy'.");
        return;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate decimal/number inputs like PriseCompta_TextChanged in C#
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    
    if (value && !Number.isInteger(Number(value))) {
      alert("La valeur doit être un nombre entier.");
      return;
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleDropdown = (dropdown) => {
    setDropdowns((prev) => ({
      ...prev,
      [dropdown]: !prev[dropdown],
    }));
  };

  // Store both display name and id (optional id stored as produitXId)
  const selectProduit = (dropdown, produitObj) => {
    setFormData((prev) => ({
      ...prev,
      [dropdown]: produitObj.name,
      [`${dropdown}Id`]: produitObj.id,
    }));
    setDropdowns((prev) => ({
      ...prev,
      [dropdown]: false,
    }));
  };

  const fetchProduits = async () => {
    setLoadingProduits(true);
    setProduitsError(null);

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
      const token = localStorage.getItem("token");
      console.log("Token:", token);
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });

      console.log("Fetch produits status:", response.status);
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.error("Failed to fetch produits:", response.status, text);
        setProduitsError(`Erreur ${response.status}`);
        setLoadingProduits(false);
        return [];
      }

      const data = await response.json();
      console.log("Raw produits response:", data);
      const normalized = normalizeProduits(data);
      console.log("Normalized produits:", normalized);
      setProduits(normalized);
      setLoadingProduits(false);
      return normalized;
    } catch (error) {
      console.error("Error fetching produits:", error);
      setProduitsError(error.message || "Erreur réseau");
      setLoadingProduits(false);
      return [];
    }
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  // Close dropdowns when clicking outside any .dropdown-container
  useEffect(() => {
    const handler = (e) => {
      const el = e.target;
      if (!el.closest) return;
      if (!el.closest(".dropdown-container")) {
        setDropdowns({
          produit1: false,
          produit2: false,
          produit3: false,
          produit4: false,
          produit5: false,
          produit6: false,
        });
      }
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  // Clear inputs like ClearInputs() in C#
  const clearInputs = () => {
    setFormData({
      CodeClient: "",
      Visit_date: "",
      produit1: "",
      quantite1: "",
      produit2: "",
      quantite2: "",
      produit3: "",
      quantite3: "",
      produit4: "",
      quantite4: "",
      produit5: "",
      quantite5: "",
      produit6: "",
      quantite6: "",
      description: "",
    });
  };

  // Validation like ValidateInputs() in C#
  const validateInputs = () => {
    if (!formData.CodeClient.trim()) {
      alert("Le Code Client ne peut pas être vide.");
      return false;
    }

    if (!formData.description.trim()) {
      alert("Le Conclusion ne peut pas être vide.");
      return false;
    }

    if (!formData.Visit_date) {
      alert("La Date de Délivration ne peut pas être vide.");
      return false;
    }

    // Validate first product and quantity (required)
    if (!formData.produit1) {
      alert("Le Produit 1 doit être sélectionné.");
      return false;
    }

    if (!formData.quantite1 || !Number.isInteger(Number(formData.quantite1))) {
      alert("La Quantité 1 doit être un nombre entier.");
      return false;
    }

    // Validate other products and quantities (optional but if product is selected, quantity is required)
    for (let i = 2; i <= 6; i++) {
      const produit = formData[`produit${i}`];
      const quantite = formData[`quantite${i}`];

      if ((produit && !quantite) || (quantite && !Number.isInteger(Number(quantite)))) {
        alert(`La Quantité ${i} doit être un nombre entier si un produit est sélectionné.`);
        return false;
      }
    }

    return true;
  };

  // Error handling like HandleError() in C#
  const handleError = (status, errorContent) => {
    console.log("Error Content: " + errorContent);
    
    try {
      const errorResponse = JSON.parse(errorContent);
      if (errorResponse?.errors) {
        const errorMessages = Object.values(errorResponse.errors).flat();
        if (errorMessages.length > 0) {
          alert(errorMessages.join('\n'));
          return;
        }
      }
    } catch (ex) {
      console.log("Deserialization Error: " + ex.message);
    }
    
    alert(`An error occurred: ${errorContent}`);
  };

  const handleSubmit = async () => {
    // Validate inputs first
    if (!validateInputs()) {
      return;
    }

    console.log("Stock data:", formData);
  
    // Build StockProduitdto array - only add if both product and quantity exist
    const stockProduitdto = [];
    
    // Add product 1 (required)
    if (formData.produit1 && formData.quantite1) {
      stockProduitdto.push({
        NameProduit: formData.produit1,
        Quantite: parseInt(formData.quantite1, 10),
      });
    }

    // Add products 2-6 (optional)
    for (let i = 2; i <= 6; i++) {
      const produit = formData[`produit${i}`];
      const quantite = formData[`quantite${i}`];

      if (produit && quantite) {
        stockProduitdto.push({
          NameProduit: produit,
          Quantite: parseInt(quantite, 10),
        });
      }
    }
  
    // Build payload matching C# UpdateStockdto structure
    const payload = {
      CodeClient: formData.CodeClient,
      Visit_date: formData.Visit_date,
      Description: formData.description, // Match C# property name
      recipe_day: 0, // Default value like in C#
      StockProduitdto: stockProduitdto,
    };
  
    console.log("Payload:", JSON.stringify(payload));

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
      const response = await fetch("https://universellepeintre.oneposts.io/api/Stock/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + localStorage.getItem("token"),
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        alert("Les données ont été modifiées avec succès."); // Match C# success message
        clearInputs();
      } else {
        const errorContent = await response.text();
        handleError(response.status, errorContent);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Une erreur est survenue lors de l'ajout du stock.");
    }
  };
  

  const renderDropdown = (fieldName) => {
    return (
      <div className="dropdown-container">
        <div
          className="dropdown-trigger"
          onClick={() => toggleDropdown(fieldName)}
          role="button"
        >
          <span>{formData[fieldName] || "Sélectionner un produit"}</span>
          <ChevronDown size={20} />
        </div>

        {dropdowns[fieldName] && (
          <div className="dropdown-menu">
            {loadingProduits && (
              <div className="dropdown-item">Chargement...</div>
            )}
            {!loadingProduits && produits.length === 0 && (
              <div className="dropdown-item">
                {produitsError ? `Erreur: ${produitsError}` : "Aucun produit"}
              </div>
            )}
            {!loadingProduits &&
              produits.map((p) => (
                <div
                  key={p.id ?? p.name}
                  className="dropdown-item"
                  onClick={() => selectProduit(fieldName, p)}
                >
                  {p.name}
                </div>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="ajouter-stock-client">
      <h1 className="page-title">Ajouter au Stock Client</h1>

      <div className="form-container">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="CodeClient">Code Client*</label>
            <input
              type="text"
              id="CodeClient"
              name="CodeClient"
              value={formData.CodeClient}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="Visit_date">Date de Délivration*</label>
            <div className="date-input-container">
              <input
                type="date"
                id="Visit_date"
                name="Visit_date"
                value={formData.Visit_date}
                onChange={handleDateChange}
                className="form-input date-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Conclusion*</label>
            <input
              type="text"
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
            />
          </div>
        </div>

        <div className="products-grid">
          <div className="products-column">
            <div className="form-group">
              <label htmlFor="produit1">Produit 1*</label>
              {renderDropdown("produit1")}
            </div>

            <div className="form-group">
              <label htmlFor="quantite1">Quantité 1*</label>
              <input
                type="number"
                id="quantite1"
                name="quantite1"
                value={formData.quantite1}
                onChange={handleNumberChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="produit2">Produit 2</label>
              {renderDropdown("produit2")}
            </div>

            <div className="form-group">
              <label htmlFor="quantite2">Quantité 2</label>
              <input
                type="number"
                id="quantite2"
                name="quantite2"
                value={formData.quantite2}
                onChange={handleNumberChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="products-column">
            <div className="form-group">
              <label htmlFor="produit3">Produit 3</label>
              {renderDropdown("produit3")}
            </div>

            <div className="form-group">
              <label htmlFor="quantite3">Quantité 3</label>
              <input
                type="number"
                id="quantite3"
                name="quantite3"
                value={formData.quantite3}
                onChange={handleNumberChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="produit4">Produit 4</label>
              {renderDropdown("produit4")}
            </div>

            <div className="form-group">
              <label htmlFor="quantite4">Quantité 4</label>
              <input
                type="number"
                id="quantite4"
                name="quantite4"
                value={formData.quantite4}
                onChange={handleNumberChange}
                className="form-input"
              />
            </div>
          </div>

          <div className="products-column">
            <div className="form-group">
              <label htmlFor="produit5">Produit 5</label>
              {renderDropdown("produit5")}
            </div>

            <div className="form-group">
              <label htmlFor="quantite5">Quantité 5</label>
              <input
                type="number"
                id="quantite5"
                name="quantite5"
                value={formData.quantite5}
                onChange={handleNumberChange}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="produit6">Produit 6</label>
              {renderDropdown("produit6")}
            </div>
            <div className="form-group">
              <label htmlFor="quantite6">Quantité 6</label>
              <input
                type="number"
                id="quantite6"
                name="quantite6"
                value={formData.quantite6}
                onChange={handleNumberChange}
                className="form-input"
              />
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={handleSubmit} className="submit-btn">
            Ajouter au Stock
          </button>
        </div>
      </div>
    </div>
  );
};

export default AjouterStockClient;