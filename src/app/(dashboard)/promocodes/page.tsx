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

  useEffect(() => {
    const fetchPromocodes = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        client.setConfig({
          baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
          auth: token
        });

        const response = await getApiPromocodes({ throwOnError: false });
        if (response.data?.isSuccess) {
          setPromocodes(response.data.value || []);
        } else if (response.error || response.data?.isError) {
          const errorMsg = response.data?.errors?.map(e => e.description).join(", ") || "Failed to load promocodes.";
          setError(errorMsg);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while fetching promocodes.");
      } finally {
        setLoading(false);
      }
    };

    fetchPromocodes();
  }, [router]);

  const handleCreateNew = () => {
    setSelectedPromocode(null);
    setIsModalOpen(true);
  };

  const handleEdit = (promo: any) => {
    setSelectedPromocode(promo);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promocode?")) return;
    try {
      const response = await deleteApiPromocodesById({ path: { id }, throwOnError: false });
      if (response.data?.isSuccess) {
        setPromocodes(promocodes.filter(p => p.id !== id));
      } else {
        alert(response.data?.errors?.map(e => e.description).join(", ") || "Failed to delete.");
      }
    } catch (err: any) {
      alert(err.message || "Error deleting promocode.");
    }
  };

  const handleModalSuccess = () => {
    setIsModalOpen(false);
    // Re-fetch
    setLoading(true);
    getApiPromocodes({ throwOnError: false }).then(res => {
      if (res.data?.isSuccess) setPromocodes(res.data.value || []);
      setLoading(false);
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Promocodes</h1>
        <button className="btn-primary" onClick={handleCreateNew} style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }}>
          + New Promocode
        </button>
      </div>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Code</th>
              <th>Discount</th>
              <th>Usage</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem" }}>Loading promocodes...</td>
              </tr>
            ) : promocodes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                  No promocodes found.
                </td>
              </tr>
            ) : (
              promocodes.map((promo) => (
                <tr key={promo.id}>
                  <td>{promo.id}</td>
                  <td style={{ fontWeight: "600", fontFamily: "monospace", letterSpacing: "1px" }}>{promo.code}</td>
                  <td>{promo.fixedDiscount ? `$${promo.fixedDiscount}` : promo.defaultPriceMultiplier ? `${promo.defaultPriceMultiplier}x` : '-'}</td>
                  <td>{promo.useCount || 0} / {promo.maxUses || "∞"}</td>
                  <td>
                    <span style={{ 
                      padding: "0.25rem 0.5rem", 
                      borderRadius: "4px", 
                      fontSize: "0.8rem", 
                      fontWeight: "600",
                      backgroundColor: !promo.hidden ? "rgba(34, 197, 94, 0.1)" : "rgba(107, 114, 128, 0.1)",
                      color: !promo.hidden ? "#22c55e" : "#6b7280" 
                    }}>
                      {!promo.hidden ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleEdit(promo)} style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", marginRight: "1rem", fontWeight: "500" }}>Edit</button>
                    <button onClick={() => handleDelete(promo.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "500" }}>Delete</button>
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
