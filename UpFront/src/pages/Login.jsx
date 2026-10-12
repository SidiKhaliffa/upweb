import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier || !password) {
      setError("Veuillez entrer votre identifiant et votre mot de passe.");
      return;
    }
    try {
      const response = await fetch(
        "https://api.universellepeinture.com/api/User/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userName: identifier,
            password: password,
          }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiration", data.expiration);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard", { state: { loginSuccess: true } });
      } else {
        setError(
          data.message || "Identifiant ou mot de passe incorrect."
        );
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Une erreur est survenue lors de la connexion.");
    }
  };

  const handleCreateAccount = () => {
    // Handle create account logic here
    console.log("Create new account clicked");
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo">
            <img src="/UpLogo.ico" alt="UP Logo" className="logo-image" />
            {/* <div className="logo-text">
              <span className="up-text">UP</span>
              <div className="company-text">
                <span className="universelle">universelle</span>
                <span className="peinture">Peinture</span>
              </div>
            </div> */}
            {/* <div className="logo-circle"></div> */}
          </div>
        </div>

        {/* Title Section */}
        <div className="title-section">
          <h1>Universelle Peinture</h1>
          <p>Veuillez vous connectez</p>
        </div>

        {/* Form Section */}
        <div className="login-form">
          {error && <div className="login-error-message">{error}</div>}

          <div className="input-group">
            <input
              type="text"
              placeholder="Enter Identifiant"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (error) setError("");
              }}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Enter Mots de Passe"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              className="login-input"
            />
          </div>

          <button type="button" className="login-button" onClick={handleLogin}>
            Connectez-Vous
          </button>
        </div>

        {/* Create Account Button */}
        <button
          type="button"
          className="create-account-button"
          onClick={handleCreateAccount}
        >
          Créer un Nouveau Commercial
        </button>
      </div>
    </div>
  );
};

export default Login;
