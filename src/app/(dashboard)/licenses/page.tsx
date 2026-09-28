"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import {
  getApiLicenses,
  getApiProducts,
  getIdentityUsers,
  deleteApiLicensesById,
  postApiLicensesAdminByIdRevoke,
} from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LicenseFormModal from "@/components/LicenseFormModal";
import LicenseDetailsModal from "@/components/LicenseDetailsModal";
import RenewLicenseModal from "@/components/RenewLicenseModal";
import MigrateHwidModal from "@/components/MigrateHwidModal";
import HwidListModal from "@/components/HwidListModal";
import DiagnosticModal from "@/components/DiagnosticModal";
import type { LicenseDto, ProductDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import "../products/products.css";
import "./licenses.css";

/** Some deployments return usage counters that are not in the generated DTO yet. */
type License = LicenseDto & { usedCount?: number; migrationCount?: number };
type StatusFilter = "all" | "active" | "inactive" | "expiring" | "expired";
type TypeFilter = "all" | "paid" | "trial";

const DAY = 86_400_000;
const EXPIRING_DAYS = 30;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const errorText = (data: any, fallback: string) =>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?.errors?.map((e: any) => e.description).filter(Boolean).join(", ") || fallback;

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" }) : "—";

const seatsUsed = (l: License) => l.usedCount ?? (l.clients || []).filter((c) => c.isActive !== false).length;

function daysLeft(l: License, now: number) {
  if (!l.expiryDate || l.willExpire === false) return null;
  return Math.ceil((new Date(l.expiryDate).getTime() - now) / DAY);
}

const isExpired = (l: License, now: number) => l.isExpired || (daysLeft(l, now) ?? 1) <= 0;
const isExpiring = (l: License, now: number) => {
  const d = daysLeft(l, now);
  return d != null && d > 0 && d <= EXPIRING_DAYS;
};

const Svg = ({ size = 15, children }: { size?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  search: <><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></>,
  view: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>,
  edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
  renew: <><path d="M23 4v6h-6" /><path d="M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></>,
  migrate: <><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></>,
  chip: <><rect x="4" y="4" width="16" height="16" rx="2" /><rect x="9" y="9" width="6" height="6" /></>,
  pulse: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  ban: <><circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" /></>,
  trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  close: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  monitor: <><rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  alert: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
};

function IconButton({ title, onClick, tone = "accent", disabled, children }: {
  title: string; onClick: () => void; tone?: "accent" | "green" | "purple" | "amber" | "danger"; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} aria-label={title} className={`pr-icon-btn pr-tone-${tone}`} onClick={onClick} disabled={disabled}>
      <Svg>{children}</Svg>
    </button>
  );
}

function CopySerial({ serial, full }: { serial?: string | null; full?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!serial) return <span className="pr-muted">No serial</span>;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(serial);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button type="button" className={`lc-serial ${full ? "is-full" : ""} ${copied ? "is-copied" : ""}`} onClick={copy} title={copied ? "Copied" : "Copy serial"}>
      <span className="lc-serial-text">{serial}</span>
      <Svg size={13}>{copied ? Icon.check : Icon.copy}</Svg>
    </button>
  );
}

function StatusBadges({ license, now }: { license: License; now: number }) {
  const expired = isExpired(license, now);
  return (
    <div className="pr-badges">
      {expired ? (
        <span className="pr-badge lc-badge-expired"><span className="pr-dot" />Expired</span>
      ) : license.isActive ? (
        <span className="pr-badge pr-badge-visible"><span className="pr-dot" />Active</span>
      ) : (
        <span className="pr-badge pr-badge-hidden"><span className="pr-dot" />Inactive</span>
      )}
      {license.isTrial && <span className="pr-badge pr-badge-soon">Trial</span>}
    </div>
  );
}

