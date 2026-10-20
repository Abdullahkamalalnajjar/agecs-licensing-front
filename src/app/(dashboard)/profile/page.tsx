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
import ProfileEmailsCard from "@/components/ProfileEmailsCard";
import { useToast } from "@/components/ToastProvider";
import LicensesView from "@/components/LicensesView";
import TicketsView from "@/components/TicketsView";
import "./profile.css";

type Tone = "amber" | "purple" | "green" | "blue" | "neutral";

const roleConfig: Record<string, { label: string; tone: Tone; blurb: string }> = {
  Admin: { label: "Administrator", tone: "purple", blurb: "Manage products, licenses, users and support across the platform." },
  Sales: { label: "Sales", tone: "green", blurb: "Issue and manage customer licenses, offers and promo codes." },
  Editor: { label: "Content Editor", tone: "purple", blurb: "Manage products, hero slides, promo bars and partners on the site." },
  Student: { label: "Student", tone: "blue", blurb: "Verified student account with access to student pricing." },
  User: { label: "Customer", tone: "neutral", blurb: "Buy licenses, download software and contact support." },
};

const EXPIRING_DAYS = 30;
const LICENSES_SHOWN = 5;
const DAY_MS = 86_400_000;

/** Admin roles manage everyone's licenses, so their profile has no "My licenses" section. */
const ADMIN_ROLES = ["Admin"];

function summarize(licenses: LicenseDto[]) {
  const soon = Date.now() + EXPIRING_DAYS * DAY_MS;
  const active = licenses.filter((l) => l.isActive !== false && !l.isExpired);
  return {
    total: licenses.length,
    active: active.length,
    expiring: active.filter((l) => l.willExpire && l.expiryDate && new Date(l.expiryDate).getTime() <= soon).length,
  };
}

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

