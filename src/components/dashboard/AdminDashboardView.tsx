"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getChart } from "@/client";
import type { AuthUser } from "@/components/AuthProvider";
import type { DashboardStatsDto, DashboardChartDto } from "@/client/types.gen";
import "./admin-dashboard.css";

interface AdminDashboardViewProps {
  user: AuthUser | null;
  stats: DashboardStatsDto | null;
}

type Period = { year: number; month: number; isCurrent: boolean };

const numFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });
const moneyFmt = new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactFmt = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
const money = (n: number) => `$${moneyFmt.format(n)}`;

const shiftMonth = (p: Period, delta: number, today: Period): Period => {
  const d = new Date(p.year, p.month - 1 + delta, 1);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  return { year, month, isCurrent: year === today.year && month === today.month };
};

const monthLabel = (p: Period, style: "long" | "short" = "long") =>
  new Date(p.year, p.month - 1, 1).toLocaleDateString(undefined, { month: style, year: "numeric" });

async function fetchMonth(p: Period) {
  const res = await getChart({ query: { year: p.year, month: p.month }, throwOnError: false });
  if (res.error) throw new Error("chart");
  return res.data?.value ?? null;
}

const Svg = ({ size = 16, children }: { size?: number; children: React.ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const Icon = {
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  box: <><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></>,
  key: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  coins: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  gift: <><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></>,
  left: <polyline points="15 18 9 12 15 6" />,
  right: <polyline points="9 18 15 12 9 6" />,
  arrow: <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>,
  up: <><polyline points="18 15 12 9 6 15" /></>,
  down: <><polyline points="6 9 12 15 18 9" /></>,
  alert: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
};

function Kpi({ label, value, sub, href, linkText, icon }: {
  label: string; value: React.ReactNode; sub: string; href?: string; linkText?: string; icon: React.ReactNode;
}) {
  return (
    <div className="ad-kpi">
      <div className="ad-kpi-head">
        <span className="ad-kpi-label">{label}</span>
        <span className="ad-kpi-icon"><Svg size={16}>{icon}</Svg></span>
      </div>
      <div className="ad-kpi-value">{value}</div>
      <div className="ad-kpi-foot">
        <span>{sub}</span>
        {href && <Link href={href} className="ad-link">{linkText} <Svg size={13}>{Icon.arrow}</Svg></Link>}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label, period }: any) {
  if (!active || !payload?.length) return null;
  const date = new Date(period.year, period.month - 1, label);
  return (
    <div className="ad-tooltip">
      <div className="ad-tooltip-label">{date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</div>
      <div className="ad-tooltip-row">
        <span className="ad-tooltip-swatch" />
        <span>Revenue</span>
        <strong>{money(payload[0].value ?? 0)}</strong>
      </div>
    </div>
  );
}

export default function AdminDashboardView({ user, stats }: AdminDashboardViewProps) {
  const router = useRouter();
  const [today] = useState<Period>(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, isCurrent: true };
  });
  const [todayDay] = useState(() => new Date().getDate());
  const [period, setPeriod] = useState<Period>(today);
  const [chart, setChart] = useState<{ key: string; current: DashboardChartDto | null; previous: DashboardChartDto | null } | null>(null);
  const [chartError, setChartError] = useState(false);
  const [view, setView] = useState<"chart" | "table">("chart");

  const periodKey = `${period.year}-${period.month}`;
  const chartLoading = chart?.key !== periodKey && !chartError;

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchMonth(period), fetchMonth(shiftMonth(period, -1, today))])
      .then(([current, previous]) => { if (!cancelled) { setChart({ key: periodKey, current, previous }); setChartError(false); } })
      .catch(() => { if (!cancelled) setChartError(true); });
    return () => { cancelled = true; };
  }, [period, periodKey, today]);

  const goTo = (delta: number) => { setChartError(false); setPeriod((p) => shiftMonth(p, delta, today)); };

  // One bar per calendar day, so quiet days read as zero rather than disappearing
  const byDay = new Map((chart?.current?.dailyRevenues || []).map((d) => [d.day, d.totalRevenue ?? 0]));
  const days = Array.from({ length: new Date(period.year, period.month, 0).getDate() }, (_, i) => ({
    day: i + 1,
    revenue: byDay.get(i + 1) ?? 0,
  }));

  const monthTotal = chart?.current?.totalMonthlyRevenue ?? days.reduce((s, d) => s + d.revenue, 0);
  const prevTotal = chart?.previous?.totalMonthlyRevenue ?? (chart?.previous?.dailyRevenues || []).reduce((s, d) => s + (d.totalRevenue ?? 0), 0);
  const delta = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : null;
  const salesDays = days.filter((d) => d.revenue > 0);
  const bestDay = salesDays.reduce<{ day: number; revenue: number } | null>((best, d) => (!best || d.revenue > best.revenue ? d : best), null);
  const elapsed = period.isCurrent ? todayDay : days.length;

  const pending = stats?.pendingTickets ?? 0;
  const totalTickets = stats?.totalTickets ?? 0;
  const resolvedPct = totalTickets > 0 ? Math.round(((totalTickets - pending) / totalTickets) * 100) : 100;
  const name = user?.email?.split("@")[0] || "there";

  return (
    <div className="ad-page">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Overview</h1>
          <p className="page-subtitle">Welcome back, {name}. Here&apos;s how the business is doing.</p>
        </div>
        <div className="ad-header-actions">
          <button type="button" className="ad-btn" onClick={() => router.push("/products")}>
            <Svg size={15}>{Icon.box}</Svg>Products
          </button>
          <button type="button" className="btn-primary" onClick={() => router.push("/licenses")}>
            <Svg size={15}>{Icon.plus}</Svg>New license
          </button>
        </div>
      </div>

      {/* ---------- KPIs ---------- */}
      <section className="ad-kpis" aria-label="Key metrics">
        <Kpi label="Total revenue" icon={Icon.coins} value={money(stats?.totalRevenue ?? 0)} sub="All time" />
        <Kpi label="Active licenses" icon={Icon.key} value={numFmt.format(stats?.totalActiveLicenses ?? 0)} sub="Currently valid" href="/licenses" linkText="View" />
        <Kpi label="Products" icon={Icon.box} value={numFmt.format(stats?.totalProducts ?? 0)} sub="In catalog" href="/products" linkText="View" />
        <Kpi
          label="Open tickets"
          icon={Icon.chat}
          value={<>{numFmt.format(pending)}<span className="ad-kpi-of">/ {numFmt.format(totalTickets)}</span></>}
          sub={pending > 0 ? "Awaiting reply" : "All caught up"}
          href="/tickets"
          linkText="Open"
        />
      </section>

      <div className="ad-grid">
        {/* ---------- Revenue ---------- */}
        <section className="ad-card ad-revenue" aria-labelledby="ad-revenue-title">
          <header className="ad-card-head">
            <div>
              <h2 id="ad-revenue-title" className="ad-card-title">Revenue</h2>
              <p className="ad-card-sub">Daily sales for {monthLabel(period)}</p>
            </div>
            <div className="ad-card-tools">
              <div className="ad-month" role="group" aria-label="Month">
                <button type="button" onClick={() => goTo(-1)} aria-label="Previous month"><Svg size={15}>{Icon.left}</Svg></button>
                <span>{monthLabel(period, "short")}</span>
                <button type="button" onClick={() => goTo(1)} disabled={period.isCurrent} aria-label="Next month"><Svg size={15}>{Icon.right}</Svg></button>
              </div>
              <div className="ad-seg" role="group" aria-label="View">
                <button type="button" className={view === "chart" ? "is-active" : ""} onClick={() => setView("chart")} aria-pressed={view === "chart"}>Chart</button>
                <button type="button" className={view === "table" ? "is-active" : ""} onClick={() => setView("table")} aria-pressed={view === "table"}>Table</button>
              </div>
            </div>
          </header>

          <div className="ad-revenue-summary">
            <div>
              <span className="ad-summary-label">{period.isCurrent ? "Month to date" : "Month total"}</span>
              {chartLoading ? <span className="skeleton" style={{ display: "block", width: 140, height: 30 }} /> : (
                <span className="ad-summary-value">{money(monthTotal)}</span>
              )}
            </div>
            {!chartLoading && !chartError && (
              <>
                <div>
                  <span className="ad-summary-label">vs {monthLabel(shiftMonth(period, -1, today), "short")}</span>
                  {delta == null ? (
                    <span className="ad-summary-small">{prevTotal === 0 && monthTotal > 0 ? "New revenue" : "—"}</span>
                  ) : (
                    <span className={`ad-delta ${delta >= 0 ? "is-up" : "is-down"}`}>
                      <Svg size={13}>{delta >= 0 ? Icon.up : Icon.down}</Svg>
                      {Math.abs(delta).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div>
                  <span className="ad-summary-label">Best day</span>
                  <span className="ad-summary-small">{bestDay ? `${money(bestDay.revenue)} · ${bestDay.day} ${new Date(period.year, period.month - 1, 1).toLocaleDateString(undefined, { month: "short" })}` : "—"}</span>
                </div>
                <div>
                  <span className="ad-summary-label">Days with sales</span>
                  <span className="ad-summary-small">{salesDays.length} / {elapsed}</span>
                </div>
              </>
            )}
          </div>

          <div className="ad-chart">
            {chartError ? (
              <div className="ad-chart-empty">
                <Svg size={20}>{Icon.alert}</Svg>
                <span>Couldn&apos;t load revenue for this month.</span>
                <button type="button" className="btn-ghost" onClick={() => goTo(0)}>Retry</button>
              </div>
            ) : chartLoading ? (
              <div className="skeleton" style={{ height: "100%", borderRadius: "var(--radius-md)" }} />
            ) : salesDays.length === 0 ? (
              <div className="ad-chart-empty">
                <Svg size={20}>{Icon.coins}</Svg>
                <span>No sales recorded in {monthLabel(period)}.</span>
              </div>
            ) : view === "chart" ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={days} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barCategoryGap={2}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="0" vertical={false} />
                  <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={{ stroke: "var(--border-strong)" }}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    interval="preserveStartEnd"
                    minTickGap={12}
                    tickMargin={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "var(--text-muted)", fontSize: 11 }}
                    tickFormatter={(v: number) => compactFmt.format(v)}
                    width={44}
                  />
                  <Tooltip cursor={{ fill: "var(--accent-dim)" }} content={<ChartTooltip period={period} />} />
                  <Bar dataKey="revenue" name="Revenue" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="ad-table-wrap">
                <table className="ad-table">
                  <thead><tr><th>Date</th><th style={{ textAlign: "right" }}>Revenue</th></tr></thead>
                  <tbody>
                    {salesDays.map((d) => (
                      <tr key={d.day}>
                        <td>{new Date(period.year, period.month - 1, d.day).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</td>
                        <td style={{ textAlign: "right" }}>{money(d.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr><td>Total</td><td style={{ textAlign: "right" }}>{money(monthTotal)}</td></tr></tfoot>
                </table>
              </div>
            )}
          </div>
        </section>

        <div className="ad-side">
          {/* ---------- Support ---------- */}
          <section className="ad-card">
            <header className="ad-card-head">
              <div>
                <h2 className="ad-card-title">Support queue</h2>
                <p className="ad-card-sub">{totalTickets} tickets in total</p>
              </div>
            </header>
            <div className="ad-queue">
              <div className="ad-queue-row">
                <span className={`ad-status ${pending > 0 ? "is-warn" : "is-ok"}`}>
                  <Svg size={13}>{pending > 0 ? Icon.alert : Icon.up}</Svg>
                  {pending > 0 ? `${pending} awaiting reply` : "No open tickets"}
                </span>
                <span className="ad-queue-pct">{resolvedPct}% resolved</span>
              </div>
              <div className="ad-progress" role="progressbar" aria-valuenow={resolvedPct} aria-valuemin={0} aria-valuemax={100} aria-label="Tickets resolved">
                <div style={{ width: `${resolvedPct}%` }} />
              </div>
              <Link href="/tickets" className="ad-btn ad-btn-block">Go to tickets <Svg size={14}>{Icon.arrow}</Svg></Link>
            </div>
          </section>

          {/* ---------- Shortcuts ---------- */}
          <section className="ad-card">
            <header className="ad-card-head">
              <h2 className="ad-card-title">Manage</h2>
            </header>
            <nav className="ad-shortcuts" aria-label="Management shortcuts">
              {[
                { href: "/licenses", label: "Licenses", sub: "Issue, renew and revoke", icon: Icon.key },
                { href: "/products", label: "Products", sub: "Catalog, pricing and versions", icon: Icon.box },
                { href: "/offers", label: "Offers", sub: "Time-limited deals", icon: Icon.gift },
                { href: "/promocodes", label: "Promo codes", sub: "Discount codes", icon: Icon.tag },
                { href: "/users", label: "Users", sub: "Accounts, roles and access", icon: Icon.users },
              ].map((s) => (
                <Link key={s.href} href={s.href} className="ad-shortcut">
                  <span className="ad-shortcut-icon"><Svg size={16}>{s.icon}</Svg></span>
                  <span className="ad-shortcut-text">
                    <span className="ad-shortcut-label">{s.label}</span>
                    <span className="ad-shortcut-sub">{s.sub}</span>
                  </span>
                  <Svg size={14}>{Icon.right}</Svg>
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
}
