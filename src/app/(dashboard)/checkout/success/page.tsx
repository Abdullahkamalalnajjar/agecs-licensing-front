"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiPaymentsById } from "@/client";
import { client } from "@/client/client.gen";

type PollState = "polling" | "confirmed" | "pending" | "failed" | "no-payment";

const POLL_INTERVAL_MS = 2500;
const MAX_ATTEMPTS = 16; // ~40s, enough for the webhook to land

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PollState>("polling");
  const [serials, setSerials] = useState<string[]>([]);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  useEffect(() => {
    client.setConfig({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
      auth: (() => {
        try {
          return localStorage.getItem("token") || undefined;
        } catch {
          return undefined;
        }
      })(),
    });

    const paymentId =
      searchParams.get("paymentId") ||
      (() => {
        try {
          return sessionStorage.getItem("lastPaymentId");
        } catch {
          return null;
        }
      })();

    if (!paymentId) {
      setState("no-payment");
      return;
    }

    let cancelled = false;

    const poll = async () => {
      attemptsRef.current += 1;
      try {
        const res = await getApiPaymentsById({ path: { id: paymentId }, throwOnError: false });
        const payment = res.data?.value;

        if (cancelled) return;

        if (payment?.confirmed && payment.licenseSerials && payment.licenseSerials.length > 0) {
          setSerials(payment.licenseSerials.filter((s): s is string => !!s));
          setState("confirmed");
          try {
            sessionStorage.removeItem("lastPaymentId");
          } catch {
            /* ignore */
          }
          return;
        }

        if (payment?.status === "failed") {
          setState("failed");
          return;
        }

        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setState("pending");
          return;
        }

        setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        if (attemptsRef.current >= MAX_ATTEMPTS) {
          setState("pending");
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const copySerial = async (serial: string) => {
    try {
      await navigator.clipboard.writeText(serial);
      setCopiedSerial(serial);
      setTimeout(() => setCopiedSerial(null), 1500);
    } catch {
      /* ignore */
    }
  };

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
      {state === "polling" && (
        <>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(59,130,246,0.1)",
              color: "#3b82f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg className="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>Confirming your payment…</h1>
          <p style={{ margin: 0, maxWidth: "420px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Stripe confirmed the charge — we&apos;re issuing your license now. This usually takes a few seconds.
          </p>
        </>
      )}

      {state === "confirmed" && (
        <>
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
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>Thank you! Payment successful</h1>
          <p style={{ margin: 0, maxWidth: "420px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Your license {serials.length > 1 ? "keys are" : "key is"} ready:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", width: "100%", maxWidth: "360px" }}>
            {serials.map((serial) => (
              <button
                key={serial}
                onClick={() => copySerial(serial)}
                title="Click to copy"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem 1.1rem",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                  background: "var(--bg-base)",
                  color: "var(--text-primary)",
                  fontFamily: "monospace",
                  fontSize: "1rem",
                  fontWeight: 700,
                  letterSpacing: "0.03em",
                  cursor: "pointer",
                }}
              >
                <span>{serial}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: copiedSerial === serial ? "#22c55e" : "var(--text-secondary)" }}>
                  {copiedSerial === serial ? "Copied!" : "Copy"}
                </span>
              </button>
            ))}
          </div>
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
        </>
      )}

      {state === "pending" && (
        <>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "rgba(234,179,8,0.12)",
              color: "#eab308",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "var(--text-primary)" }}>Almost there</h1>
          <p style={{ margin: 0, maxWidth: "420px", color: "var(--text-secondary)", fontSize: "0.95rem" }}>
            Your payment went through and your license is still being issued. Check your licenses page in a minute — it&apos;ll show up automatically.
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
        </>
      )}

      {(state === "failed" || state === "no-payment") && (
        <>
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
        </>
      )}
    </div>
  );
}
