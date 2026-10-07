"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getApiLicenses, getIdentityCurrentUser } from "@/client";
import { client } from "@/client/client.gen";
import type { AppUserDto, LicenseDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import StudentUpgradeModal from "@/components/StudentUpgradeModal";
import "./profile.css";

type Tone = "amber" | "purple" | "green" | "blue" | "neutral";

const roleConfig: Record<string, { label: string; tone: Tone; blurb: string }> = {
  SuperAdmin: { label: "Super Admin", tone: "amber", blurb: "Full access to every area of the platform, including roles and permissions." },
  Admin: { label: "Administrator", tone: "purple", blurb: "Manage products, licenses, users and support across the platform." },
  Sales: { label: "Sales", tone: "green", blurb: "Issue and manage customer licenses, offers and promo codes." },
  Editor: { label: "Content Editor", tone: "purple", blurb: "Manage products, hero slides, promo bars and partners on the site." },
  Student: { label: "Student", tone: "blue", blurb: "Verified student account with access to student pricing." },
  NormalUser: { label: "Customer", tone: "neutral", blurb: "Buy licenses, download software and contact support." },
};

const EXPIRING_DAYS = 30;

function summarize(licenses: LicenseDto[]) {
  const soon = Date.now() + EXPIRING_DAYS * 86_400_000;
  const active = licenses.filter((l) => l.isActive !== false && !l.isExpired);
  return {
    total: licenses.length,
    active: active.length,
    expiring: active.filter((l) => l.willExpire && l.expiryDate && new Date(l.expiryDate).getTime() <= soon).length,
  };
}

const Svg = ({ size = 16, children }: { size?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
  mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  key: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />,
  pin: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></>,
  copy: <><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  cap: <><path d="M22 10 12 5 2 10l10 5 10-5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></>,
  license: <><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></>,
  arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard unavailable */ }
  };
  return (
    <button type="button" className={`pf-copy ${copied ? "is-copied" : ""}`} onClick={copy} title={copied ? "Copied" : `Copy ${label}`} aria-label={`Copy ${label}`}>
      <Svg size={14}>{copied ? Icon.check : Icon.copy}</Svg>
    </button>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [details, setDetails] = useState<AppUserDto | null>(null);
  const [licenseStats, setLicenseStats] = useState<ReturnType<typeof summarize> | null>(null);

  const isCustomer = user?.role === "Student" || user?.role === "NormalUser";

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const token = localStorage.getItem("token");
    client.setConfig({
      baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
      ...(token ? { auth: token } : {}),
    });

    getIdentityCurrentUser({ throwOnError: false })
      .then((r) => { if (!cancelled && r.data?.isSuccess) setDetails(r.data.value || null); })
      .catch(() => { /* optional extras only */ });

    if (isCustomer) {
      getApiLicenses({ throwOnError: false })
        .then((r) => { if (!cancelled) setLicenseStats(summarize(r.data?.isSuccess ? r.data.value || [] : [])); })
        .catch(() => { if (!cancelled) setLicenseStats(summarize([])); });
    }
    return () => { cancelled = true; };
  }, [user, isCustomer]);

  if (!user) {
    return (
      <div className="pf-page">
        <div className="skeleton" style={{ height: 28, width: 180, marginBottom: "2rem" }} />
        <div className="skeleton" style={{ height: 128, borderRadius: "var(--radius-lg)", marginBottom: "1.5rem" }} />
        <div className="skeleton" style={{ height: 240, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  const rc = roleConfig[user.role] || roleConfig.NormalUser;
  const handle = user.email.split("@")[0] || user.email;
  const initials = handle.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";

  return (
    <div className="pf-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">My profile</h1>
          <p className="page-subtitle">Your account details and settings.</p>
        </div>
      </div>

      {/* ---------- Identity ---------- */}
      <section className="pf-hero">
        <div className="pf-avatar" aria-hidden="true">{initials}</div>
        <div className="pf-identity">
          <h2 className="pf-name">{handle}</h2>
          <p className="pf-email">{user.email}</p>
          <span className={`pf-role pf-tone-${rc.tone}`}>
            <Svg size={13}>{user.role === "Student" ? Icon.cap : isCustomer ? Icon.user : Icon.shield}</Svg>
            {rc.label}
          </span>
        </div>
        <button type="button" className="pf-signout" onClick={logout}>
          <Svg size={15}>{Icon.logout}</Svg>Sign out
        </button>
      </section>

      <div className="pf-grid">
        {/* ---------- Account details ---------- */}
        <section className="pf-card">
          <h3 className="pf-card-title">Account details</h3>
          <dl className="pf-list">
            <div className="pf-row">
              <dt><Svg>{Icon.mail}</Svg>Email</dt>
              <dd>
                <span className="pf-value">{user.email}</span>
                <CopyButton value={user.email} label="email" />
              </dd>
            </div>
            <div className="pf-row">
              <dt><Svg>{Icon.key}</Svg>Account ID</dt>
              <dd>
                <code className="pf-value pf-mono">{user.id}</code>
                <CopyButton value={user.id} label="account ID" />
              </dd>
            </div>
            <div className="pf-row">
              <dt><Svg>{Icon.phone}</Svg>Phone</dt>
              <dd><span className={`pf-value ${details?.phoneNumber ? "" : "is-empty"}`}>{details?.phoneNumber || "Not provided"}</span></dd>
            </div>
            <div className="pf-row">
              <dt><Svg>{Icon.pin}</Svg>City</dt>
              <dd><span className={`pf-value ${details?.city ? "" : "is-empty"}`}>{details?.city || "Not provided"}</span></dd>
            </div>
          </dl>
        </section>

        <div className="pf-side">
          {/* ---------- Licenses (customers) / role (staff) ---------- */}
          {isCustomer ? (
            <section className="pf-card">
              <div className="pf-card-head">
                <h3 className="pf-card-title">My licenses</h3>
                <Link href="/licenses" className="pf-link">View all <Svg size={14}>{Icon.arrow}</Svg></Link>
              </div>
              <div className="pf-stats">
                {[
                  { label: "Active", value: licenseStats?.active, cls: "is-green" },
                  { label: `Expiring ≤ ${EXPIRING_DAYS}d`, value: licenseStats?.expiring, cls: licenseStats?.expiring ? "is-amber" : "" },
                  { label: "Total", value: licenseStats?.total, cls: "" },
                ].map((s) => (
                  <div key={s.label} className={`pf-stat ${s.cls}`}>
                    {licenseStats ? <span className="pf-stat-value">{s.value}</span> : <span className="skeleton pf-stat-skel" />}
                    <span className="pf-stat-label">{s.label}</span>
                  </div>
                ))}
              </div>
              {licenseStats?.total === 0 && (
                <p className="pf-hint">
                  No licenses yet. <Link href="/products" className="pf-link-inline">Browse the software catalog</Link>
                </p>
              )}
            </section>
          ) : (
            <section className="pf-card">
              <h3 className="pf-card-title">Access level</h3>
              <div className="pf-access">
                <span className={`pf-access-icon pf-tone-${rc.tone}`}><Svg size={20}>{Icon.shield}</Svg></span>
                <div>
                  <p className="pf-access-role">{rc.label}</p>
                  <p className="pf-hint">{rc.blurb}</p>
                </div>
              </div>
            </section>
          )}

          {/* ---------- Student upgrade ---------- */}
          {user.role === "NormalUser" && (
            <section className="pf-card pf-upgrade">
              <span className="pf-upgrade-icon"><Svg size={20}>{Icon.cap}</Svg></span>
              <div className="pf-upgrade-body">
                <h3 className="pf-card-title">Are you a student?</h3>
                <p className="pf-hint">Verify your <strong>.edu</strong> email to unlock student discounts and special license pricing.</p>
                <button type="button" className="btn-primary" onClick={() => setShowUpgradeModal(true)}>
                  Verify student status
                </button>
              </div>
            </section>
          )}
        </div>
      </div>

      {showUpgradeModal && (
        <StudentUpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => { setShowUpgradeModal(false); window.location.reload(); }}
        />
      )}
    </div>
  );
}
