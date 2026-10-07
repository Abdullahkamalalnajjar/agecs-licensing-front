"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { postIdentityRegister } from "@/client";
import { client } from "@/client/client.gen";
import { useAuth } from "@/components/AuthProvider";
import BrandLogo from "@/components/BrandLogo";
import "../login/login.css";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

const errorText = (data: unknown, fallback: string) => {
  const d = data as { errors?: unknown; title?: string } | undefined;
  // Result errors: [{ description }]; ASP.NET validation errors: { Field: ["message"] }
  if (Array.isArray(d?.errors)) return d.errors.map((e: { description?: string }) => e.description).filter(Boolean).join(", ") || fallback;
  if (d?.errors && typeof d.errors === "object") return Object.values(d.errors as Record<string, string[]>).flat().join(" ") || fallback;
  return d?.title || fallback;
};

const Icon = ({ children }: { children: React.ReactNode }) => (
  <span className="lp-input-icon">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
  </span>
);

/** Public sign-up (POST /identity/register): always creates a NormalUser account and signs the visitor in. */
export default function RegisterPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "", confirm: "", city: "", phoneNumber: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      client.setConfig({ baseUrl });
      const response = await postIdentityRegister({
        body: {
          email: form.email.trim(),
          password: form.password,
          city: form.city.trim(),
          phoneNumber: form.phoneNumber.trim(),
        },
        throwOnError: false,
      });

      const token = response.data?.value?.accessToken;
      if (response.data?.isSuccess && token) {
        login(token, response.data.value?.refreshToken || undefined);
        router.push("/home");
      } else {
        setError(errorText(response.error ?? response.data, "Couldn't create your account."));
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || "An error occurred while creating your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="lp">
      {/* ---------- Brand panel ---------- */}
      <aside className="lp-brand" aria-hidden="true">
        <BrandLogo variant="full" tone="dark" height={60} alt="" className="lp-logo" />

        <div className="lp-brand-body">
          <span className="lp-eyebrow">Agecs Licensing</span>
          <h2>Create your account in a minute.</h2>
          <p className="lp-brand-lead">
            Buy, activate and renew your engineering software licenses, and manage your devices from one secure dashboard.
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
        <Link href="/login" className="lp-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to sign in
        </Link>

        <div className="lp-form-wrap">
          <BrandLogo height={38} alt="AGECS" className="lp-mobile-logo" />

          <h1 className="lp-title">Create your account</h1>
          <p className="lp-subtitle">Sign up for an Agecs Licensing account</p>

          {error && (
            <div className="alert-error lp-alert" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="lp-form">
            <div className="lp-field">
              <label className="lp-label" htmlFor="email">Email address</label>
              <div className="lp-input-wrap">
                <Icon><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></Icon>
                <input id="email" type="email" autoComplete="email" className="lp-input" placeholder="name@example.com"
                  value={form.email} onChange={(e) => set({ email: e.target.value })} required />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="password">Password</label>
              <div className="lp-input-wrap">
                <Icon><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>
                <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" className="lp-input has-toggle"
                  placeholder="At least 6 characters" minLength={6} value={form.password} onChange={(e) => set({ password: e.target.value })} required />
                <button type="button" className="lp-toggle" onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}>
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="confirm">Confirm password</label>
              <div className="lp-input-wrap">
                <Icon><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Icon>
                <input id="confirm" type={showPassword ? "text" : "password"} autoComplete="new-password" className="lp-input"
                  placeholder="Repeat your password" minLength={6} value={form.confirm} onChange={(e) => set({ confirm: e.target.value })} required />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="phone">Phone number</label>
              <div className="lp-input-wrap">
                <Icon><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></Icon>
                <input id="phone" type="tel" autoComplete="tel" className="lp-input" placeholder="+20 100 000 0000"
                  value={form.phoneNumber} onChange={(e) => set({ phoneNumber: e.target.value })} required />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="city">City</label>
              <div className="lp-input-wrap">
                <Icon><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Icon>
                <input id="city" type="text" autoComplete="address-level2" className="lp-input" placeholder="Cairo"
                  value={form.city} onChange={(e) => set({ city: e.target.value })} required />
              </div>
            </div>

            <button type="submit" className="lp-submit" disabled={loading}>
              {loading ? (
                <><span className="spinner" />Creating account...</>
              ) : (
                <>
                  Create account
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </>
              )}
            </button>
          </form>

          <p className="lp-legal">
            Already have an account? <Link href="/login" style={{ fontWeight: 700, color: "var(--accent)" }}>Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
