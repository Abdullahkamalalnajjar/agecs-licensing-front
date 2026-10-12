"use client";
import { useEffect, useState } from "react";
import { getApiPromocodes, deleteApiPromocodesById, putApiPromocodesById, getApiProducts } from "@/client";
import type { ProductDto } from "@/client/types.gen";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import PromocodeFormModal from "@/components/PromocodeFormModal";
import { useToast } from "@/components/ToastProvider";

/** id → display name; a variation is shown with its parent product, e.g. "AutoCAD – 1 Year". */
const toProductNames = (products: ProductDto[]) => {
  const names: Record<string, string> = {};
  const byId = new Map(products.map((p) => [p.id, p]));
  for (const p of products) {
    if (!p.id) continue;
    const parent = p.parentProductId ? byId.get(p.parentProductId) : undefined;
    names[p.id] = parent?.name ? `${parent.name} – ${p.name}` : p.name || "Unnamed product";
    for (const c of p.children ?? []) {
      if (c.id) names[c.id] = `${p.name} – ${c.name}`;
    }
  }
  return names;
};

export default function PromocodesPage() {
  const [promocodes, setPromocodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPromocode, setSelectedPromocode] = useState<any>(null);
  const [productNames, setProductNames] = useState<Record<string, string>>({});
  const router = useRouter();
  const { success, error: toastError } = useToast();

  const fetchPromocodes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token,
      });

      // Admins see every code, disabled ones included, so they can be edited and re-enabled.
      const [response, productsResponse] = await Promise.all([
        getApiPromocodes({ query: { includeDisabled: true }, throwOnError: false }),
        getApiProducts({ query: { includeHidden: true }, throwOnError: false }),
      ]);
      if (productsResponse.data?.value) setProductNames(toProductNames(productsResponse.data.value));
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
    try {
      const response = await deleteApiPromocodesById({ path: { id }, throwOnError: false });
      if (response.data?.isSuccess) {
        setPromocodes(promocodes.filter((p) => p.id !== id));
        success("Promocode deleted.");
      } else {
        toastError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to delete.");
      }
    } catch (err: any) {
      toastError(err.message || "Error deleting promocode.");
    }
  };

  // A disabled code is rejected at the cart until re-enabled.
  const handleToggleDisabled = async (promo: any) => {
    const disabled = !promo.disabled;
    try {
      const response = await putApiPromocodesById({
        path: { id: promo.id },
        // PUT replaces every field, so send the code's current values with only "disabled" flipped.
        body: {
          id: promo.id,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          disabled,
          withTaxes: promo.withTaxes,
          expiresAt: promo.expiresAt,
          maxUses: promo.maxUses,
          productIds: promo.productIds ?? [],
        },
        throwOnError: false,
      });
      if (response.data?.isSuccess) {
        setPromocodes(promocodes.map((p) => (p.id === promo.id ? response.data!.value : p)));
        success(disabled ? "Promocode disabled." : "Promocode enabled.");
      } else {
        toastError(response.data?.errors?.map((e) => e.description).join(", ") || "Failed to update.");
      }
    } catch (err: any) {
      toastError(err.message || "Error updating promocode.");
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
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{
                        fontFamily: "var(--font-mono)", fontSize: "0.875rem", fontWeight: "600",
                        background: "var(--accent-dim)", color: "var(--accent-light)",
                        padding: "0.2rem 0.6rem", borderRadius: "var(--radius-sm)",
                        border: "1px solid var(--accent-border)", letterSpacing: "0.05em",
                      }}>
                        {promo.code}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(promo.code);
                          success("Copied to clipboard!");
                        }}
                        style={{
                          background: "transparent", border: "none", cursor: "pointer",
                          color: "var(--text-muted)", padding: "0.25rem", display: "flex", alignItems: "center",
                          borderRadius: "4px", transition: "color 0.2s, background 0.2s"
                        }}
                        title="Copy code"
                        onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "0.875rem" }}>
                    {promo.discountValue == null
                      ? "—"
                      : promo.discountType === "Percentage"
                      ? `${promo.discountValue}% off`
                      : promo.discountType === "AmountOff"
                      ? `−${promo.discountValue} off`
                      : `Cart = ${promo.discountValue}`}
                    <div style={{ fontFamily: "inherit", fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                      {promo.productIds?.length ? (() => {
                        const names: string[] = promo.productIds.map((id: string) => productNames[id] ?? (Object.keys(productNames).length ? "Deleted product" : "Unknown product"));
                        const shown = names.slice(0, 2).join(", ");
                        return <span title={names.join("\n")}>Only: {shown}{names.length > 2 && ` +${names.length - 2} more`}</span>;
                      })() : "Whole cart"}
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>
                    {promo.useCount || 0} / {promo.maxUses || "∞"}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
                      {promo.disabled ? (
                        <span className="badge badge-neutral">Disabled</span>
                      ) : promo.isActive ? (
                        <span className="badge badge-success">Active</span>
                      ) : (
                        <span className="badge badge-danger">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button className="btn-ghost" style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }}
                        onClick={() => { setSelectedPromocode(promo); setIsModalOpen(true); }}>
                        Edit
                      </button>
                      <button className="btn-ghost" onClick={() => handleToggleDisabled(promo)}>
                        {promo.disabled ? "Enable" : "Disable"}
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
