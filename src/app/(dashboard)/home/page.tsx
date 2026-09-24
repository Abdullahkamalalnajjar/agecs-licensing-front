"use client";

import { useEffect, useState } from "react";
import { getStats, getApiProducts } from "@/client";
import { client } from "@/client/client.gen";
import { DashboardStatsDto, ProductDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";
import HomeLandingView from "@/components/dashboard/HomeLandingView";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      console.log("loadData started. user:", user);
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        client.setConfig({
          baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
          auth: token || undefined,
        });
        
        if (user?.role === "Admin" || user?.role === "SuperAdmin") {
          console.log("Fetching stats...");
          const { data, error } = await getStats();
          console.log("Stats result:", { data, error });
          if (error) throw new Error("Failed to load dashboard stats.");
          if (data?.value) setStats(data.value);
        } else {
          console.log("Fetching products...");
          // NormalUser, Student, or Unauthenticated
          const { data, error } = await getApiProducts({
            query: { includeHidden: false }
          });
          console.log("Products result:", { data, error });
          if (error) {
            console.error("Products error detail:", error);
            throw new Error(`Failed to load products. Details: ${typeof error === 'object' ? JSON.stringify(error) : error}`);
          }
          if (data?.value) setProducts(data.value);
        }
      } catch (err: any) {
        console.error("Error in loadData:", err);
        setError(err.message || "Something went wrong.");
      } finally {
        console.log("Setting loading to false");
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div className="spinner" style={{ width: "40px", height: "40px", borderTopColor: "var(--accent-light)" }}></div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 500 }}>Loading…</span>
      </div>
    );
  }

  if (error && (user?.role === "Admin" || user?.role === "SuperAdmin")) {
    return (
      <div className="alert-error" style={{ margin: '2rem' }}>
        <svg style={{ width: '20px', height: '20px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        {error}
      </div>
    );
  }

  // Admin view
  if (user?.role === "Admin" || user?.role === "SuperAdmin") {
    return (
      <div className="dashboard-content">
        <AdminDashboardView user={user} stats={stats} />
        
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

  // NormalUser or Student landing page view
  return (
    <div className="landing-content">
      <HomeLandingView products={products} />
    </div>
  );
}
