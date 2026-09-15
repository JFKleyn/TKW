import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import "./Login.css";

const Login = () => {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login error:", error);
      setErrorMessage("Incorrect email or password.");
      setLoading(false);
      return;
    }

    sessionStorage.setItem("adminLoggedIn", "true");
    navigate("/admin");
  };

  return (
    <main className="login-page">
      <Link to="/" className="login-back">
        ← BACK
      </Link>

      <section className="login-container">
        <header className="login-header">
          <p className="login-eyebrow">THE KLEYN WEDDING</p>

          <h1>Admin</h1>

          <div className="login-divider"></div>

          <p className="login-intro">
            Sign in to manage your wedding dashboard.
          </p>
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="email">EMAIL</label>

            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">PASSWORD</label>

            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {errorMessage && <p className="login-error">{errorMessage}</p>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>
      </section>
    </main>
  );
};

export default Login;
