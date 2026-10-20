"use client";

import { useCallback, useEffect, useState } from "react";
import {
  getIdentityEmails, postIdentityEmails, postIdentityEmailsByEmailIdResend,
  postIdentityEmailsByEmailIdVerify, deleteIdentityEmailsByEmailId,
} from "@/client";
import type { UserEmailDto } from "@/client/types.gen";

const errorText = (data: unknown, fallback: string) => {
  const d = data as { errors?: unknown; title?: string } | undefined;
  if (Array.isArray(d?.errors)) return d.errors.map((e: { description?: string }) => e.description).filter(Boolean).join(", ") || fallback;
  return d?.title || fallback;
};

/**
 * The account's extra emails (alternate or university). Each is verified with a 6-digit code sent to it; a
 * verified email on an academic domain gives the academic badge. Promocodes limited to some emails or to
 * academic accounts only accept verified ones.
 */
export default function ProfileEmailsCard({ onAcademicChange }: { onAcademicChange?: (isAcademic: boolean) => void }) {
  const [emails, setEmails] = useState<UserEmailDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState("");
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    const res = await getIdentityEmails({ throwOnError: false });
    if (res.data?.isSuccess) {
      setEmails(res.data.value?.emails ?? []);
      onAcademicChange?.(!!res.data.value?.isAcademic);
    }
    setLoading(false);
  }, [onAcademicChange]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  // Ticks the "resend in" countdowns.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const run = async (key: string, action: () => Promise<{ data?: { isSuccess?: boolean } | unknown; error?: unknown }>, done: string, fallback: string) => {
    setBusy(key);
    setError("");
    setNotice("");
    try {
      const res = await action();
      const data = res.data as { isSuccess?: boolean } | undefined;
      if (!data?.isSuccess) { setError(errorText(res.data ?? res.error, fallback)); return false; }
      setNotice(done);
      await load();
      return true;
    } catch (err) {
      setError((err instanceof Error && err.message) || fallback);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim();
    if (!email) return;
    const ok = await run("add", () => postIdentityEmails({ body: { email }, throwOnError: false }),
      `We sent a 6-digit code to ${email}.`, "Couldn't add the email.");
    if (ok) setNewEmail("");
  };

  const resendIn = (e: UserEmailDto) =>
    e.resendAvailableAtUtc ? Math.max(0, Math.ceil((new Date(e.resendAvailableAtUtc).getTime() - now) / 1000)) : 0;

  return (
    <section className="pf-card" id="emails">
      <header className="pf-card-head">
        <span className="pf-card-icon">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
        </span>
        <div>
          <h2 className="pf-card-title">Emails &amp; academic status</h2>
          <p className="pf-card-sub">Add your university or another email and verify it with a code.</p>
        </div>
      </header>

      {error && <p className="pf-hint" style={{ color: "var(--danger)", margin: "0 0 0.5rem" }}>{error}</p>}
      {notice && <p className="pf-hint" style={{ color: "var(--success)", margin: "0 0 0.5rem" }}>{notice}</p>}

      {loading ? (
        <div className="skeleton" style={{ height: 48, borderRadius: "var(--radius-md)" }} />
      ) : (
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {emails.map((e) => (
            <li key={e.id} className="pf-setting" style={{ flexDirection: "column", alignItems: "stretch", gap: "0.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 600, wordBreak: "break-all" }}>{e.email}</span>
                {e.isVerified
                  ? <span className="pf-chip is-green">Verified</span>
                  : <span className="pf-chip is-muted">Not verified</span>}
                {e.isAcademic && <span className="pf-chip is-green">🎓 Academic</span>}
                <button type="button" className="btn-ghost pr-btn-sm" style={{ marginLeft: "auto" }} disabled={busy === e.id}
                  onClick={() => run(e.id!, () => deleteIdentityEmailsByEmailId({ path: { emailId: e.id! }, throwOnError: false }), "Email removed.", "Couldn't remove the email.")}>
                  Remove
                </button>
              </div>
              {!e.isVerified && (
                <form style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    run(e.id!, () => postIdentityEmailsByEmailIdVerify({ path: { emailId: e.id! }, body: { code: codes[e.id!] ?? "" }, throwOnError: false }),
                      `${e.email} is verified.`, "Couldn't verify the email.");
                  }}>
                  <input className="form-input" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit code"
                    value={codes[e.id!] ?? ""} onChange={(ev) => setCodes((c) => ({ ...c, [e.id!]: ev.target.value.replace(/\D/g, "") }))}
                    style={{ maxWidth: 160, fontFamily: "var(--font-mono)", letterSpacing: "0.2em" }} />
                  <button type="submit" className="btn-primary" disabled={busy === e.id || (codes[e.id!] ?? "").length !== 6}>Verify</button>
                  <button type="button" className="btn-ghost" disabled={busy === e.id || resendIn(e) > 0}
                    onClick={() => run(e.id!, () => postIdentityEmailsByEmailIdResend({ path: { emailId: e.id! }, throwOnError: false }),
                      `We sent a new code to ${e.email}.`, "Couldn't send a new code.")}>
                    {resendIn(e) > 0 ? `Resend in ${resendIn(e)}s` : "Send new code"}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", flexWrap: "wrap" }}>
        <input className="form-input" type="email" placeholder="you@university.edu.eg" value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)} style={{ flex: 1, minWidth: 200 }} aria-label="Email to add" />
        <button type="submit" className="btn-primary" disabled={busy === "add" || !newEmail.trim()}>
          {busy === "add" ? "Sending…" : "Add & send code"}
        </button>
      </form>
      <p className="pf-hint" style={{ margin: "0.5rem 0 0" }}>
        A verified university email gives you the academic badge and academic discounts. Some promo codes only work for specific verified emails.
      </p>
    </section>
  );
}
