"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiTickets, getApiTicketCategories } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter } from "next/navigation";
import TicketFormModal from "@/components/TicketFormModal";
import { TicketCategoryDto } from "@/client/types.gen";
import Link from "next/link";

const getPriorityClass = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "low":      return "badge-info";
    case "medium":   return "badge-warning";
    case "high":     return "badge-danger";
    case "critical": return "badge-danger";
    default:         return "badge-neutral";
  }
};

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case "open":       return "badge-success";
    case "inprogress": return "badge-accent";
    case "closed":     return "badge-neutral";
    default:           return "badge-neutral";
  }
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [categories, setCategories] = useState<TicketCategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) { router.push("/login"); return; }

      client.setConfig({
        baseUrl: (process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003"),
        auth: token,
      });

      const [ticketsRes, categoriesRes] = await Promise.all([
        getApiTickets({ throwOnError: false }),
        getApiTicketCategories({ throwOnError: false }),
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
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Support Tickets</h1>
          <p className="page-subtitle">{loading ? "Loading…" : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}`}</p>
        </div>
        <button id="create-ticket-btn" className="btn-primary" onClick={() => setIsFormModalOpen(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Ticket
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
              <th>Ticket ID</th>
              <th>Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: "20px", width: j === 1 ? "140px" : "80px" }} /></td>
                  ))}
                </tr>
              ))
            ) : tickets.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                    </svg>
                    <p className="empty-state-title">No tickets found</p>
                    <p className="empty-state-sub">Create a ticket to track customer issues</p>
                  </div>
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td className="mono">#{ticket.id?.substring(0, 8)}</td>
                  <td className="fw-medium">{ticket.title}</td>
                  <td style={{ color: "var(--text-secondary)" }}>{ticket.categoryName || "—"}</td>
                  <td><span className={`badge ${getPriorityClass(ticket.priority!)}`}>{ticket.priority}</span></td>
                  <td><span className={`badge ${getStatusClass(ticket.status!)}`}>{ticket.status}</span></td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>
                    {new Date(ticket.createdAt!).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="table-actions">
                      <Link href={`/tickets/${ticket.id}`} className="btn-ghost" style={{ color: "var(--accent-light)", borderColor: "var(--accent-border)" }}>
                        View Details
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isFormModalOpen && (
        <TicketFormModal
          categories={categories}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => { setIsFormModalOpen(false); fetchData(); }}
        />
      )}
    </div>
  );
}
