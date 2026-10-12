"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import "./login/login.css";

/** Single-column shell (logo, title, alerts, back-to-login link) shared by the forgot / reset password pages. */
export default function PasswordAuthCard({
  title,
  subtitle,
  error,
  notice,
  children,
}: {
  title: string;
  subtitle: string;
  error?: string;
  notice?: string;
  children?: React.ReactNode;
}) {
  return (
    <main className="lp" style={{ gridTemplateColumns: "1fr" }}>
      <section className="lp-panel">
        <Link href="/login" className="lp-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to sign in
        </Link>

        <div className="lp-form-wrap">
          <BrandLogo height={38} alt="AGECS" />

          <h1 className="lp-title">{title}</h1>
          <p className="lp-subtitle">{subtitle}</p>

          {error && (
            <div className="alert-error lp-alert" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {notice && (
            <div
              role="status"
              className="lp-alert"
              style={{
                display: "flex", gap: "0.6rem", alignItems: "flex-start", padding: "0.85rem 1rem",
                borderRadius: "var(--radius-md)", border: "1px solid var(--success)", color: "var(--text-primary)",
                background: "color-mix(in srgb, var(--success) 10%, transparent)", fontSize: "0.9rem",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {notice}
            </div>
          )}

          {children}
        </div>
      </section>
    </main>
  );
}

/** Error text from an API Result body. */
export const resultErrorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;
