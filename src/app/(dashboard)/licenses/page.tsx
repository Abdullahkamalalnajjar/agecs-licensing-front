"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { 
  getApiLicenses, 
  getApiProducts, 
  getIdentityUsers, 
  deleteApiLicensesById,
  postApiLicensesAdminByIdRevoke
} from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import LicenseFormModal from "@/components/LicenseFormModal";
import LicenseDetailsModal from "@/components/LicenseDetailsModal";
import RenewLicenseModal from "@/components/RenewLicenseModal";
import MigrateHwidModal from "@/components/MigrateHwidModal";
import HwidListModal from "@/components/HwidListModal";
import DiagnosticModal from "@/components/DiagnosticModal";
import { ProductDto } from "@/client/types.gen";

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any | null>(null);

  // Modals state
  const [detailsLicense, setDetailsLicense] = useState<any | null>(null);
  const [renewLicenseId, setRenewLicenseId] = useState<string | null>(null);
  const [migrateLicenseId, setMigrateLicenseId] = useState<string | null>(null);
  const [hwidListLicenseId, setHwidListLicenseId] = useState<string | null>(null);
  const [diagnosticLicenseId, setDiagnosticLicenseId] = useState<string | null>(null);

  // Filter/search state
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterTrial, setFilterTrial] = useState<"all" | "trial" | "paid">("all");

  const router = useRouter();

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5004"),
        auth: token,
      });

      const [licensesRes, productsRes, usersRes] = await Promise.all([
        getApiLicenses({ throwOnError: false }),
        getApiProducts({ throwOnError: false }),
        getIdentityUsers({ throwOnError: false })
      ]);

      if (usersRes.data?.isSuccess) {
        setUsers((usersRes.data.value as any) || []);
      }
      if (productsRes.data?.isSuccess) {
        setProducts(productsRes.data.value || []);
      }
      if (licensesRes.data) {
        const raw = licensesRes.data as any;
        const list = raw.value ?? raw;
        setLicenses(Array.isArray(list) ? list : []);
      } else if (licensesRes.error) {
        setError("Failed to load licenses.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchLicenses(); }, [fetchLicenses]);

  const openCreateModal = () => { setEditingLicense(null); setIsFormModalOpen(true); };
  const handleModalSuccess = () => { setIsFormModalOpen(false); fetchLicenses(); };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this license?")) return;
    setLoading(true);
    try {
      const res = await deleteApiLicensesById({ path: { id }, throwOnError: false });
      if ((res.data as any)?.isSuccess || res.response?.status === 200 || res.response?.status === 204) {
        fetchLicenses();
      } else {
        setError((res.data as any)?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to delete license.");
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to delete license");
      setLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this license? It will be disabled immediately.")) return;
    try {
      const res = await postApiLicensesAdminByIdRevoke({ path: { id }, throwOnError: false });
      if ((res.data as any)?.isSuccess || res.response?.status === 200 || res.response?.status === 204) {
        fetchLicenses();
      } else {
        alert((res.data as any)?.errors?.map((err: any) => err.description).filter(Boolean).join(", ") || "Failed to revoke license.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    }
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? `${product.name}${product.version ? ` (${product.version})` : ""}` : productId;
  };

  // Stats
  const totalLicenses = licenses.length;
  const activeLicenses = licenses.filter(l => l.isActive).length;
  const trialLicenses = licenses.filter(l => l.isTrial).length;
  const expiringSoon = licenses.filter(l => {
    if (!l.expiryDate) return false;
    const diff = (new Date(l.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  }).length;

  // Filtered licenses
  const filtered = useMemo(() => {
    return licenses.filter(l => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (l.serial || "").toLowerCase().includes(q) ||
        (l.name || "").toLowerCase().includes(q) ||
        (l.email || "").toLowerCase().includes(q) ||
        (l.productName || getProductName(l.productId) || "").toLowerCase().includes(q);
      const matchStatus = filterStatus === "all" || (filterStatus === "active" ? l.isActive : !l.isActive);
      const matchTrial = filterTrial === "all" || (filterTrial === "trial" ? l.isTrial : !l.isTrial);
      return matchSearch && matchStatus && matchTrial;
    });
  }, [licenses, search, filterStatus, filterTrial, products]);

  const isExpiringSoon = (expiryDate: string | null) => {
    if (!expiryDate) return false;
    const diff = (new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 30;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

      {/* ── PAGE HEADER ─────────────────────────────────── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "linear-gradient(135deg, rgba(var(--accent-rgb), 0.05) 0%, rgba(var(--bg-surface-rgb), 0) 100%)",
        padding: "1.5rem",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--border)",
        boxShadow: "0 4px 24px -8px rgba(0,0,0,0.05)",
        backdropFilter: "blur(8px)",
        flexWrap: "wrap",
        gap: "1rem"
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
            Licenses Management
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", margin: 0, fontWeight: 500 }}>
            {loading ? "Loading statistics…" : `Overview of ${totalLicenses} registered license${totalLicenses !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button className="btn-primary" onClick={openCreateModal} style={{
          padding: "0.75rem 1.5rem",
          borderRadius: "var(--radius-lg)",
          fontWeight: 600,
          boxShadow: "0 8px 16px -4px rgba(var(--accent-rgb), 0.3)",
          transition: "all 0.25s ease",
          display: "flex",
          alignItems: "center",
          gap: "0.5rem"
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 20px -4px rgba(var(--accent-rgb), 0.4)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 16px -4px rgba(var(--accent-rgb), 0.3)"; }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New License
        </button>
      </div>

      {/* ── ERROR BANNER ────────────────────────────────── */}
      {error && (
        <div className="alert-error" style={{ borderRadius: "var(--radius-lg)", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.1)" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span style={{ fontWeight: 500 }}>{error}</span>
          <button onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.7, padding: 4, display: "flex" }}>✕</button>
        </div>
      )}

      {/* ── STATS CARDS ─────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        {[
          { label: "Total Licenses", value: totalLicenses, icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>), color: "var(--accent)", dim: "var(--accent-dim)" },
          { label: "Active", value: activeLicenses, icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>), color: "var(--success)", dim: "var(--success-dim)" },
          { label: "Trial Licenses", value: trialLicenses, icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>), color: "var(--warning)", dim: "var(--warning-dim)" },
          { label: "Expiring Soon", value: expiringSoon, icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>), color: "var(--danger)", dim: "var(--danger-dim)" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-xl)",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
          }}
            className="stat-card"
          >
            <div style={{
              position: "absolute", top: 0, right: 0, width: "140px", height: "140px",
              background: `radial-gradient(circle, ${stat.color}15 0%, transparent 70%)`,
              transform: "translate(30%, -30%)", pointerEvents: "none", borderRadius: "50%"
            }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ width: 48, height: 48, borderRadius: "14px", background: stat.dim, display: "flex", alignItems: "center", justifyContent: "center", color: stat.color, flexShrink: 0, boxShadow: `0 4px 12px ${stat.color}20` }}>
                {loading ? <div className="skeleton" style={{ width: 24, height: 24, borderRadius: 6 }} /> : stat.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "var(--text-primary)", lineHeight: 1, letterSpacing: "-0.03em" }}>
                {loading ? <div className="skeleton" style={{ width: 60, height: 32, borderRadius: 6 }} /> : stat.value}
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 600, marginTop: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── SEARCH & FILTERS ────────────────────────────── */}
      <div style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)",
        padding: "1.25rem",
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        flexWrap: "wrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.02)"
      }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: 240, position: "relative", display: "flex", alignItems: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: "1rem", color: "var(--text-muted)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            className="form-input"
            placeholder="Search by serial, name, email, product…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              paddingLeft: "2.75rem", 
              fontSize: "0.9rem", 
              width: "100%", 
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
              transition: "all 0.2s ease"
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(var(--accent-rgb), 0.1)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "inset 0 1px 2px rgba(0,0,0,0.02)"; }}
          />
        </div>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", padding: "0.35rem", border: "1px solid var(--border)" }}>
            {(["all", "active", "inactive"] as const).map(s => (
              <button key={s} onClick={() => setFilterStatus(s)} style={{
                padding: "0.4rem 1rem",
                borderRadius: "calc(var(--radius-lg) - 0.25rem)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                background: filterStatus === s ? "var(--bg-surface)" : "transparent",
                color: filterStatus === s ? "var(--accent)" : "var(--text-secondary)",
                boxShadow: filterStatus === s ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                textTransform: "capitalize",
              }}
              onMouseEnter={(e) => { if(filterStatus !== s) e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { if(filterStatus !== s) e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {/* Trial Filter */}
          <div style={{ display: "flex", gap: "0.25rem", background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)", padding: "0.35rem", border: "1px solid var(--border)" }}>
            {(["all", "paid", "trial"] as const).map(t => (
              <button key={t} onClick={() => setFilterTrial(t)} style={{
                padding: "0.4rem 1rem",
                borderRadius: "calc(var(--radius-lg) - 0.25rem)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.85rem",
                fontWeight: 600,
                background: filterTrial === t ? "var(--bg-surface)" : "transparent",
                color: filterTrial === t ? "var(--accent)" : "var(--text-secondary)",
                boxShadow: filterTrial === t ? "0 2px 6px rgba(0,0,0,0.05)" : "none",
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                textTransform: "capitalize",
              }}
              onMouseEnter={(e) => { if(filterTrial !== t) e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { if(filterTrial !== t) e.currentTarget.style.color = "var(--text-secondary)"; }}
              >
                {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 500, padding: "0 0.5rem", whiteSpace: "nowrap", marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent-light)", display: "inline-block" }} />
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* ── TABLE ───────────────────────────────────────── */}
      <div className="data-table-wrapper" style={{ 
        borderRadius: "var(--radius-xl)", 
        border: "1px solid var(--border)", 
        background: "var(--bg-surface)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
        overflow: "hidden"
      }}>
        <table className="data-table" style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ background: "var(--bg-elevated)", borderBottom: "1px solid var(--border)" }}>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Serial</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Product</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Usage</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Expiry</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
              <th style={{ padding: "1rem", fontWeight: 700, color: "var(--text-secondary)", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 8 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "18px", width: j === 0 ? "130px" : j === 7 ? "120px" : "80px", borderRadius: "var(--radius-sm)" }} /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <p className="empty-state-title">{search || filterStatus !== "all" || filterTrial !== "all" ? "No matching licenses" : "No licenses yet"}</p>
                    <p className="empty-state-sub">{search || filterStatus !== "all" || filterTrial !== "all" ? "Try adjusting your search or filters" : "Create your first license to get started"}</p>
                    {(search || filterStatus !== "all" || filterTrial !== "all") && (
                      <button className="btn-ghost" style={{ marginTop: "0.75rem" }} onClick={() => { setSearch(""); setFilterStatus("all"); setFilterTrial("all"); }}>
                        Clear Filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((license) => {
                const expiring = isExpiringSoon(license.expiryDate);
                return (
                  <tr key={license.id} className="table-row-hover" style={{ transition: "all 0.2s ease", borderBottom: "1px solid var(--border)" }}>
                    {/* Serial */}
                    <td>
                      <span style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        background: "var(--bg-elevated)",
                        border: "1px solid var(--border)",
                        borderRadius: "var(--radius-sm)",
                        padding: "0.2rem 0.5rem",
                        color: "var(--accent-light)",
                        letterSpacing: "0.03em",
                        display: "inline-block",
                        maxWidth: 130,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}>
                        {license.serial ? license.serial.substring(0, 12) + "…" : "N/A"}
                      </span>
                    </td>

                    {/* Client */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: "50%",
                          background: `hsl(${(license.name || "X").charCodeAt(0) * 5 % 360}, 60%, 35%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.75rem", fontWeight: 700, color: "white", flexShrink: 0
                        }}>
                          {(license.name || license.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)", lineHeight: 1.2 }}>
                            {license.name || "—"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>
                            {license.email || "—"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Product */}
                    <td>
                      <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", fontWeight: 500 }}>
                        {license.productName || getProductName(license.productId) || "—"}
                      </span>
                    </td>

                    {/* Type */}
                    <td>
                      <span className={`badge ${
                        license.type === "Edu" ? "badge-info" :
                        license.type === "All" ? "badge-accent" :
                        "badge-neutral"
                      }`} style={{ borderRadius: "99px", padding: "0.25rem 0.75rem", fontSize: "0.75rem", fontWeight: 700 }}>
                        {license.type || "Basic"}
                      </span>
                    </td>

                    {/* Usage */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", gap: "0.75rem" }}>
                          <span title="Licenses Used">
                            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{license.usedCount ?? 0}</span>/{license.licenseCount ?? 1} seats
                          </span>
                          <span title="Migrations Used">
                            <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>{license.migrationCount ?? 0}</span>/{license.migrationLimit ?? 1} mig.
                          </span>
                        </div>
                        {/* Mini progress bar */}
                        <div style={{ height: 3, width: 80, background: "var(--bg-elevated)", borderRadius: 99, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${Math.min(100, ((license.usedCount ?? 0) / (license.licenseCount ?? 1)) * 100)}%`,
                            background: "var(--accent)",
                            borderRadius: 99,
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                      </div>
                    </td>

                    {/* Expiry */}
                    <td>
                      {license.expiryDate ? (
                        <span style={{ fontSize: "0.85rem", color: expiring ? "var(--warning)" : "var(--text-secondary)", fontWeight: expiring ? 600 : 400, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          {expiring && (
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                              <line x1="12" y1="9" x2="12" y2="13"></line>
                            </svg>
                          )}
                          {new Date(license.expiryDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--success)", fontWeight: 600 }}>Lifetime</span>
                      )}
                    </td>

                    {/* Status */}
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem", alignItems: "flex-start" }}>
                        <span className={`badge ${license.isActive ? "badge-success" : "badge-danger"}`} style={{ borderRadius: "99px", padding: "0.2rem 0.6rem", fontSize: "0.75rem", fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", display: "inline-block" }}></span>
                          {license.isActive ? "Active" : "Inactive"}
                        </span>
                        {license.isTrial && (
                          <span className="badge badge-warning" style={{ borderRadius: "99px", padding: "0.15rem 0.5rem", fontSize: "0.7rem", fontWeight: 700 }}>Trial</span>
                        )}
                        {license.isExpired && (
                          <span className="badge badge-danger" style={{ borderRadius: "99px", padding: "0.15rem 0.5rem", fontSize: "0.7rem", fontWeight: 700 }}>Expired</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td>
                      <div style={{ display: "flex", gap: "0.3rem", justifyContent: "center", flexWrap: "nowrap" }}>
                        {/* View */}
                        <ActionBtn title="View Details" onClick={() => setDetailsLicense(license)} color="var(--accent-light)">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </ActionBtn>

                        {/* Renew */}
                        <ActionBtn title="Renew License" onClick={() => setRenewLicenseId(license.id)} color="var(--success)">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M23 4v6h-6"></path><path d="M1 20v-6h6"></path><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                          </svg>
                        </ActionBtn>

                        {/* Migrate HWID */}
                        <ActionBtn title="Migrate HWID" onClick={() => setMigrateLicenseId(license.id)} color="var(--info)">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                          </svg>
                        </ActionBtn>

                        {/* HWID List */}
                        <ActionBtn title="HWID List" onClick={() => setHwidListLicenseId(license.id)} color="var(--text-secondary)">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect>
                          </svg>
                        </ActionBtn>

                        {/* Diagnostic */}
                        <ActionBtn title="Diagnostic" onClick={() => setDiagnosticLicenseId(license.id)} color="var(--warning)">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                          </svg>
                        </ActionBtn>

                        {/* Revoke */}
                        {license.isActive && (
                          <ActionBtn title="Revoke License" onClick={() => handleRevoke(license.id)} color="var(--danger)">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                            </svg>
                          </ActionBtn>
                        )}

                        {/* Delete */}
                        <ActionBtn title="Delete License" onClick={() => handleDelete(license.id)} color="var(--danger)" danger>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ── MODALS ──────────────────────────────────────── */}
      <LicenseFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={handleModalSuccess}
        products={products}
        users={users}
        initialData={editingLicense}
      />

      <LicenseDetailsModal
        isOpen={!!detailsLicense}
        onClose={() => setDetailsLicense(null)}
        license={detailsLicense}
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

      <HwidListModal
        isOpen={!!hwidListLicenseId}
        licenseId={hwidListLicenseId!}
        onClose={() => setHwidListLicenseId(null)}
      />

      <DiagnosticModal
        isOpen={!!diagnosticLicenseId}
        licenseId={diagnosticLicenseId!}
        onClose={() => setDiagnosticLicenseId(null)}
      />

      <style>{`
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .table-row-hover:hover {
          background: var(--bg-elevated);
        }
        .table-row-hover td {
          padding: 1rem;
        }
      `}</style>
    </div>
  );
}

/* ─── Action Button Component ──────────────────────── */
function ActionBtn({ title, onClick, color, danger, children }: {
  title: string;
  onClick: () => void;
  color?: string;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "var(--radius-md)",
        border: `1px solid ${danger ? "rgba(239,68,68,0.15)" : "transparent"}`,
        background: danger ? "var(--danger-dim)" : "transparent",
        color: color || "var(--text-secondary)",
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background = danger ? "var(--danger)" : "var(--bg-elevated)";
        (e.currentTarget as HTMLButtonElement).style.color = danger ? "white" : (color || "var(--text-primary)");
        (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = danger ? "var(--danger-dim)" : "transparent";
        (e.currentTarget as HTMLButtonElement).style.color = color || "var(--text-secondary)";
        (e.currentTarget as HTMLButtonElement).style.transform = "none";
        (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
      }}
    >
      {children}
    </button>
  );
}
