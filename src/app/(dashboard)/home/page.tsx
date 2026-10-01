"use client";

import { useEffect, useState } from "react";
import { getStats, getApiProducts, getApiPackages } from "@/client";
import { client } from "@/client/client.gen";
import { DashboardStatsDto, ProductDto, PackageDto } from "@/client/types.gen";
import { useAuth } from "@/components/AuthProvider";
import AdminDashboardView from "@/components/dashboard/AdminDashboardView";
import HomeLandingView from "@/components/dashboard/HomeLandingView";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [packages, setPackages] = useState<PackageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        client.setConfig({
          baseUrl: process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003",
          auth: token || undefined,
        });

        if (isAdmin) {
          const { data, error } = await getStats({ throwOnError: false });
          if (error) throw new Error("Failed to load dashboard data.");
          if (data?.value) setStats(data.value);
        } else {
          // NormalUser, Student, or unauthenticated
          const [prodRes, pkgRes] = await Promise.allSettled([
            getApiProducts({ query: { includeHidden: false }, throwOnError: false }),
            getApiPackages({ throwOnError: false })
          ]);
          if (prodRes.status === "fulfilled" && prodRes.value.data?.value) {
            setProducts(prodRes.value.data.value);
          }
          if (pkgRes.status === "fulfilled" && pkgRes.value.data?.value) {
            setPackages(pkgRes.value.data.value);
          }
        }
      } catch (err) {
        console.error("Error loading home page:", err);
        setError((err instanceof Error && err.message) || "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAdmin, attempt]);

  if (isAdmin) {
    return (
      <div className="dashboard-content">
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 32, width: 220, marginBottom: "2rem" }} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
              {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 124, borderRadius: "var(--radius-lg)" }} />)}
            </div>
            <div className="skeleton" style={{ height: 420, borderRadius: "var(--radius-lg)" }} />
          </>
        ) : error ? (
          <div className="alert-error" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ flex: 1 }}>{error}</span>
            <button className="btn-ghost" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
          </div>
        ) : (
          <AdminDashboardView user={user} stats={stats} />
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
        <div className="spinner" style={{ width: "40px", height: "40px", borderColor: "var(--border)", borderTopColor: "var(--accent)" }}></div>
        <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontWeight: 500 }}>Loading…</span>
      </div>
    );
  }

  // NormalUser or Student landing page view
  return (
    <div className="landing-content">
      <HomeLandingView products={products} packages={packages} />
    </div>
  );
}