function Expiry({ license, now }: { license: License; now: number }) {
  const d = daysLeft(license, now);
  if (d == null) return <span className="lc-lifetime">Lifetime</span>;
  const tone = d <= 0 ? "is-expired" : d <= EXPIRING_DAYS ? "is-expiring" : "";
  return (
    <span className={`lc-expiry ${tone}`}>
      <span className="lc-expiry-date">{fmtDate(license.expiryDate)}</span>
      <span className="lc-expiry-left">{d <= 0 ? `${Math.abs(d)}d ago` : `${d}d left`}</span>
    </span>
  );
}

function Meter({ used, total, label }: { used: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0;
  return (
    <div className="lc-meter" title={`${used} of ${total} ${label}`}>
      <div className="lc-meter-head">
        <span>{label}</span>
        <span className="lc-meter-num"><strong>{used}</strong>/{total}</span>
      </div>
      <div className="lc-meter-track"><div className={`lc-meter-fill ${pct >= 100 ? "is-full" : ""}`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

export default function LicensesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(0);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [detailsLicense, setDetailsLicense] = useState<License | null>(null);
  const [renewLicenseId, setRenewLicenseId] = useState<string | null>(null);
  const [migrateLicenseId, setMigrateLicenseId] = useState<string | null>(null);
  const [hwidListLicenseId, setHwidListLicenseId] = useState<string | null>(null);
  const [diagnosticLicenseId, setDiagnosticLicenseId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; action: "revoke" | "delete" } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");

  const isStaff = user != null && user.role !== "Student" && user.role !== "NormalUser";

  const fetchLicenses = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }
      client.setConfig({ baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004", auth: token });

      const [licensesRes, productsRes, usersRes] = await Promise.all([
        getApiLicenses({ throwOnError: false }),
        getApiProducts({ throwOnError: false }),
        isStaff ? getIdentityUsers({ throwOnError: false }) : Promise.resolve(null),
      ]);

      if (usersRes?.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = usersRes.data as any;
        setUsers(Array.isArray(raw?.value?.items) ? raw.value.items : Array.isArray(raw?.value) ? raw.value : Array.isArray(raw) ? raw : []);
      }
      if (productsRes.data?.isSuccess) setProducts(productsRes.data.value || []);
      if (licensesRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = licensesRes.data as any;
        const list = raw.value ?? raw;
        setLicenses(Array.isArray(list) ? list : []);
      } else if (licensesRes.error) {
        setError("Failed to load licenses.");
      }
      setNow(Date.now());
    } catch (err) {
      setError((err instanceof Error && err.message) || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [router, user, isStaff]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const productName = useCallback((l: License) => {
    if (l.productName) return l.productName;
    const p = products.find((x) => x.id === l.productId);
    return p ? `${p.name}${p.version ? ` ${p.version}` : ""}` : "Unknown product";
  }, [products]);

  const runAction = async (id: string, action: "revoke" | "delete") => {
    setBusyId(id);
    try {
      const res = action === "delete"
        ? await deleteApiLicensesById({ path: { id }, throwOnError: false })
        : await postApiLicensesAdminByIdRevoke({ path: { id }, throwOnError: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = res.data as any;
      if (data?.isSuccess || res.response?.status === 200 || res.response?.status === 204) {
        success(action === "delete" ? "License deleted." : "License revoked.");
        fetchLicenses();
      } else {
        toastError(errorText(data, `Failed to ${action} license.`));
      }
    } catch (err) {
      toastError((err instanceof Error && err.message) || "An error occurred.");
    } finally {
      setBusyId(null);
      setConfirm(null);
    }
  };

  const stats = useMemo(() => ({
    total: licenses.length,
    active: licenses.filter((l) => l.isActive && !isExpired(l, now)).length,
    expiring: licenses.filter((l) => isExpiring(l, now)).length,
    expired: licenses.filter((l) => isExpired(l, now)).length,
    trial: licenses.filter((l) => l.isTrial).length,
  }), [licenses, now]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return licenses
      .filter((l) => {
        if (status === "active" && !(l.isActive && !isExpired(l, now))) return false;
        if (status === "inactive" && l.isActive) return false;
        if (status === "expiring" && !isExpiring(l, now)) return false;
        if (status === "expired" && !isExpired(l, now)) return false;
        if (type === "trial" && !l.isTrial) return false;
        if (type === "paid" && l.isTrial) return false;
        if (!q) return true;
        return [l.serial, l.name, l.email, productName(l), l.type].some((s) => s?.toLowerCase().includes(q));
      })
      .sort((a, b) => new Date(b.createdAtUtc || 0).getTime() - new Date(a.createdAtUtc || 0).getTime());
  }, [licenses, search, status, type, now, productName]);

  const hasFilters = !!search || status !== "all" || type !== "all";
  const clearFilters = () => { setSearch(""); setStatus("all"); setType("all"); };

  const renderStaffActions = (l: License) => (
    <div className="pr-actions">
      <IconButton title="View details" onClick={() => setDetailsLicense(l)}>{Icon.view}</IconButton>
      <IconButton title="Edit license" onClick={() => { setEditingLicense(l); setIsFormModalOpen(true); }}>{Icon.edit}</IconButton>
      <IconButton title="Renew license" tone="green" onClick={() => setRenewLicenseId(l.id!)}>{Icon.renew}</IconButton>
      <IconButton title="Migrate HWID" tone="purple" onClick={() => setMigrateLicenseId(l.id!)}>{Icon.migrate}</IconButton>
      <IconButton title="Devices (HWIDs)" tone="purple" onClick={() => setHwidListLicenseId(l.id!)}>{Icon.chip}</IconButton>
      <IconButton title="Diagnostic" tone="amber" onClick={() => setDiagnosticLicenseId(l.id!)}>{Icon.pulse}</IconButton>
      {confirm && confirm.id === l.id ? (
        <span className="pr-confirm lc-confirm">
          <span className="lc-confirm-label">{confirm.action === "delete" ? "Delete?" : "Revoke?"}</span>
          <IconButton title={`Confirm ${confirm.action}`} tone="danger" onClick={() => runAction(l.id!, confirm.action)} disabled={busyId === l.id}>{Icon.check}</IconButton>
          <IconButton title="Cancel" onClick={() => setConfirm(null)}>{Icon.close}</IconButton>
        </span>
      ) : (
        <>
          {l.isActive && <IconButton title="Revoke license" tone="danger" onClick={() => setConfirm({ id: l.id!, action: "revoke" })}>{Icon.ban}</IconButton>}
          <IconButton title="Delete license" tone="danger" onClick={() => setConfirm({ id: l.id!, action: "delete" })}>{Icon.trash}</IconButton>
        </>
      )}
    </div>
  );

  const statCards: [StatusFilter, string, number][] = isStaff
    ? [["all", "Total", stats.total], ["active", "Active", stats.active], ["expiring", `Expiring ≤ ${EXPIRING_DAYS}d`, stats.expiring], ["expired", "Expired", stats.expired]]
    : [["all", "All", stats.total], ["active", "Active", stats.active], ["expiring", "Expiring soon", stats.expiring], ["expired", "Expired", stats.expired]];

  return (
    <div className="pr-page lc-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{isStaff ? "Licenses" : "My licenses"}</h1>
          <p className="page-subtitle">
            {loading
              ? "Loading…"
              : isStaff
                ? `${stats.total} license${stats.total !== 1 ? "s" : ""} · ${stats.trial} trial`
                : "Your serial numbers, activations and renewal dates."}
          </p>
        </div>
        {isStaff && (
          <button className="btn-primary" onClick={() => { setEditingLicense(null); setIsFormModalOpen(true); }}>
            <Svg>{Icon.plus}</Svg>New license
          </button>
        )}
      </div>

      {error && (
        <div className="alert-error pr-alert">
          <Svg size={16}>{Icon.alert}</Svg>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn-ghost pr-btn-sm" onClick={fetchLicenses}>Retry</button>
        </div>
      )}

      {/* ---------- Stats (double as status filters) ---------- */}
      {(loading || licenses.length > 0) && (
        <div className="pr-stats">
          {statCards.map(([key, label, value]) => (
            <button
              key={key}
              type="button"
              className={`pr-stat lc-stat-${key} ${status === key ? "is-active" : ""}`}
              onClick={() => setStatus(status === key ? "all" : key)}
              aria-pressed={status === key}
              disabled={loading}
            >
              <span className="pr-stat-label">{label}</span>
              {loading ? <span className="skeleton" style={{ width: 28, height: 22 }} /> : <span className="pr-stat-value">{value}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ---------- Toolbar ---------- */}
      {(loading || licenses.length > 0) && (
        <div className="pr-toolbar">
          <label className="pr-search">
            <Svg size={16}>{Icon.search}</Svg>
            <input
              type="search"
              placeholder={isStaff ? "Search serial, client, email, product…" : "Search serial or product…"}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search licenses"
            />
          </label>
          {isStaff && (
            <select className="form-input pr-select" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} aria-label="Status">
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive / revoked</option>
              <option value="expiring">Expiring soon</option>
              <option value="expired">Expired</option>
            </select>
          )}
          {(isStaff || stats.trial > 0) && (
            <div className="pr-segment" role="group" aria-label="Type">
              {(["all", "paid", "trial"] as const).map((t) => (
                <button key={t} type="button" className={type === t ? "is-active" : ""} onClick={() => setType(t)} aria-pressed={type === t}>
                  {t === "all" ? "All" : t === "paid" ? "Paid" : "Trial"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ---------- Content ---------- */}
      {loading ? (
        isStaff ? (
          <div className="data-table-wrapper">
            <table className="data-table">
              <tbody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {[130, 180, 120, 90, 80, 60, 220].map((w, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, width: w }} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="lc-grid">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 230, borderRadius: "var(--radius-lg)" }} />)}
          </div>
        )
      ) : licenses.length === 0 ? (
        <div className="pr-panel">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{Icon.lock}</svg>
            <p className="empty-state-title">No licenses yet</p>
            <p className="empty-state-sub">{isStaff ? "Create the first license to get started." : "Licenses you buy will appear here with their serial numbers."}</p>
            {isStaff
              ? <button className="btn-primary" style={{ marginTop: "1rem" }} onClick={() => { setEditingLicense(null); setIsFormModalOpen(true); }}>New license</button>
              : <Link href="/products" className="btn-primary" style={{ marginTop: "1rem" }}>Browse software</Link>}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="pr-panel">
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">{Icon.search}</svg>
            <p className="empty-state-title">No matching licenses</p>
            <p className="empty-state-sub">Try a different search or clear the filters.</p>
            <button className="btn-ghost" style={{ marginTop: "1rem" }} onClick={clearFilters}>Clear filters</button>
          </div>
        </div>
      ) : isStaff ? (
        <div className="data-table-wrapper">
          <table className="data-table pr-table lc-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Product</th>
                <th>Serial</th>
                <th>Usage</th>
                <th>Expiry</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className={!l.isActive || isExpired(l, now) ? "is-dim" : ""}>
                  <td>
                    <div className="lc-client">
                      <span className="lc-avatar" aria-hidden="true">{(l.name || l.email || "?").charAt(0).toUpperCase()}</span>
                      <span className="pr-row-text">
                        <span className="pr-row-name">{l.name || "—"}</span>
                        <span className="pr-row-sub">{l.email || "No email"}</span>
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="pr-row-text">
                      <span className="lc-product">{productName(l)}</span>
                      <span className="pr-row-sub">{l.type || "Basic"}{l.version ? ` · v${l.version}` : ""}</span>
                    </span>
                  </td>
                  <td><CopySerial serial={l.serial} /></td>
                  <td className="lc-usage-cell">
                    <Meter used={seatsUsed(l)} total={l.licenseCount ?? 1} label="Seats" />
                  </td>
                  <td className="pr-nowrap"><Expiry license={l} now={now} /></td>
                  <td><StatusBadges license={l} now={now} /></td>
                  <td>{renderStaffActions(l)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="lc-grid">
          {filtered.map((l) => {
            const d = daysLeft(l, now);
            const expired = isExpired(l, now);
            const devices = (l.clients || []).filter((c) => c.isActive !== false);
            return (
              <article key={l.id} className={`lc-card ${expired || !l.isActive ? "is-dim" : ""}`}>
                <header className="lc-card-head">
                  <div className="lc-card-title">
                    <span className="pr-card-meta">{l.type || "Standard"}{l.version ? ` · v${l.version}` : ""}</span>
                    <h3>{productName(l)}</h3>
                  </div>
                  <StatusBadges license={l} now={now} />
                </header>

                <div className="lc-card-serial">
                  <span className="lc-label">Serial number</span>
                  <CopySerial serial={l.serial} full />
                </div>

                <div className="lc-card-facts">
                  <div>
                    <span className="lc-label">Expires</span>
                    <Expiry license={l} now={now} />
                  </div>
                  <Meter used={seatsUsed(l)} total={l.licenseCount ?? 1} label="Activations" />
                </div>

                {devices.length > 0 && (
                  <ul className="lc-devices" aria-label="Activated devices">
                    {devices.slice(0, 3).map((c) => (
                      <li key={c.id}>
                        <Svg size={13}>{Icon.monitor}</Svg>
                        <span className="lc-device-name">{c.deviceName || "Unnamed device"}</span>
                        {c.lastUsedAt && <span className="pr-muted">· {fmtDate(c.lastUsedAt)}</span>}
                      </li>
                    ))}
                    {devices.length > 3 && <li className="pr-muted">+{devices.length - 3} more</li>}
                  </ul>
                )}

                <footer className="lc-card-foot">
                  <button type="button" className="btn-ghost" onClick={() => setDetailsLicense(l)}>
                    <Svg size={14}>{Icon.view}</Svg>Details
                  </button>
                  {l.productId && (expired || (d != null && d <= EXPIRING_DAYS)) && (
                    <Link href={`/products/${l.productId}`} className="btn-primary lc-renew">
                      <Svg size={14}>{Icon.renew}</Svg>{expired ? "Buy again" : "Renew"}
                    </Link>
                  )}
                </footer>
              </article>
            );
          })}
        </div>
      )}

      {!loading && hasFilters && filtered.length > 0 && (
        <p className="pr-result-count">
          Showing {filtered.length} of {licenses.length} · <button type="button" onClick={clearFilters}>Clear filters</button>
        </p>
      )}

      {/* ---------- Modals ---------- */}
      <LicenseDetailsModal isOpen={!!detailsLicense} onClose={() => setDetailsLicense(null)} license={detailsLicense} />

      {isStaff && (
        <>
          <LicenseFormModal
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSuccess={() => { setIsFormModalOpen(false); fetchLicenses(); }}
            products={products}
            users={users}
            initialData={editingLicense}
          />
          <RenewLicenseModal
            isOpen={!!renewLicenseId}
            licenseId={renewLicenseId!}
            onClose={() => setRenewLicenseId(null)}
            onSuccess={() => { setRenewLicenseId(null); fetchLicenses(); }}
          />
          <MigrateHwidModal
            isOpen={!!migrateLicenseId}
            licenseId={migrateLicenseId!}
            onClose={() => setMigrateLicenseId(null)}
            onSuccess={() => { setMigrateLicenseId(null); fetchLicenses(); }}
          />
          <HwidListModal isOpen={!!hwidListLicenseId} licenseId={hwidListLicenseId!} onClose={() => setHwidListLicenseId(null)} />
          <DiagnosticModal isOpen={!!diagnosticLicenseId} licenseId={diagnosticLicenseId!} onClose={() => setDiagnosticLicenseId(null)} />
        </>
      )}
    </div>
  );
}
