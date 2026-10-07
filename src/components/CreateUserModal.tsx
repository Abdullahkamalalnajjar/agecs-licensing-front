"use client";

import { useState } from "react";
import { postIdentitySignup } from "@/client";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

const ROLES = ["NormalUser", "Student", "User", "Editor", "Sales", "Admin", "SystemAdmin", "SuperAdmin"] as const;
// The API requires a city and phone number for these roles only.
const CUSTOMER_ROLES = new Set(["NormalUser", "Student", "User"]);
const STAFF_ROLES = new Set(["Editor", "Sales", "Admin", "SystemAdmin", "SuperAdmin"]);

const errorText = (data: unknown, fallback: string) => {
  const d = data as { errors?: unknown; title?: string } | undefined;
  if (Array.isArray(d?.errors)) return d.errors.map((e: { description?: string }) => e.description).filter(Boolean).join(", ") || fallback;
  if (d?.errors && typeof d.errors === "object") return Object.values(d.errors as Record<string, string[]>).flat().join(" ") || fallback;
  return d?.title || fallback;
};

/**
 * Admin-only account creation with a chosen role (POST /identity/signup, which requires an admin token).
 * The API also returns a token for the new account; it's ignored so the admin stays signed in as themselves.
 */
export default function CreateUserModal({ onClose, onCreated }: { onClose: () => void; onCreated: (email: string) => void }) {
  const [form, setForm] = useState({ email: "", password: "", role: "NormalUser", city: "", phoneNumber: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));
  const needsContact = CUSTOMER_ROLES.has(form.role);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await postIdentitySignup({
        baseUrl,
        body: {
          email: form.email.trim(),
          password: form.password,
          role: form.role,
          city: form.city.trim() || null,
          phoneNumber: form.phoneNumber.trim() || null,
        },
        throwOnError: false,
      });
      if (res.response?.status === 403) throw new Error("Only Admin, SystemAdmin and SuperAdmin accounts can create users.");
      if (res.error || !res.data?.isSuccess) throw new Error(errorText(res.error ?? res.data, "Failed to create the user."));
      onCreated(form.email.trim());
      onClose();
    } catch (err) {
      setError((err instanceof Error && err.message) || "Failed to create the user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}>
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">New user</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && <div className="alert-error" role="alert">{error}</div>}

          <form id="createUserForm" onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="cuEmail">Email *</label>
              <input id="cuEmail" type="email" className="form-input" required autoFocus autoComplete="off"
                value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="name@company.com" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="cuPassword">Password *</label>
                <input id="cuPassword" type="text" className="form-input" required minLength={6} autoComplete="new-password"
                  value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="At least 6 characters" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="cuRole">Role *</label>
                <select id="cuRole" className="form-input" value={form.role} onChange={(e) => set({ role: e.target.value })} style={{ appearance: "auto" }}>
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            {STAFF_ROLES.has(form.role) && (
              <div className="alert-warning" style={{ fontSize: "0.82rem", padding: "0.6rem 0.85rem", borderRadius: "var(--radius-md)", background: "rgba(217,119,6,0.1)", color: "#b45309", border: "1px solid rgba(217,119,6,0.3)" }}>
                <strong>{form.role}</strong> is a staff role with access to the admin dashboard.
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="cuPhone">Phone {needsContact ? "*" : "(optional)"}</label>
                <input id="cuPhone" type="tel" className="form-input" required={needsContact}
                  value={form.phoneNumber} onChange={(e) => set({ phoneNumber: e.target.value })} placeholder="+20 100 000 0000" />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="cuCity">City {needsContact ? "*" : "(optional)"}</label>
                <input id="cuCity" type="text" className="form-input" required={needsContact}
                  value={form.city} onChange={(e) => set({ city: e.target.value })} placeholder="Cairo" />
              </div>
            </div>
          </form>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="createUserForm" className="btn-primary" disabled={saving}>
            {saving ? "Creating…" : "Create user"}
          </button>
        </div>
      </div>
    </div>
  );
}
