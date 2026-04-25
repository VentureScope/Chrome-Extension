import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";
import { login } from "../../api/auth";
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

