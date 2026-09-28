"use client";

import Link from "next/link";

export default function CheckoutSuccessPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        gap: "1.25rem",
        padding: "2rem",
      }}
    >
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "50%",
          background: "rgba(34,197,94,0.12)",
          color: "#22c55e",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>Payment successful</h1>
      <p style={{ margin: 0, maxWidth: "420px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
        Thanks for your purchase. Your license is being issued and will appear in your account shortly.
      </p>
      <Link
        href="/licenses"
        style={{
          marginTop: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "10px",
          background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        View my licenses
      </Link>
    </div>
  );
}
