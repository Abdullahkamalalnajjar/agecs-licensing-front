"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiTickets, getApiTicketCategories } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import TicketFormModal from "@/components/TicketFormModal";
import { TicketDto, TicketCategoryDto } from "@/client/types.gen";
import Link from "next/link";

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketDto[]>([]);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
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

      const [ticketsRes, categoriesRes] = await Promise.all([
        getApiTickets({ throwOnError: false }),
        getApiTicketCategories({ throwOnError: false })
      ]);

      if (ticketsRes.data) {
        setTickets(ticketsRes.data as any || []);
      } else {
        // @ts-ignore
        setError(ticketsRes.error?.title || "Failed to load tickets");
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data as any || []);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching data.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleModalSuccess = () => {
    setIsFormModalOpen(false);
    fetchData();
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "low": return { bg: "#dbeafe", text: "#2563eb" };
      case "medium": return { bg: "#fef3c7", text: "#d97706" };
      case "high": return { bg: "#fee2e2", text: "#dc2626" };
      case "critical": return { bg: "#991b1b", text: "#fca5a5" };
      default: return { bg: "#f3f4f6", text: "#4b5563" };
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "open": return { bg: "#d1fae5", text: "#059669" };
      case "inprogress": return { bg: "#e0e7ff", text: "#4338ca" };
      case "closed": return { bg: "#f3f4f6", text: "#6b7280" };
      default: return { bg: "#f3f4f6", text: "#4b5563" };
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Tickets</h1>
        <button className="btn-primary" style={{ padding: "0.5rem 1rem", fontSize: "0.95rem" }} onClick={() => setIsFormModalOpen(true)}>
          + Create Ticket
        </button>
      </div>

      {error && (
        <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
          {error}
        </div>
      )}

      <div className="data-table-wrapper" style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Ticket ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ minWidth: "100px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>Loading tickets...</td>
              </tr>
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "2rem", color: "var(--text-secondary)" }}>
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const pColor = getPriorityColor(ticket.priority!);
                const sColor = getStatusColor(ticket.status!);
                
                return (
                  <tr key={ticket.id}>
                    <td style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#6b7280" }}>
                      #{ticket.id?.substring(0, 8)}
                    </td>
                    <td style={{ fontWeight: "500" }}>{ticket.title}</td>
                    <td>{ticket.categoryName || "-"}</td>
                    <td>
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: pColor.bg, color: pColor.text, fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td>
                      <span style={{ padding: "4px 8px", borderRadius: "4px", backgroundColor: sColor.bg, color: sColor.text, fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>
                        {ticket.status}
                      </span>
                    </td>
                    <td>{new Date(ticket.createdAt!).toLocaleDateString()}</td>
                    <td>
                      <Link href={`/tickets/${ticket.id}`} style={{ color: "var(--accent)", textDecoration: "none", fontSize: "0.85rem", fontWeight: "500" }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && (
        <TicketFormModal 
          categories={categories}
          onClose={() => setIsFormModalOpen(false)} 
          onSuccess={handleModalSuccess} 
        />
      )}
    </div>
  );
}
