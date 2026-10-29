import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { API_BASE } from "../config";
import { Alert, Button, Field, Input, TextField } from "../ui";
import "./Login.css";

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/User/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userName: identifier, password }),
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("expiration", data.expiration);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/dashboard", { state: { loginSuccess: true } });
      } else {
        setError("Identifiant ou mot de passe incorrect.");
      }
    } catch (error) {
      console.error("Error:", error);
      setError("Une erreur est survenue lors de la connexion.");
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => error && setError("");

  return (
    <div className="login-page">
      {/* Same colours as the dashboard's sidebar. */}
      <aside className="login-brand">
        <div className="login-logo-mark">
          <img src="/UpLogo.ico" alt="" className="login-logo-image" />
        </div>
        <div>
          <h1 className="login-brand-name">Universelle Peinture</h1>
          <p className="login-brand-tagline">Ventes, stock et livraisons des commerciaux.</p>
        </div>
      </aside>

      <main className="login-panel">
        <form className="login-form" onSubmit={handleLogin} noValidate>
          <div className="login-heading">
            <h2>Connexion</h2>
            <p>Entrez votre identifiant et votre mot de passe.</p>
          </div>

          {error && <Alert>{error}</Alert>}

          <TextField
            label="Identifiant"
            autoComplete="username"
            autoCapitalize="none"
            autoFocus
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              clearError();
            }}
          />

          <Field label="Mot de passe" htmlFor="login-password">
            <div className="login-password">
              <Input
                id="login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </Field>

          <Button type="submit" icon={LogIn} loading={loading} className="login-submit">
            Se connecter
          </Button>
        </form>
      </main>
    </div>
  );
};

export default Login;
