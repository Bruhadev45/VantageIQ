import { useState } from "react";
import { ArrowRight, BrainCircuit, Loader2, Lock, Mail, UserRound } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";

type Mode = "login" | "signup";

export function AuthScreen() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "signup") await signup(email, password, name || undefined);
      else await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-hero">
        <span className="eyebrow">AI competitive intelligence</span>
        <h1>
          VantageIQ runs a team of <span className="hero-accent">AI analysts</span> for you.
        </h1>
        <p>
          Ask a market question. Four agents research rivals, spot accelerating demand signals, model winning
          campaigns, and hand you a board-ready strategy — in about 90 seconds, every claim cited.
        </p>
        <ul className="auth-points">
          <li>
            <BrainCircuit size={16} /> Watch the analyst team reason live
          </li>
          <li>
            <ArrowRight size={16} /> 20 hours of research compressed to 90 seconds
          </li>
          <li>
            <Lock size={16} /> Export a board memo PDF in one click
          </li>
        </ul>
      </section>

      <section className="auth-card">
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            onClick={() => {
              setMode("signup");
              setError(null);
            }}
          >
            Create account
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "login"}
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError(null);
            }}
          >
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "signup" ? (
            <label>
              <span>
                <UserRound size={15} /> Name <em>(optional)</em>
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Ada Lovelace"
                autoComplete="name"
              />
            </label>
          ) : null}

          <label>
            <span>
              <Mail size={15} /> Work email
            </span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
          </label>

          <label>
            <span>
              <Lock size={15} /> Password
            </span>
            <input
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </label>

          {error ? <p className="auth-error">{error}</p> : null}

          <button type="submit" className="primary-button auth-submit" disabled={submitting}>
            {submitting ? <Loader2 size={17} className="spin" /> : <BrainCircuit size={17} />}
            {submitting ? "Please wait…" : mode === "signup" ? "Create account & start" : "Sign in"}
          </button>
        </form>

        <p className="auth-switch">
          {mode === "signup" ? "Already have an account? " : "New to VantageIQ? "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signup" ? "login" : "signup");
              setError(null);
            }}
          >
            {mode === "signup" ? "Sign in" : "Create one"}
          </button>
        </p>
      </section>
    </main>
  );
}
