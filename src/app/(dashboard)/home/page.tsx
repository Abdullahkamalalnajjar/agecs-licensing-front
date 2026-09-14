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
      if (!user) return;
      
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (token) {
          client.setConfig({
            baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
            auth: token,
          });
        }
        
        if (user.role === "Admin" || user.role === "SuperAdmin") {
          const { data, error } = await getStats();
          if (error) throw new Error("Failed to load dashboard stats.");
          if (data?.value) setStats(data.value);
        } else {
          // NormalUser or Student
          const { data, error } = await getApiProducts({
            query: { includeHidden: false }
          });
          if (error) throw new Error("Failed to load products.");
          if (data?.value) setProducts(data.value);
        }
      } catch (err: any) {
        setError(err.message || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ width: "32px", height: "32px", borderTopColor: "var(--accent-light)" }}></div>
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
    <div className="dashboard-content">
      <HomeLandingView products={products} />
    </div>
  );
}
