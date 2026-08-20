"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { postIdentityTokenGenerate, postIdentityTokenGoogle } from "@/client";
import { GoogleLogin } from '@react-oauth/google';
import { client } from "@/client/client.gen";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "@/components/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
        const token = response.data.value.accessToken;
        
        // Use the auth context login method to update global state immediately
        login(token);
        
        try {
          const decoded: any = jwtDecode(token);
          let role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
          if (Array.isArray(role)) role = role[0];
          
          if (role === "Student") {
            router.push("/products");
          } else {
            router.push("/products");
          }
        } catch (e) {
          router.push("/products");
        }
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

  const handleGoogleLogin = async (credentialResponse: any) => {
    if (!credentialResponse.credential) return;
    setGoogleLoading(true);
    setError("");

    try {
      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003")
      });

      const response = await postIdentityTokenGoogle({
        body: { idToken: credentialResponse.credential }
      });

      if (response.data?.isSuccess && response.data?.value?.accessToken) {
        const token = response.data.value.accessToken;
        
        // Use the auth context login method to update global state immediately
        login(token);
        
        try {
          const decoded: any = jwtDecode(token);
          let role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
          if (Array.isArray(role)) role = role[0];
          
          if (role === "Student") {
            router.push("/products");
          } else {
            router.push("/products");
          }
        } catch (e) {
          router.push("/products");
        }
      } else {
        const errorMsg =
          response.data?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") ||
          "Invalid credentials or response format.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err?.body?.message || "An error occurred during Google login.");
    } finally {
      setGoogleLoading(false);
    }
  };



  return (
    <main className="login-container">
      {/* Left — Branding panel */}
      <div className="login-left">
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
      <div className="login-right">
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

          <div style={{ marginTop: "1.5rem", position: "relative", textAlign: "center" }}>
            <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px solid var(--border)" }}></div>
            <span style={{ background: "var(--bg-base)", position: "relative", padding: "0 0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
              Or continue with
            </span>
          </div>

          <div style={{ marginTop: "1.5rem", position: "relative", width: "100%", height: "46px" }}>
            {/* Custom branded Google button */}
            <button
              type="button"
              id="google-signin-btn"
              disabled={googleLoading}
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.75rem",
                background: "var(--bg-elevated)",
                border: "1.5px solid var(--border)",
                borderRadius: "10px",
                color: "var(--text-primary)",
                fontSize: "0.92rem",
                fontWeight: 500,
                cursor: googleLoading ? "not-allowed" : "pointer",
                transition: "all 0.2s ease",
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
                opacity: googleLoading ? 0.7 : 1,
                zIndex: 1,
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-surface)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent-border)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 4px 16px rgba(139,92,246,0.15)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-elevated)";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
              }}
            >
              {googleLoading ? (
                <span className="spinner" style={{ width: "18px", height: "18px" }} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </button>

            {/* Hidden Google button – perfectly overlays the custom button */}
            <div
              style={{
                position: "absolute",
                top: 0, left: 0, right: 0, bottom: 0,
                opacity: 0.0001,
                zIndex: 10,
                overflow: "hidden",
                cursor: "pointer"
              }}
            >
              <div style={{ transform: "scale(1.5)", transformOrigin: "top left", width: "100%", height: "100%" }}>
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => setError("Google Login Failed")}
                  width="400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
