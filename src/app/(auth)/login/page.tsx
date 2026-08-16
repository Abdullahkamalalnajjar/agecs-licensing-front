"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postIdentityTokenGenerate } from "@/client";
import { client } from "@/client/client.gen";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003")
      });

      const response = await postIdentityTokenGenerate({
        body: { email, password }
      });

      if (response.data?.isSuccess && response.data?.value?.accessToken) {
        localStorage.setItem("token", response.data.value.accessToken);
        router.push("/products");
      } else {
        const errorMsg =
          response.data?.errors?.map((e) => e.description).filter(Boolean).join(", ") ||
          "Invalid credentials or response format.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err?.body?.message || "An error occurred during login.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      background: "var(--bg-base)",
    }}>
      {/* Left — Branding panel */}
      <div style={{
        flex: "0 0 45%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: "4rem",
        background: "linear-gradient(145deg, #0d0f1a 0%, #110d20 50%, #0a0a0f 100%)",
        borderRight: "1px solid var(--border)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Glow orbs */}
        <div style={{
          position: "absolute", top: "-80px", left: "-80px",
          width: "320px", height: "320px",
          background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-60px", right: "-60px",
          width: "240px", height: "240px",
          background: "radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", marginBottom: "4rem" }}>
          <div style={{
            width: "44px", height: "44px",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            borderRadius: "12px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 16px rgba(124,58,237,0.45)",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Agecs</div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.1em" }}>Licensing</div>
          </div>
        </div>

        {/* Headline */}
        <div style={{ maxWidth: "380px", position: "relative" }}>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: "800",
            lineHeight: 1.15,
            letterSpacing: "-0.04em",
            color: "var(--text-primary)",
            marginBottom: "1.25rem",
          }}>
            Manage licenses{" "}
            <span style={{
              background: "linear-gradient(135deg, #a78bfa, #60a5fa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              with confidence
            </span>
          </h1>
          <p style={{
            fontSize: "1rem",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            marginBottom: "3rem",
          }}>
            A powerful admin dashboard to manage software products, promocodes, and customer support — all in one place.
          </p>

          {/* Feature list */}
          {[
            "Full product & license management",
            "Promo codes with usage tracking",
            "Integrated support ticket system",
          ].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
              <div style={{
                width: "20px", height: "20px", borderRadius: "50%",
                background: "var(--accent-dim)", border: "1px solid var(--accent-border)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right — Login form */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "4rem 3rem",
      }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          {/* Header */}
          <div style={{ marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.75rem", fontWeight: "700", letterSpacing: "-0.03em", marginBottom: "0.375rem" }}>
              Welcome back
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Sign in to your admin account to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: "2.75rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "0.875rem", top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px",
                    display: "flex", alignItems: "center",
                  }}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-primary"
              style={{ width: "100%", padding: "0.8rem", fontSize: "0.9rem", marginTop: "0.5rem" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: "16px", height: "16px" }} />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
