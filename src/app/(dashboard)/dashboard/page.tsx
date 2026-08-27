"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/client";
import { client } from "@/client/client.gen";
import { DashboardStatsDto } from "@/client/types.gen";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
      if (user.role === "Student" || user.role === "NormalUser") {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (token) {
          client.setConfig({
            baseUrl: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004"),
            auth: token,
          });
        }
        
        const { data, error } = await getStats();
        if (error) throw new Error("Failed to load dashboard stats.");
        if (data?.value) setStats(data.value);
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (user?.role === "Student" || user?.role === "NormalUser") {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
        <div style={{
          width: "80px", height: "80px", margin: "0 auto 1.5rem",
          background: "linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.2))",
          borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid rgba(124,58,237,0.3)"
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-light)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1rem', letterSpacing: "-0.02em" }}>User Dashboard</h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Coming Soon!</p>
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--bg-elevated)', borderRadius: '16px', border: '1px solid var(--border)', maxWidth: '450px' }}>
          <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>We are working hard to bring you a personalized dashboard where you can easily track your software licenses, support tickets, and latest products.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-error" style={{ margin: '2rem' }}>
        <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your licensing system statistics.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }} className="stats-grid">
        
        {/* Total Products */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-dim)', color: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Products</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stats?.totalProducts ?? 0}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <Link href="/products" style={{ fontSize: '0.85rem', color: 'var(--accent-light)', fontWeight: 500 }}>
              View all products &rarr;
            </Link>
          </div>
        </div>

        {/* Active Licenses */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--success-dim)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Active Licenses</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{stats?.totalActiveLicenses ?? 0}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <Link href="/licenses" style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 500 }}>
              View all licenses &rarr;
            </Link>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--warning-dim)', color: 'var(--warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Total Revenue</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>${stats?.totalRevenue?.toFixed(2) ?? '0.00'}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
             <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
               Lifetime earnings
             </span>
          </div>
        </div>

        {/* Pending Tickets */}
        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--danger-dim)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg style={{ width: '24px', height: '24px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Pending Tickets</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {stats?.pendingTickets ?? 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {stats?.totalTickets ?? 0}</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <Link href="/tickets" style={{ fontSize: '0.85rem', color: 'var(--danger)', fontWeight: 500 }}>
              View all tickets &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
