"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postIdentityTokenGenerate, postIdentityTokenGoogle } from "@/client";
import { GoogleLogin } from '@react-oauth/google';
import { client } from "@/client/client.gen";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";

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
        const refreshToken = response.data.value.refreshToken;
        
        // Use the auth context login method to update global state immediately
        login(token, refreshToken || undefined);
        
        try {
          const decoded: any = jwtDecode(token);
          let role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
          if (Array.isArray(role)) role = role[0];
          if (role === "NormalUser") {
            router.push("/products");
          } else {
            router.push("/dashboard");
          }
        } catch (e) {
          router.push("/products");
        }
      } else {
        const errObj = (response.error as any) || response.data;
        const errorMsg =
          errObj?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") ||
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
        const refreshToken = response.data.value.refreshToken;
        
        // Use the auth context login method to update global state immediately
        login(token, refreshToken || undefined);
        
        try {
          const decoded: any = jwtDecode(token);
          let role = decoded.role || decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
          if (Array.isArray(role)) role = role[0];
          
          if (role === "NormalUser") {
            router.push("/products");
          } else {
            router.push("/dashboard");
          }
        } catch (e) {
          router.push("/products");
        }
      } else {
        const errObj = (response.error as any) || response.data;
        const errorMsg =
          errObj?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") ||
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
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#09090b",
      backgroundImage: "radial-gradient(at 0% 0%, rgba(124, 58, 237, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(59, 130, 246, 0.15) 0px, transparent 50%)",
      position: "relative",
      overflow: "hidden",
      padding: "2rem"
    }}>
      {/* Background Glow Orbs */}
      <div style={{
          position: "absolute", top: "10%", left: "15%",
          width: "400px", height: "400px",
          background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none", filter: "blur(60px)",
      }} />
      <div style={{
          position: "absolute", bottom: "10%", right: "15%",
          width: "350px", height: "350px",
          background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none", filter: "blur(50px)",
      }} />
      <div style={{
          position: "absolute", top: "40%", left: "50%", transform: "translate(-50%, -50%)",
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none", filter: "blur(80px)",
      }} />

      {/* Back to Products Link */}
      <div style={{ position: "absolute", top: "2rem", left: "2rem", zIndex: 20 }}>
        <Link href="/products" style={{
          display: "inline-flex", alignItems: "center", gap: "0.5rem",
          color: "#a1a1aa", textDecoration: "none",
          fontSize: "0.9rem", fontWeight: 500, transition: "color 0.2s"
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Products
        </Link>
      </div>

      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: "440px",
        padding: "3rem 2.5rem",
        background: "rgba(15, 17, 26, 0.65)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRadius: "28px",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "0 24px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}>
        
        {/* Logo and Header */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{
            width: "60px", height: "60px", margin: "0 auto 1.5rem",
            background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 10px 25px rgba(124,58,237,0.4)",
          }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: "800", color: "#ffffff", marginBottom: "0.5rem", letterSpacing: "-0.03em" }}>
            Welcome Back
          </h1>
          <p style={{ color: "#a1a1aa", fontSize: "0.95rem" }}>
            Sign in to continue to Agecs Licensing
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="email" style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ padding: "0.875rem 1rem", borderRadius: "12px", background: "rgba(0,0,0,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)" }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" htmlFor="password" style={{ fontSize: "0.85rem", color: "#a1a1aa" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: "0.875rem 1rem", paddingRight: "3rem", borderRadius: "12px", background: "rgba(0,0,0,0.2)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.1)" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute", right: "1rem", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", color: "#a1a1aa", cursor: "pointer", padding: "4px",
                  display: "flex", alignItems: "center",
                }}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            style={{ 
              width: "100%", padding: "0.875rem", fontSize: "1rem", 
              marginTop: "1rem", borderRadius: "12px", 
              fontWeight: 600, background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              boxShadow: "0 8px 20px rgba(124,58,237,0.25)",
              border: "none",
            }}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: "18px", height: "18px" }} />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div style={{ margin: "2rem 0", position: "relative", textAlign: "center" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px solid rgba(255,255,255,0.1)" }}></div>
          <span style={{ 
            background: "#13151c", // Dark solid match
            position: "relative", padding: "0 1rem", 
            color: "#a1a1aa", fontSize: "0.85rem",
            fontWeight: 500
          }}>
            Or continue with
          </span>
        </div>

        <div style={{ position: "relative", width: "100%", height: "52px" }}>
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
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              color: "#09090b",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: googleLoading ? "not-allowed" : "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
              opacity: googleLoading ? 0.7 : 1,
              zIndex: 1,
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.2)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.1)";
            }}
          >
            {googleLoading ? (
              <span className="spinner" style={{ width: "20px", height: "20px" }} />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
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
              cursor: "pointer",
              borderRadius: "12px",
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
    </main>
  );
}
