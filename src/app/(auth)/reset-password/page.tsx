"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { postIdentityResetPassword } from "@/client";
import { client } from "@/client/client.gen";
import PasswordAuthCard, { resultErrorText } from "../PasswordAuthCard";

const MIN_LENGTH = 6; // matches the API's Identity password rules

function ResetPasswordForm() {
  // The emailed link is /reset-password?email=...&token=...
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const linkIsIncomplete = !email || !token;
  const problem =
    password && password.length < MIN_LENGTH ? `Password must be at least ${MIN_LENGTH} characters.`
    : confirm && confirm !== password ? "Passwords don't match."
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (problem || !password || password !== confirm) return;
    setLoading(true);
    setError("");

    try {
      client.setConfig({ baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003" });
      const res = await postIdentityResetPassword({ body: { email, token, newPassword: password }, throwOnError: false });
      if (res.error || res.data?.isError) {
        setError(resultErrorText(res.data ?? res.error, "Couldn't reset your password. Please try again."));
        return;
      }
      setDone(true);
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't reset your password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (linkIsIncomplete) {
    return (
      <PasswordAuthCard
        title="Reset link is incomplete"
        subtitle="Open the link from your email again, or request a new one."
      >
        <Link href="/forgot-password" className="lp-submit" style={{ textDecoration: "none" }}>Request a new link</Link>
      </PasswordAuthCard>
    );
  }

  if (done) {
    return (
      <PasswordAuthCard
        title="Password updated"
        subtitle="You've been signed out on all devices. Sign in with your new password."
        notice="Your password has been changed."
      >
        <Link href="/login" className="lp-submit" style={{ textDecoration: "none" }}>Go to sign in</Link>
      </PasswordAuthCard>
    );
  }

  return (
    <PasswordAuthCard title="Choose a new password" subtitle={`For ${email}`} error={error}>
      <form onSubmit={handleSubmit} className="lp-form">
        <div className="lp-field">
          <label className="lp-label" htmlFor="new-password">New password</label>
          <div className="lp-input-wrap">
            <span className="lp-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="lp-input has-toggle"
              placeholder={`At least ${MIN_LENGTH} characters`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="button" className="lp-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} tabIndex={-1}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>

        <div className="lp-field">
          <label className="lp-label" htmlFor="confirm-password">Confirm new password</label>
          <div className="lp-input-wrap">
            <span className="lp-input-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
            </span>
            <input
              id="confirm-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              className="lp-input"
              placeholder="Type it again"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
        </div>

        {problem && <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--danger)" }}>{problem}</p>}

        <button type="submit" className="lp-submit" disabled={loading || !!problem || !password || password !== confirm}>
          {loading ? (<><span className="spinner" />Saving...</>) : "Save new password"}
        </button>
      </form>
    </PasswordAuthCard>
  );
}

export default function ResetPasswordPage() {
  // useSearchParams needs a Suspense boundary, or the production build fails for this static route.
  return (
    <Suspense fallback={<PasswordAuthCard title="Choose a new password" subtitle="Loading…" />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
