"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiLicensesMy, getIdentityCurrentUser, postIdentityForgotPassword } from "@/client";
import { client } from "@/client/client.gen";
import type { AppUserDto, LicenseDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import StudentUpgradeModal from "@/components/StudentUpgradeModal";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { useToast } from "@/components/ToastProvider";
import LicensesView from "@/components/LicensesView";
import TicketsView from "@/components/TicketsView";
import "./profile.css";

type Tone = "amber" | "purple" | "green" | "blue" | "neutral";

const roleConfig: Record<string, { label: string; tone: Tone; blurb: string }> = {
  SuperAdmin: { label: "Super Admin", tone: "amber", blurb: "Full access to every area of the platform, including roles and permissions." },
  SystemAdmin: { label: "System Admin", tone: "amber", blurb: "Manage the platform's users, roles and system settings." },
  Admin: { label: "Administrator", tone: "purple", blurb: "Manage products, licenses, users and support across the platform." },
  Sales: { label: "Sales", tone: "green", blurb: "Issue and manage customer licenses, offers and promo codes." },
  Editor: { label: "Content Editor", tone: "purple", blurb: "Manage products, hero slides, promo bars and partners on the site." },
  Student: { label: "Student", tone: "blue", blurb: "Verified student account with access to student pricing." },
  NormalUser: { label: "Customer", tone: "neutral", blurb: "Buy licenses, download software and contact support." },
};

const EXPIRING_DAYS = 30;
const LICENSES_SHOWN = 5;

/** Admin roles manage everyone's licenses, so their profile has no "My licenses" section. */
const ADMIN_ROLES = ["SuperAdmin", "SystemAdmin", "Admin"];

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

/** Customers' profile tabs; Licenses and Tickets live here instead of the top navbar. */
const TABS = [
  { key: "overview", label: "Overview" },
  { key: "licenses", label: "My licenses" },
  { key: "tickets", label: "Support tickets" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default function ProfilePage() {
  // useSearchParams (the ?tab= value) needs a Suspense boundary, or the production build fails for this route.
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [details, setDetails] = useState<AppUserDto | null>(null);
  const [licenses, setLicenses] = useState<LicenseDto[] | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const { success, error: toastError } = useToast();

  const isCustomer = user?.role === "Student" || user?.role === "NormalUser";
  const showLicenses = !!user && !ADMIN_ROLES.includes(user.role);
  const licenseStats = licenses ? summarize(licenses) : null;

  const requestedTab = searchParams.get("tab");
  const tab: TabKey = isCustomer && (requestedTab === "licenses" || requestedTab === "tickets") ? requestedTab : "overview";
  const selectTab = (key: TabKey) => router.replace(key === "overview" ? "/profile" : `/profile?tab=${key}`, { scroll: false });

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

    if (showLicenses) {
      // /api/licenses/my is always the caller's own licenses, whatever their role.
      getApiLicensesMy({ throwOnError: false })
        .then((r) => { if (!cancelled) setLicenses(r.data?.isSuccess ? r.data.value || [] : []); })
        .catch(() => { if (!cancelled) setLicenses([]); });
    }
    return () => { cancelled = true; };
  }, [user, showLicenses]);

  // Emails a reset link to the signed-in user's own address (same flow as "Forgot password?" on the login page).
  const handleSendResetLink = async () => {
    if (!user?.email) return;
    setSendingReset(true);
    try {
      const res = await postIdentityForgotPassword({ body: { email: user.email }, throwOnError: false });
      if (res.error || res.data?.isError) {
        toastError(res.data?.errors?.map((e) => e.description).filter(Boolean).join(", ") || "Couldn't send the reset link.");
        return;
      }
      success(`Reset link sent to ${user.email}. It expires in 1 hour.`);
    } catch (err) {
      toastError((err instanceof Error && err.message) || "Couldn't send the reset link.");
    } finally {
      setSendingReset(false);
    }
  };

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
        <div className="pf-avatar" aria-hidden="true" title={`Account initials: ${initials}`}>{initials}</div>
        <div className="pf-identity">
          <h2 className="pf-name">{handle}</h2>
          <p className="pf-email" title={`Email: ${user.email}`}>{user.email}</p>
          <span className={`pf-role pf-tone-${rc.tone}`} title={rc.blurb}>
            <Svg size={13}>{user.role === "Student" ? Icon.cap : isCustomer ? Icon.user : Icon.shield}</Svg>
            {rc.label}
          </span>
        </div>
        <button type="button" className="pf-signout" onClick={logout} title="Sign out of your account">
          <Svg size={15}>{Icon.logout}</Svg>Sign out
        </button>
      </section>

      {isCustomer && (
        <div role="tablist" aria-label="Profile sections" style={{ display: "flex", gap: "0.25rem", borderBottom: "1px solid var(--border)", margin: "0 0 1.5rem", overflowX: "auto" }}>
          {TABS.map((t) => {
            const selected = t.key === tab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => selectTab(t.key)}
                style={{
                  padding: "0.7rem 1rem", border: "none", background: "transparent", cursor: "pointer", whiteSpace: "nowrap",
                  font: "inherit", fontSize: "0.9rem", fontWeight: 600, marginBottom: "-1px",
                  color: selected ? "var(--accent)" : "var(--text-secondary)",
                  borderBottom: `2px solid ${selected ? "var(--accent)" : "transparent"}`,
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      {tab === "licenses" && <LicensesView embedded />}
      {tab === "tickets" && <TicketsView embedded />}

      {tab === "overview" && (
      <div className="pf-grid">
        {/* ---------- Account details ---------- */}
        <section className="pf-card">
          <div className="pf-card-head">
            <h3 className="pf-card-title">Account details</h3>
            <span className="pf-hint" style={{ margin: 0, fontSize: "0.78rem" }}>
              <Svg size={12}>{Icon.shield}</Svg> Secure & verified
            </span>
          </div>
          <dl className="pf-list">
            <div className="pf-row">
              <dt title="Your email address for account recovery and notifications"><Svg>{Icon.mail}</Svg>Email</dt>
              <dd>
                <span className="pf-value">{user.email}</span>
                <CopyButton value={user.email} label="email" />
              </dd>
            </div>
            <div className="pf-row">
              <dt title="Unique identifier for your account"><Svg>{Icon.key}</Svg>Account ID</dt>
              <dd>
                <code className="pf-value pf-mono">{user.id}</code>
                <CopyButton value={user.id} label="account ID" />
              </dd>
            </div>
            <div className="pf-row">
              <dt title="Phone number for contact"><Svg>{Icon.phone}</Svg>Phone</dt>
              <dd>
                <span className={`pf-value ${details?.phoneNumber ? "" : "is-empty"}`}>{details?.phoneNumber || "Not provided"}</span>
              </dd>
            </div>
            <div className="pf-row">
              <dt title="Your location"><Svg>{Icon.pin}</Svg>City</dt>
              <dd>
                <span className={`pf-value ${details?.city ? "" : "is-empty"}`}>{details?.city || "Not provided"}</span>
              </dd>
            </div>
          </dl>
        </section>

        <div className="pf-side">
          {/* ---------- My licenses (every role except admins) ---------- */}
          {showLicenses && (
            <section className="pf-card">
              <div className="pf-card-head">
                <h3 className="pf-card-title" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0 }}>
                  <Svg size={16}>{Icon.license}</Svg>
                  My licenses
                </h3>
                {isCustomer ? (
                  <button type="button" className="pf-link" onClick={() => selectTab("licenses")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }} title="View all your licenses">View all <Svg size={14}>{Icon.arrow}</Svg></button>
                ) : (
                  <Link href="/licenses" className="pf-link" title="View all licenses">View all <Svg size={14}>{Icon.arrow}</Svg></Link>
                )}
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
              {licenses && licenses.length > 0 && (
                <ul style={{ listStyle: "none", margin: "1rem 0 0", padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {licenses.slice(0, LICENSES_SHOWN).map((l) => {
                    const expired = l.isExpired || l.isActive === false;
                    return (
                      <li key={l.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", padding: "0.6rem 0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-elevated)" }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            <Svg size={13}>{Icon.license}</Svg> {l.productName || "License"}
                          </div>
                          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)" }}>
                            {!l.willExpire || !l.expiryDate ? "Never expires" : `${expired ? "Expired" : "Expires"} ${new Date(l.expiryDate).toLocaleDateString()}`}
                          </div>
                        </div>
                        <span className={`badge ${expired ? "badge-danger" : "badge-success"}`}>{expired ? (l.isActive === false ? "Inactive" : "Expired") : "Active"}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {licenses && licenses.length > LICENSES_SHOWN && (
                <p className="pf-hint" style={{ marginTop: "0.6rem" }}>
                  +{licenses.length - LICENSES_SHOWN} more — <Link href={isCustomer ? "/profile?tab=licenses" : "/licenses"} className="pf-link-inline">see all</Link>
                </p>
              )}
              {licenseStats?.total === 0 && (
                <p className="pf-hint">
                  No licenses yet. <Link href="/products" className="pf-link-inline">Browse the software catalog</Link>
                </p>
              )}
            </section>
          )}

          {/* ---------- Access level (staff) ---------- */}
          {!isCustomer && (
            <section className="pf-card">
              <h3 className="pf-card-title" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0 }}>
                <Svg size={16}>{Icon.shield}</Svg>
                Access level
              </h3>
              <div className="pf-access" style={{ marginTop: "1rem" }}>
                <span className={`pf-access-icon pf-tone-${rc.tone}`} title={`Role: ${rc.label}`}><Svg size={20}>{Icon.shield}</Svg></span>
                <div>
                  <p className="pf-access-role" style={{ margin: "0 0 0.2rem" }}>{rc.label}</p>
                  <p className="pf-hint" style={{ margin: 0 }}>{rc.blurb}</p>
                </div>
              </div>
            </section>
          )}

          {/* ---------- Password ---------- */}
          <section className="pf-card">
            <div className="pf-card-head">
              <h3 className="pf-card-title" style={{ display: "flex", alignItems: "center", gap: "0.35rem", margin: 0 }}>
                <Svg size={16}>{Icon.key}</Svg>
                Password
              </h3>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowPasswordModal(true)}
                disabled={!details}
                title={details?.hasPassword === false ? "Set a new password" : "Update your password"}
              >
                <Svg size={14}>{Icon.key}</Svg> {details?.hasPassword === false ? "Set password" : "Change password"}
              </button>
            </div>
            <p className="pf-hint">
              {details?.hasPassword === false
                ? "You sign in with Google. Set a password to also sign in with your email and enable 2-factor authentication."
                : "Use a password you don't use anywhere else. Keep it secure and unique."}
            </p>
            <p className="pf-hint" style={{ marginTop: "0.6rem" }}>
              Forgot your password?{" "}
              <button
                type="button"
                onClick={handleSendResetLink}
                disabled={sendingReset}
                title="Receive a password reset email"
                style={{ background: "none", border: "none", padding: 0, font: "inherit", fontWeight: 600, color: "var(--accent)", cursor: sendingReset ? "wait" : "pointer" }}
              >
                {sendingReset ? "Sending…" : "Email me a reset link"}
              </button>
            </p>
          </section>

          {/* ---------- Student upgrade ---------- */}
          {user.role === "NormalUser" && (
            <section className="pf-card pf-upgrade">
              <span className="pf-upgrade-icon" title="Student status"><Svg size={20}>{Icon.cap}</Svg></span>
              <div className="pf-upgrade-body">
                <h3 className="pf-card-title" style={{ margin: "0.2rem 0 0" }}>Are you a student?</h3>
                <p className="pf-hint">Verify your <strong>.edu</strong> email to unlock student discounts and enjoy special pricing on all licenses and products.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setShowUpgradeModal(true)}
                  title="Start student verification process"
                >
                  Verify student status
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
      )}

      {showPasswordModal && details && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onSuccess={() => setDetails({ ...details, hasPassword: true })}
        />
      )}

      {showUpgradeModal && (
        <StudentUpgradeModal
          onClose={() => setShowUpgradeModal(false)}
          onSuccess={() => { setShowUpgradeModal(false); window.location.reload(); }}
        />
      )}
    </div>
  );
}
