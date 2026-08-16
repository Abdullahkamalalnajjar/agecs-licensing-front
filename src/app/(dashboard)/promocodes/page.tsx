"use client";
import { useEffect, useState } from "react";
import { getApiPromocodes, deleteApiPromocodesById } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import PromocodeFormModal from "@/components/PromocodeFormModal";

export default function PromocodesPage() {
  const [promocodes, setPromocodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromocode, setSelectedPromocode] = useState<any>(null);
  const router = useRouter();

  const fetchPromocodes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token,
      });

      const response = await getApiPromocodes({ throwOnError: false });
      if (response.data?.isSuccess) {
        setPromocodes(response.data.value || []);
      } else if (response.error || response.data?.isError) {
        setError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to load promocodes.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPromocodes(); }, [router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promocode?")) return;
    try {
      const response = await deleteApiPromocodesById({ path: { id }, throwOnError: false });
      if (response.data?.isSuccess) {
        setPromocodes(promocodes.filter((p) => p.id !== id));
      } else {
        alert(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to delete.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting promocode.");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchPromocodes();
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Promocodes</h1>
          <p className="page-subtitle">{loading ? "Loading…" : `${promocodes.length} code${promocodes.length !== 1 ? "s" : ""}`}</p>
        </div>
        <button id="create-promocode-btn" className="btn-primary" onClick={() => { setSelectedPromocode(null); setIsModalOpen(true); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          New Promocode
        </button>
      </div>

      {error && (
        <div className="alert-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 0 ? "120px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : promocodes.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <polyline points="9 11 12 14 22 4"/>
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                    </svg>
                    <p className="empty-state-title">No promocodes yet</p>
                    <p className="empty-state-sub">Create your first promo code to offer discounts</p>
                  </div>
                </td>
              </tr>
            ) : (
              promocodes.map((promo) => (
                <tr key={promo.id}>
                  <td>
                    <span style={{
                      fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: "600",
                      background: "var(--accent-dim)", color: "var(--accent-light)",
                      padding: "0.2rem 0.6rem", borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--accent-border)", letterSpacing: "0.05em",
                    }}>
                      {promo.code}
                    </span>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
                    {promo.fixedDiscount
                      ? `$${promo.fixedDiscount}`
                      : promo.defaultPriceMultiplier
                      ? `×${promo.defaultPriceMultiplier}`
                      : "—"}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {promo.useCount || 0} / {promo.maxUses || "∞"}
                  </td>
                  <td>
                    {!promo.hidden
                      ? <span className="badge badge-success">Active</span>
                      : <span className="badge badge-neutral">Hidden</span>}
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-ghost" style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }}
                        onClick={() => { setSelectedPromocode(promo); setIsModalOpen(true); }}>
                        Edit
                      </button>
                      <button className="btn-danger-ghost" onClick={() => handleDelete(promo.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PromocodeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        promocode={selectedPromocode}
      />
    </div>
  );
}
