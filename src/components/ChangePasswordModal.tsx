"use client";

import { useEffect, useState } from "react";
import { getIdentityCurrentUser, postIdentityChangePassword } from "@/client";
import { client } from "@/client/client.gen";
import { useToast } from "@/components/ToastProvider";

const MIN_LENGTH = 6; // matches the API's Identity password rules

const errorText = (data: unknown, fallback: string) =>
  (data as { errors?: { description?: string | null }[] | null } | undefined)?.errors
    ?.map((e) => e.description)
    .filter(Boolean)
    .join(", ") || fallback;

/**
 * Asks /identity/current-user whether the account has a password when it opens, so it works wherever it is
 * opened from. No password yet (a Google account that never set one): no current password is asked for, and
 * the same endpoint sets the first password.
 */
export default function ChangePasswordModal({ onClose, onSuccess }: { onClose: () => void; onSuccess?: () => void }) {
  // null while checking.
  const [hasPassword, setHasPassword] = useState<boolean | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { success } = useToast();

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token");
    client.setConfig({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
      ...(token ? { auth: token } : {}),
    });
    getIdentityCurrentUser({ throwOnError: false })
      // If the check fails, assume a password exists: asking for it is the safe side, and the API checks anyway.
      .then((r) => { if (!cancelled) setHasPassword(r.data?.isSuccess ? r.data.value?.hasPassword !== false : true); })
      .catch(() => { if (!cancelled) setHasPassword(true); });
    return () => { cancelled = true; };
  }, []);

  const problem =
    newPassword && newPassword.length < MIN_LENGTH ? `New password must be at least ${MIN_LENGTH} characters.`
    : confirm && confirm !== newPassword ? "Passwords don't match."
    : newPassword && currentPassword && newPassword === currentPassword ? "New password must be different from the current one."
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasPassword === null || problem || !newPassword || newPassword !== confirm || (hasPassword && !currentPassword)) return;
    setLoading(true);
    setError("");

    try {
      const res = await postIdentityChangePassword({
        body: { currentPassword: hasPassword ? currentPassword : null, newPassword },
        throwOnError: false,
      });
      if (res.error || res.data?.isError) {
        setError(errorText(res.data ?? res.error, "Couldn't change your password."));
        return;
      }
      success(hasPassword ? "Password changed." : "Password set. You can now also sign in with your email.");
      onSuccess?.();
      onClose();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Couldn't change your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">{hasPassword === false ? "Set a password" : "Change password"}</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <form id="changePasswordForm" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {hasPassword === null ? (
              <div className="skeleton" style={{ height: "62px", borderRadius: "var(--radius-md)" }} aria-label="Checking your account" />
            ) : hasPassword ? (
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="current-password">Current password</label>
                <input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  className="form-input"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                You signed up with Google, so your account has no password yet. Set one to also sign in with your email.
              </p>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                autoComplete="new-password"
                className="form-input"
                placeholder={`At least ${MIN_LENGTH} characters`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                className="form-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>

            {problem && <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--danger)" }}>{problem}</p>}
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
          <button type="submit" form="changePasswordForm" className="btn-primary" disabled={hasPassword === null || loading || !!problem || !newPassword || newPassword !== confirm || (hasPassword && !currentPassword)}>
            {loading ? "Saving..." : hasPassword === false ? "Set password" : "Change password"}
          </button>
        </div>
      </div>
    </div>
  );
}
