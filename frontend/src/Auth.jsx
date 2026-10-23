import { useState } from "react";
import "./Auth.css";

const API_URL = "http://localhost:5000";

function Auth({ onAuthSuccess }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");
    setLoading(true);

    const isRegister = mode === "register";

    try {
      const response = await fetch(
        `${API_URL}/api/auth/${isRegister ? "register" : "login"}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isRegister
              ? { name, email, password }
              : { email, password }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      if (isRegister) {
        setMessage("Account created successfully! Please log in.");
        setMode("login");
        setName("");
        setPassword("");
      } else {
        onAuthSuccess(data);
      }
    } catch (err) {
      setError(
        err.message ||
        "Could not connect to the server. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <aside className="auth-side">
          <div className="auth-side-orbit orbit-one"></div>
          <div className="auth-side-orbit orbit-two"></div>

          <div className="auth-side-content">
            <div className="auth-side-tag">A WORKSPACE THAT WORKS FOR YOU</div>

            <h2>
              Your ideas.
              <br />
              Your people.
              <br />
              <span>One space.</span>
            </h2>

            <p>
              Bring projects, notes, teammates and AI-powered tools together
              in one place.
            </p>

            <div className="auth-feature">
              <span>✓</span> Organize projects and teams
            </div>

            <div className="auth-feature">
              <span>✓</span> Create and improve project notes
            </div>

            <div className="auth-feature">
              <span>✳</span> Work smarter with Gemini AI
            </div>
          </div>

          <div className="auth-side-footer">
            MADE FOR PEOPLE WHO BUILD TOGETHER
          </div>
        </aside>

        <div className="auth-panel">
          <a href="/" className="auth-brand">
            <span className="auth-brand-mark">C</span>
            <span>
              collab<span>sphere</span>
            </span>
          </a>

          <div className="auth-eyebrow">
            <span className="auth-live-dot"></span>
            YOUR TEAM'S CREATIVE SPACE
          </div>

          <h1>
            {mode === "login"
              ? "Welcome back."
              : "Build something great."}
          </h1>

          <p className="auth-subtitle">
            {mode === "login"
              ? "Sign in to continue to your workspace."
              : "Create an account to start collaborating."}
          </p>

          {error && (
            <div className="auth-message error-message" role="alert">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-message success-message" role="status">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "register" && (
              <div className="auth-field">
                <label htmlFor="auth-name">Full name</label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  maxLength={100}
                  required
                />
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="auth-email">Email address</label>
              <input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="auth-password">Password</label>
              <input
                id="auth-password"
                type="password"
                placeholder={
                  mode === "register"
                    ? "At least 8 characters"
                    : "Enter your password"
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete={
                  mode === "register"
                    ? "new-password"
                    : "current-password"
                }
                minLength={mode === "register" ? 8 : undefined}
                required
              />
            </div>

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "login"
                  ? "Sign in to workspace →"
                  : "Create account →"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login"
              ? "New to CollabSphere?"
              : "Already have an account?"}

            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setMessage("");
                setError("");
              }}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </div>

          <div className="auth-footer">
            COLLABORATE. CREATE. GROW.
          </div>
        </div>
      </section>
    </main>
  );
}

export default Auth;
