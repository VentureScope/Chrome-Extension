import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { login, oauthLogin } from "../../api/auth";
import { useAppStore } from "../../state/store";

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAppStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.trim().length > 0 && !submitting,
    [email, password, submitting],
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const session = await login(email.trim(), password);
      await setUser(session);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  async function onOAuthLogin(provider: "google" | "github") {
    setSubmitting(true);
    setError(null);
    try {
      const session = await oauthLogin(provider);
      await setUser(session);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || `Failed to sign in with ${provider}.`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="screen">
      <Header subtitle="Sign in to sync your academic data" />

      <form className="form" onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          <span>{submitting ? "Signing in…" : "Sign In"}</span>
        </button>

        <div className="oauth-divider" style={{ margin: "1rem 0", textAlign: "center", position: "relative" }}>
          <span style={{ background: "var(--color-bg)", padding: "0 10px", color: "var(--color-text-muted)", fontSize: "0.85rem", position: "relative", zIndex: 1 }}>Or continue with</span>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "var(--color-border)", zIndex: 0 }}></div>
        </div>

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button type="button" className="btn" style={{ flex: 1, backgroundColor: "#fff", color: "#000", border: "1px solid #ccc" }} onClick={() => onOAuthLogin("google")} disabled={submitting}>
            Google
          </button>
          <button type="button" className="btn" style={{ flex: 1, backgroundColor: "#24292e", color: "#fff", border: "1px solid #24292e" }} onClick={() => onOAuthLogin("github")} disabled={submitting}>
            GitHub
          </button>
        </div>

        {error ? (
          <div className="config-status status-error" style={{ textAlign: "left" }}>
            {error}
          </div>
        ) : null}

        <p className="help-text">Use your VentureScope account credentials</p>
      </form>
    </div>
  );
}

