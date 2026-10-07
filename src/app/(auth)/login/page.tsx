"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { postIdentityTokenGenerate, postIdentityTokenGoogle } from "@/client";
import { GoogleLogin } from '@react-oauth/google';
import { client } from "@/client/client.gen";
import { jwtDecode } from "jwt-decode";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import "./login.css";

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
          if (role === "NormalUser" || role === "Student") {
            router.push("/home");
          } else if (role === "Admin") {
            router.push("/products");
          } else {
            router.push("/home");
          }
        } catch (e) {
          router.push("/home");
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
          
          if (role === "NormalUser" || role === "Student") {
            router.push("/home");
          } else if (role === "Admin") {
            router.push("/products");
          } else {
            router.push("/home");
          }
        } catch (e) {
          router.push("/home");
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
    <main className="lp">
      {/* ---------- Brand panel ---------- */}
      <aside className="lp-brand" aria-hidden="true">
        <BrandLogo variant="full" tone="dark" height={60} alt="" className="lp-logo" />

        <div className="lp-brand-body">
          <span className="lp-eyebrow">Agecs Licensing</span>
          <h2>Your software licenses, all in one place.</h2>
          <p className="lp-brand-lead">
            Activate, renew and manage your engineering software licenses and devices from a single secure dashboard.
          </p>
          <ul className="lp-features">
            <li>
              <span className="lp-feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
              </span>
              Secure, hardware-bound activation
            </li>
            <li>
              <span className="lp-feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </span>
              One-click renewals and device migration
            </li>
            <li>
              <span className="lp-feature-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </span>
              Direct support from our team
            </li>
          </ul>
        </div>

        <p className="lp-brand-foot">© {new Date().getFullYear()} AGECS — Engineering and Technological Consultancy &amp; Services</p>
      </aside>

      {/* ---------- Form panel ---------- */}
      <section className="lp-panel">
        <Link href="/products" className="lp-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Products
        </Link>

        <div className="lp-form-wrap">
          <BrandLogo height={38} alt="AGECS" className="lp-mobile-logo" />

          <h1 className="lp-title">Welcome back</h1>
          <p className="lp-subtitle">Sign in to your Agecs Licensing account</p>

          {error && (
            <div className="alert-error lp-alert" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="lp-form">
            <div className="lp-field">
              <label className="lp-label" htmlFor="email">Email address</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="lp-input"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="password">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-input-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className="lp-input has-toggle"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="lp-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
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

            <button id="login-submit" type="submit" className="lp-submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>
          </form>

          <div className="lp-divider">or continue with</div>

          <div className="lp-google">
            {/* Custom branded Google button */}
            <button type="button" id="google-signin-btn" className="lp-google-btn" disabled={googleLoading}>
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

            {/* Hidden Google button – overlays the custom button */}
            <div className="lp-google-overlay">
              <div>
                <GoogleLogin
                  onSuccess={handleGoogleLogin}
                  onError={() => setError("Google Login Failed")}
                  width="400"
                />
              </div>
            </div>
          </div>

          <p className="lp-legal">
            Don&apos;t have an account? <Link href="/register" style={{ fontWeight: 700, color: "var(--accent)" }}>Create one</Link>
          </p>
          <p className="lp-legal">Protected by secure authentication. Need help? Contact AGECS support.</p>
        </div>
      </section>
    </main>
  );
}
