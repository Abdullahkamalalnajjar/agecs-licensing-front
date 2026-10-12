"use client";

import { useState } from "react";
import Link from "next/link";
import { postIdentityForgotPassword } from "@/client";
import { client } from "@/client/client.gen";
import PasswordAuthCard, { resultErrorText } from "../PasswordAuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      client.setConfig({ baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003" });
      const res = await postIdentityForgotPassword({ body: { email: email.trim() }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setError(resultErrorText(res.data ?? res.error, "Couldn't send the reset email. Please try again."));
        return;
      }
      setSent(true);
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't send the reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PasswordAuthCard
      title="Forgot your password?"
      subtitle="Enter your account email and we'll send you a link to choose a new one."
      error={error}
      // The API answers the same whether or not the email has an account, so the message can't confirm either.
      notice={sent ? `If an account exists for ${email.trim()}, a reset link is on its way. It expires in 1 hour.` : undefined}
    >
      {!sent ? (
        <form onSubmit={handleSubmit} className="lp-form">
          <div className="lp-field">
            <label className="lp-label" htmlFor="email">Email address</label>
            <div className="lp-input-wrap">
              <span className="lp-input-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 6L2 7" /></svg>
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

          <button type="submit" className="lp-submit" disabled={loading || !email.trim()}>
            {loading ? (<><span className="spinner" />Sending...</>) : "Send reset link"}
          </button>
        </form>
      ) : (
        <p className="lp-legal">
          Didn&apos;t get it? Check your spam folder, or{" "}
          <button type="button" onClick={() => setSent(false)} style={{ background: "none", border: "none", padding: 0, font: "inherit", fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>
            try again
          </button>.
        </p>
      )}

      <p className="lp-legal">
        Remembered it? <Link href="/login" style={{ fontWeight: 700, color: "var(--accent)" }}>Sign in</Link>
      </p>
    </PasswordAuthCard>
  );
}
