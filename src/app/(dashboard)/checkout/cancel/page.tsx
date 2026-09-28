"use client";

import Link from "next/link";

export default function CheckoutCancelPage() {
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
          background: "rgba(239,68,68,0.1)",
          color: "#ef4444",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </div>
      <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>Payment cancelled</h1>
      <p style={{ margin: 0, maxWidth: "420px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
        No charge was made. Your cart is still saved — you can try checking out again anytime.
      </p>
      <Link
        href="/home"
        style={{
          marginTop: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderRadius: "10px",
          background: "var(--bg-elevated)",
          border: "1px solid var(--border)",
          color: "var(--text-primary)",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Back to home
      </Link>
    </div>
  );
}
