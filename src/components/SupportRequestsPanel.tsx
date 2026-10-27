"use client";
import { useCallback, useEffect, useState } from "react";
import { getApiLicensesSupportRequests, postApiLicensesSupportRequestsByIdFulfill } from "@/client";
import type { SupportRequestDto } from "@/client/types.gen";
import { usePermissions } from "@/components/AuthProvider";
import { P } from "@/lib/permissions";
import { useToast } from "@/components/ToastProvider";

type Filter = "awaiting_support" | "fulfilled" | "";

const FILTERS: [Filter, string][] = [["awaiting_support", "Awaiting"], ["fulfilled", "Fulfilled"], ["", "All"]];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorText = (data: any, fallback: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") || fallback;

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const fmtPeriod = (days?: number) => {
  if (!days) return "—";
  if (days % 365 === 0) return `${days / 365} year${days / 365 !== 1 ? "s" : ""}`;
  if (days % 30 === 0) return `${days / 30} month${days / 30 !== 1 ? "s" : ""}`;
  return `${days} day${days !== 1 ? "s" : ""}`;
};

export const requestProduct = (r: SupportRequestDto) =>
  r.parentProductName && r.parentProductName !== r.productName ? `${r.parentProductName} › ${r.productName}` : r.productName || "Unknown product";

/**
 * Items of manual-fulfillment companies (e.g. NanoCAD) waiting for support to issue their license by hand.
 * ready = the API client is configured (the licenses list loaded once); onFulfilled refreshes the licenses list.
 */
export default function SupportRequestsPanel({ ready, onFulfilled }: { ready: boolean; onFulfilled: () => void }) {
  const { can } = usePermissions();
  const canFulfill = can(P.licenses.create);
  const [filter, setFilter] = useState<Filter>("awaiting_support");
  const [requests, setRequests] = useState<SupportRequestDto[]>([]);
  const [awaitingCount, setAwaitingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(true);
  const [fulfilling, setFulfilling] = useState<SupportRequestDto | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, awaitingRes] = await Promise.all([
        getApiLicensesSupportRequests({ query: { status: filter }, throwOnError: false }),
        filter === "awaiting_support" ? Promise.resolve(null) : getApiLicensesSupportRequests({ query: { status: "awaiting_support" }, throwOnError: false }),
      ]);
      const list = listRes.data?.isSuccess ? listRes.data.value || [] : [];
      setRequests(list);
      setAwaitingCount(awaitingRes ? (awaitingRes.data?.isSuccess ? awaitingRes.data.value?.length ?? 0 : 0) : list.length);
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (ready) load(); }, [ready, load]);

  return (
    <section className="pr-panel" style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}
          style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: "none", border: 0, padding: 0, cursor: "pointer", color: "var(--text-primary)", fontWeight: 700, fontSize: "1rem" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? "rotate(90deg)" : undefined, transition: "transform 0.15s ease" }} aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
          Support requests
          {awaitingCount > 0 && <span className="pr-badge pr-badge-soon">{awaitingCount} awaiting</span>}
        </button>
        <span className="pr-muted" style={{ fontSize: "0.8rem" }}>Licenses issued by support — contact the customer within 48 hours.</span>
        {open && (
          <div className="pr-segment" role="group" aria-label="Request status" style={{ marginLeft: "auto" }}>
            {FILTERS.map(([key, label]) => (
              <button key={key || "all"} type="button" className={filter === key ? "is-active" : ""} onClick={() => setFilter(key)} aria-pressed={filter === key}>{label}</button>
            ))}
          </div>
        )}
      </div>

      {open && (
        loading ? (
          <div className="skeleton" style={{ height: 60, marginTop: "1rem", borderRadius: "var(--radius-md)" }} />
        ) : requests.length === 0 ? (
          <p className="pr-muted" style={{ margin: "1rem 0 0", fontSize: "0.85rem" }}>
            {filter === "awaiting_support" ? "No requests waiting for support." : "No support requests."}
          </p>
        ) : (
          <div className="data-table-wrapper" style={{ marginTop: "1rem" }}>
            <table className="data-table pr-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Package</th>
                  <th>Period</th>
                  <th>Seats</th>
                  <th>Purchased</th>
                  <th>Status</th>
                  {canFulfill && <th style={{ textAlign: "right" }}>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => {
                  const awaiting = r.status === "awaiting_support";
                  return (
                    <tr key={r.id}>
                      <td>{r.userEmail || "—"}</td>
                      <td><span className="lc-product">{requestProduct(r)}</span></td>
                      <td>{r.packageName || "—"}</td>
                      <td className="pr-nowrap">{fmtPeriod(r.periodDays)}</td>
                      <td>{r.licenseCount ?? 1}</td>
                      <td className="pr-nowrap">{fmtDate(r.createdAtUtc)}</td>
                      <td>
                        {awaiting
                          ? <span className="pr-badge pr-badge-soon"><span className="pr-dot" />Awaiting support</span>
                          : <span className="pr-badge pr-badge-visible"><span className="pr-dot" />Fulfilled</span>}
                      </td>
                      {canFulfill && (
                        <td style={{ textAlign: "right" }}>
                          {awaiting && <button type="button" className="btn-primary pr-btn-sm" onClick={() => setFulfilling(r)}>Fulfill</button>}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {fulfilling && (
        <FulfillModal
          request={fulfilling}
          onClose={() => setFulfilling(null)}
          onSuccess={() => { setFulfilling(null); load(); onFulfilled(); }}
        />
      )}
    </section>
  );
}

const PLATFORMS: [string, string][] = [["network", "Network"], ["workstation", "Workstation"], ["standalone", "Standalone"]];

const toDateInput = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function FulfillModal({ request, onClose, onSuccess }: { request: SupportRequestDto; onClose: () => void; onSuccess: () => void }) {
  const { success } = useToast();
  const [licenseFullName, setLicenseFullName] = useState(request.suggestedLicenseName || requestProduct(request));
  const [vendorUsername, setVendorUsername] = useState("");
  const [vendorPassword, setVendorPassword] = useState("");
  const [serial, setSerial] = useState("");
  const [platform, setPlatform] = useState("");
  const [seats, setSeats] = useState(String(request.licenseCount ?? 1));
  const [issuedAt, setIssuedAt] = useState(() => toDateInput(new Date()));
  // Follows the creation date (plus the purchased period) until edited by hand.
  const [expiryEdited, setExpiryEdited] = useState(false);
  const [expiryInput, setExpiryInput] = useState("");
  const defaultExpiry = (() => {
    if (!request.periodDays || !issuedAt) return "";
    const d = new Date(`${issuedAt}T00:00:00`);
    d.setDate(d.getDate() + request.periodDays);
    return toDateInput(d);
  })();
  const expiryDate = expiryEdited ? expiryInput : defaultExpiry;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (expiryDate && issuedAt && expiryDate <= issuedAt) { setError("The expiry date must be after the creation date."); return; }
    setLoading(true);
    setError("");
    try {
      const count = parseInt(seats, 10);
      const res = await postApiLicensesSupportRequestsByIdFulfill({
        path: { id: request.id! },
        body: {
          licenseFullName: licenseFullName.trim(),
          vendorUsername: vendorUsername.trim(),
          vendorPassword,
          serial: serial.trim(),
          platform,
          licenseCount: Number.isFinite(count) && count > 0 ? count : null,
          issuedAt: issuedAt ? new Date(`${issuedAt}T00:00:00`).toISOString() : null,
          expiryDate: expiryDate ? new Date(`${expiryDate}T23:59:59`).toISOString() : null,
        },
        throwOnError: false,
      });
      if (res.data?.isSuccess) {
        success("License issued and emailed to the customer.");
        onSuccess();
      } else {
        setError(errorText(res.data ?? res.error, res.response?.status === 409 ? "This request was already fulfilled." : "Failed to fulfill the request."));
      }
    } catch (err) {
      setError((err instanceof Error && err.message) || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const hint = { margin: "0.3rem 0 0", fontSize: "0.75rem", color: "var(--text-muted)" } as const;
  const row = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" } as const;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}>
      <div className="modal-container" style={{ maxWidth: 520, overflow: "hidden" }}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title" style={{ fontSize: "1.1rem", margin: 0 }}>Fulfill support request</h2>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>
              {requestProduct(request)}{request.userEmail ? ` · ${request.userEmail}` : ""}{request.userName ? ` (${request.userName})` : ""}
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} disabled={loading} aria-label="Close">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: "1.5rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem", maxHeight: "70vh", overflowY: "auto" }}>
            {error && <div className="alert-error">{error}</div>}
            <div>
              <label className="form-label" htmlFor="fulfill-name">License full name</label>
              <input id="fulfill-name" className="form-input" value={licenseFullName} onChange={(e) => setLicenseFullName(e.target.value)} required autoFocus />
              <p style={hint}>Filled from the request; change it to the vendor&apos;s name for the license.</p>
            </div>
            <div style={row}>
              <div>
                <label className="form-label" htmlFor="fulfill-username">Username</label>
                <input id="fulfill-username" className="form-input" value={vendorUsername} onChange={(e) => setVendorUsername(e.target.value)} placeholder="NanoCAD username" autoComplete="off" required />
              </div>
              <div>
                <label className="form-label" htmlFor="fulfill-password">Password</label>
                <input id="fulfill-password" className="form-input" value={vendorPassword} onChange={(e) => setVendorPassword(e.target.value)} placeholder="NanoCAD password" autoComplete="new-password" required />
              </div>
            </div>
            <div>
              <label className="form-label" htmlFor="fulfill-serial">Serial number</label>
              <input id="fulfill-serial" className="form-input" value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="Serial from the vendor" required />
            </div>
            <div style={row}>
              <div>
                <label className="form-label" htmlFor="fulfill-platform">Platform</label>
                <select id="fulfill-platform" className="form-input" value={platform} onChange={(e) => setPlatform(e.target.value)} required>
                  <option value="" disabled>Choose…</option>
                  {PLATFORMS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label" htmlFor="fulfill-seats">Number of licenses</label>
                <input id="fulfill-seats" type="number" min={1} className="form-input" value={seats} onChange={(e) => setSeats(e.target.value)} required />
              </div>
            </div>
            <div style={row}>
              <div>
                <label className="form-label" htmlFor="fulfill-issued">Creation date</label>
                <input id="fulfill-issued" type="date" className="form-input" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)} required />
              </div>
              <div>
                <label className="form-label" htmlFor="fulfill-expiry">Expiry date</label>
                <input id="fulfill-expiry" type="date" className="form-input" value={expiryDate} min={issuedAt || undefined}
                  onChange={(e) => { setExpiryEdited(true); setExpiryInput(e.target.value); }} />
              </div>
            </div>
            <p style={{ ...hint, marginTop: "-0.5rem" }}>
              Expiry is the purchased period ({fmtPeriod(request.periodDays)}) from the creation date; change it if the vendor&apos;s differs.
              Everything above is emailed to the customer and shown in their licenses.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? "Issuing…" : "Issue license"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
