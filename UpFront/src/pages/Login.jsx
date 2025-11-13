import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    // Handle login logic here
    // https://universellepeintre.oneposts.io/api/User/login
    if(!identifier || !password) {
      alert("Please enter both identifier and password.");
      return;
    }
    try {
      const response = await fetch("https://universellepeintre.oneposts.io/api/User/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Encoding: "utf-8", // Removed invalid header
        },
        body: JSON.stringify({
          userName: identifier,
          password: password,
        }),
      })
      console.log("Login attempt:", { identifier, password });
      const data = await response.json();
      console.log("Response data:", data);
      if (response.ok) {
        // Assuming the response contains a token and user info
        console.log("Login successful:", data);
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiration", data.expiration);
        localStorage.setItem("user", JSON.stringify(data.user));
        alert("Connection reussite!!!");
        navigate("/dashboard");
      } else {
        alert(data.message || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("An error occurred during login.");
    }
    // navigate("/dashboard");
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
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter Identifiant"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="login-input"
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              placeholder="Enter Mots de Passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