/** Status, caption and remaining-time bar (0–100, or null when the license never expires) for one license row. */
function describeLicense(l: LicenseDto) {
  if (l.isActive === false) return { status: "inactive" as const, caption: "Deactivated", pct: null };
  if (!l.willExpire || !l.expiryDate) return { status: "active" as const, caption: "Lifetime license", pct: null };

  const end = new Date(l.expiryDate).getTime();
  const daysLeft = Math.ceil((end - Date.now()) / DAY_MS);
  if (l.isExpired || daysLeft <= 0) return { status: "expired" as const, caption: `Expired ${fmtDate(l.expiryDate)}`, pct: 0 };

  const start = l.createdAtUtc ? new Date(l.createdAtUtc).getTime() : NaN;
  const pct = start < end ? Math.max(3, Math.min(100, ((end - Date.now()) / (end - start)) * 100)) : null;
  return {
    status: daysLeft <= EXPIRING_DAYS ? ("expiring" as const) : ("active" as const),
    caption: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left · ${fmtDate(l.expiryDate)}`,
    pct,
  };
}

const STATUS_LABEL = { active: "Active", expiring: "Expiring", expired: "Expired", inactive: "Inactive" };

const Svg = ({ size = 16, children }: { size?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
  mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></>,
  key: <><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  hash: <><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></>,
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
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  bag: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
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
  const [isAcademic, setIsAcademic] = useState(false);
  const [details, setDetails] = useState<AppUserDto | null>(null);
  const [licenses, setLicenses] = useState<LicenseDto[] | null>(null);
  const [sendingReset, setSendingReset] = useState(false);
  const { success, error: toastError } = useToast();

  const isCustomer = user?.role === "Student" || user?.role === "User";
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
        <div className="skeleton" style={{ height: 260, borderRadius: "var(--radius-lg)", marginBottom: "1.5rem" }} />
        <div className="skeleton" style={{ height: 280, borderRadius: "var(--radius-lg)" }} />
      </div>
    );
  }

  const rc = roleConfig[user.role] || roleConfig.User;
  const handle = details?.userName && !details.userName.includes("@") ? details.userName : user.email.split("@")[0] || user.email;
  const initials = handle.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "?";
  const viewAllLicenses = isCustomer ? "/profile?tab=licenses" : "/licenses";

  const stats = [
    { label: "Active licenses", value: licenseStats?.active, tone: "green" },
    { label: `Expiring in ${EXPIRING_DAYS} days`, value: licenseStats?.expiring, tone: licenseStats?.expiring ? "amber" : "" },
    { label: "Total licenses", value: licenseStats?.total, tone: "" },
  ];

  return (
    <div className="pf-page">
      {/* ---------- Header: cover, identity, stats, tabs ---------- */}
      <section className="pf-hero">
        <div className="pf-cover" aria-hidden="true" />

        <div className="pf-hero-main">
          <div className="pf-avatar" aria-hidden="true">{initials}</div>

          <div className="pf-identity">
            <div className="pf-name-row">
              <h1 className="pf-name">{handle}</h1>
              <span className={`pf-role pf-tone-${rc.tone}`}>
                <Svg size={12}>{user.role === "Student" ? Icon.cap : isCustomer ? Icon.user : Icon.shield}</Svg>
                {rc.label}
              </span>
              {(isAcademic || details?.isAcademic) && (
                <span className="pf-role pf-tone-green" title="Verified university email">
                  <Svg size={12}>{Icon.cap}</Svg>Academic
                </span>
              )}
            </div>
            <p className="pf-email">{user.email}</p>
          </div>

          <button type="button" className="pf-signout" onClick={logout}>
            <Svg size={15}>{Icon.logout}</Svg>Sign out
          </button>
        </div>

        {showLicenses && (
          <dl className="pf-stats">
            {stats.map((s) => (
              <div key={s.label} className={`pf-stat ${s.tone ? `is-${s.tone}` : ""}`}>
                <dd>{licenseStats ? s.value : <span className="skeleton pf-stat-skel" />}</dd>
                <dt>{s.label}</dt>
              </div>
            ))}
          </dl>
        )}

        {isCustomer && (
          <div role="tablist" aria-label="Profile sections" className="pf-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={t.key === tab}
                className="pf-tab"
                onClick={() => selectTab(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {tab === "licenses" && <LicensesView embedded />}
      {tab === "tickets" && <TicketsView embedded />}

      {tab === "overview" && (
        <div className="pf-grid">
          <div className="pf-col">
            {/* ---------- Personal information ---------- */}
            <section className="pf-card">
              <header className="pf-card-head">
                <span className="pf-card-icon"><Svg size={17}>{Icon.user}</Svg></span>
                <div>
                  <h2 className="pf-card-title">Personal information</h2>
                  <p className="pf-card-sub">The details linked to your account.</p>
                </div>
              </header>
              <dl className="pf-list">
                <div className="pf-row">
                  <dt><Svg size={15}>{Icon.mail}</Svg>Email</dt>
                  <dd>
                    <span className="pf-value">{user.email}</span>
                    <CopyButton value={user.email} label="email" />
                  </dd>
                </div>
                <div className="pf-row">
                  <dt><Svg size={15}>{Icon.hash}</Svg>Account ID</dt>
                  <dd>
                    <code className="pf-value pf-mono">{user.id}</code>
                    <CopyButton value={user.id} label="account ID" />
                  </dd>
                </div>
                <div className="pf-row">
                  <dt><Svg size={15}>{Icon.phone}</Svg>Phone</dt>
                  <dd><span className={`pf-value ${details?.phoneNumber ? "" : "is-empty"}`}>{details?.phoneNumber || "Not provided"}</span></dd>
                </div>
                <div className="pf-row">
                  <dt><Svg size={15}>{Icon.pin}</Svg>City</dt>
                  <dd><span className={`pf-value ${details?.city ? "" : "is-empty"}`}>{details?.city || "Not provided"}</span></dd>
                </div>
              </dl>
            </section>

            {/* ---------- Security ---------- */}
            <section className="pf-card">
              <header className="pf-card-head">
                <span className="pf-card-icon"><Svg size={17}>{Icon.lock}</Svg></span>
                <div>
                  <h2 className="pf-card-title">Sign-in &amp; security</h2>
                  <p className="pf-card-sub">Manage how you sign in to your account.</p>
                </div>
              </header>

              <div className="pf-setting">
                <div className="pf-setting-text">
                  <p className="pf-setting-title">
                    Password
                    {details && (
                      <span className={`pf-chip ${details.hasPassword === false ? "is-muted" : "is-green"}`}>
                        {details.hasPassword === false ? "Not set" : "Set"}
                      </span>
                    )}
                  </p>
                  <p className="pf-hint">
                    {details?.hasPassword === false
                      ? "You sign in with Google. Set a password to also sign in with your email."
                      : "Use a strong password you don't use anywhere else."}
                  </p>
                </div>
                <button type="button" className="btn-ghost" onClick={() => setShowPasswordModal(true)} disabled={!details}>
                  <Svg size={14}>{Icon.key}</Svg> {details?.hasPassword === false ? "Set password" : "Change"}
                </button>
              </div>

              <div className="pf-setting">
                <div className="pf-setting-text">
                  <p className="pf-setting-title">Forgot your password?</p>
                  <p className="pf-hint">We&apos;ll email a reset link to {user.email}.</p>
                </div>
                <button type="button" className="btn-ghost" onClick={handleSendResetLink} disabled={sendingReset}>
                  <Svg size={14}>{Icon.send}</Svg> {sendingReset ? "Sending…" : "Send link"}
                </button>
              </div>
            </section>
          </div>

          <div className="pf-col">
            {/* ---------- My licenses (every role except admins) ---------- */}
            {showLicenses && (
              <section className="pf-card">
                <header className="pf-card-head">
                  <span className="pf-card-icon"><Svg size={17}>{Icon.license}</Svg></span>
                  <div>
                    <h2 className="pf-card-title">My licenses</h2>
                    <p className="pf-card-sub">Your most recent software licenses.</p>
                  </div>
                  {licenses && licenses.length > 0 && (
                    isCustomer ? (
                      <button type="button" className="pf-link" onClick={() => selectTab("licenses")}>View all <Svg size={14}>{Icon.arrow}</Svg></button>
                    ) : (
                      <Link href="/licenses" className="pf-link">View all <Svg size={14}>{Icon.arrow}</Svg></Link>
                    )
                  )}
                </header>

                {!licenses && (
                  <div className="pf-lic-list">
                    {[0, 1].map((i) => <div key={i} className="skeleton" style={{ height: 64, borderRadius: "var(--radius-md)" }} />)}
                  </div>
                )}

                {licenses && licenses.length > 0 && (
                  <ul className="pf-lic-list">
                    {licenses.slice(0, LICENSES_SHOWN).map((l) => {
                      const d = describeLicense(l);
                      return (
                        <li key={l.id} className={`pf-lic is-${d.status}`}>
                          <span className="pf-lic-icon" aria-hidden="true">{(l.productName || "L").charAt(0).toUpperCase()}</span>
                          <div className="pf-lic-body">
                            <div className="pf-lic-top">
                              <span className="pf-lic-name">{l.productName || "License"}</span>
                              <span className="pf-lic-status">{STATUS_LABEL[d.status]}</span>
                            </div>
                            <span className="pf-lic-caption">{d.caption}{l.isTrial ? " · Trial" : ""}</span>
                            {d.pct !== null && (
                              <span className="pf-lic-bar" aria-hidden="true"><span style={{ width: `${d.pct}%` }} /></span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {licenses && licenses.length > LICENSES_SHOWN && (
                  <p className="pf-hint pf-more">
                    +{licenses.length - LICENSES_SHOWN} more — <Link href={viewAllLicenses} className="pf-link-inline">see all</Link>
                  </p>
                )}

                {licenses?.length === 0 && (
                  <div className="pf-empty">
                    <span className="pf-empty-icon"><Svg size={22}>{Icon.bag}</Svg></span>
                    <p className="pf-setting-title">No licenses yet</p>
                    <p className="pf-hint">Licenses you buy will show up here.</p>
                    <Link href="/products" className="btn-primary">Browse software</Link>
                  </div>
                )}
              </section>
            )}

            {/* ---------- Access level (staff) ---------- */}
            {!isCustomer && (
              <section className="pf-card">
                <header className="pf-card-head">
                  <span className={`pf-card-icon pf-tone-${rc.tone}`}><Svg size={17}>{Icon.shield}</Svg></span>
                  <div>
                    <h2 className="pf-card-title">Access level</h2>
                    <p className="pf-card-sub">What your role can do on the platform.</p>
                  </div>
                </header>
                <div className={`pf-access pf-tone-${rc.tone}`}>
                  <p className="pf-access-role">{rc.label}</p>
                  <p className="pf-hint">{rc.blurb}</p>
                </div>
              </section>
            )}

            {/* ---------- Extra emails & academic badge (verified by code) ---------- */}
            <ProfileEmailsCard onAcademicChange={setIsAcademic} />
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
