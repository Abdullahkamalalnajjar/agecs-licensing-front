"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/client";
import { client } from "@/client/client.gen";
import { DashboardStatsDto } from "@/client/types.gen";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadStats() {
      if (!user) return;
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
        <div className="spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--accent-light)" }}></div>
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
    <div className="dashboard-content" style={{ animation: "fadeIn 0.5s ease" }}>
      {/* Dynamic Header */}
      <div className="page-header" style={{ 
        display: "flex", justifyContent: "space-between", alignItems: "flex-end", 
        marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem"
      }}>
        <div className="page-header-left">
          <h1 className="page-title" style={{ fontSize: "2.25rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
            Overview
          </h1>
          <p className="page-subtitle" style={{ fontSize: "1.05rem", color: "var(--text-secondary)" }}>
            Welcome back, <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{user?.email?.split('@')[0] || 'Admin'}</span>
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button onClick={() => router.push("/products")} className="btn-secondary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "10px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Add Product
          </button>
          <button onClick={() => router.push("/licenses")} className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.5rem", borderRadius: "10px", background: "linear-gradient(135deg, #7c3aed, #3b82f6)", border: "none", boxShadow: "0 4px 12px rgba(124,58,237,0.3)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22v-5"/><path d="M9 7v2"/><path d="M15 7v2"/><path d="M12 2a5 5 0 0 0-5 5v5a5 5 0 0 0 10 0V7a5 5 0 0 0-5-5z"/>
            </svg>
            Generate License
          </button>
        </div>
      </div>

      {/* Premium Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        
        {/* Total Products */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'default' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '16px', 
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.05))', 
              color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)', border: '1px solid rgba(139,92,246,0.2)'
            }}>
              <svg style={{ width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Products</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{stats?.totalProducts ?? 0}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Ready for sale</span>
            <Link href="/products" className="stat-link" style={{ fontSize: '0.85rem', color: '#8b5cf6', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        {/* Active Licenses */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'default' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '16px', 
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.05))', 
              color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)', border: '1px solid rgba(16,185,129,0.2)'
            }}>
              <svg style={{ width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active Licenses</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>{stats?.totalActiveLicenses ?? 0}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Currently valid</span>
            <Link href="/licenses" className="stat-link" style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'default' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '16px', 
              background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.05))', 
              color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)', border: '1px solid rgba(245,158,11,0.2)'
            }}>
              <svg style={{ width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Revenue</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>${stats?.totalRevenue?.toFixed(2) ?? '0.00'}</div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lifetime earnings</span>
            <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </span>
          </div>
        </div>

        {/* Pending Tickets */}
        <div className="glass-panel stat-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'default' }}>
          <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '120px', height: '120px', background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ 
              width: '56px', height: '56px', borderRadius: '16px', 
              background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))', 
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1)', border: '1px solid rgba(239,68,68,0.2)'
            }}>
              <svg style={{ width: '28px', height: '28px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pending Tickets</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                {stats?.pendingTickets ?? 0}
                <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {stats?.totalTickets ?? 0}</span>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Requires attention</span>
            <Link href="/tickets" className="stat-link" style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View tickets <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Activity Section (Mockup for Aesthetics) */}
      <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>System Overview</h2>
        
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Mock Chart Area */}
          <div style={{ flex: '2 1 400px', minHeight: '200px', background: 'var(--bg-base)', borderRadius: '12px', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '1rem', left: '1.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Revenue (Last 30 Days)</div>
            {/* Simple CSS graph visualization */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(180deg, rgba(124,58,237,0.15) 0%, rgba(124,58,237,0) 100%)', clipPath: 'polygon(0 100%, 0 60%, 10% 50%, 20% 70%, 30% 40%, 40% 60%, 50% 30%, 60% 40%, 70% 20%, 80% 35%, 90% 10%, 100% 20%, 100% 100%)' }}></div>
            <svg preserveAspectRatio="none" style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '100%' }} viewBox="0 0 100 100">
              <polyline points="0,100 0,60 10,50 20,70 30,40 40,60 50,30 60,40 70,20 80,35 90,10 100,20" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" />
            </svg>
          </div>
          
          {/* Quick Actions List */}
          <div style={{ flex: '1 1 250px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Quick Actions</div>
            
            <Link href="/promocodes" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-base)', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.2s ease', border: '1px solid var(--border)' }} className="quick-action-btn">
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Promocodes</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage discounts</div>
              </div>
            </Link>
            
            <Link href="/users" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--bg-base)', borderRadius: '12px', textDecoration: 'none', transition: 'background 0.2s ease', border: '1px solid var(--border)' }} className="quick-action-btn">
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>Users Directory</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Manage roles & access</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
      
      {/* Custom Styles for Dashboard specific hover effects */}
      <style dangerouslySetInnerHTML={{__html: `
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.05);
          border-color: var(--accent-border);
        }
        .stat-link {
          transition: opacity 0.2s;
        }
        .stat-card:hover .stat-link {
          opacity: 0.8;
        }
        .quick-action-btn:hover {
          background: var(--bg-surface) !important;
          border-color: var(--accent-border) !important;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
