"use client";
import { useEffect, useState, useCallback } from "react";
import { getApiTicketsById, postApiTicketsByIdComments, putApiTicketsByIdStatus } from "@/client";
import { client } from "@/client/client.gen";
import { useRouter, useParams } from "next/navigation";

import Link from "next/link";

export default function TicketDetailsPage() {
  const params = useParams();
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  
  const router = useRouter();

  const fetchTicket = useCallback(async () => {
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

      const response = await getApiTicketsById({ path: { id: ticketId }, throwOnError: false });

      if (response.data) {
        setTicket(response.data as any);
      } else {
        // @ts-ignore
        setError(response.error?.title || "Failed to load ticket details");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching ticket.");
    } finally {
      setLoading(false);
    }
  }, [ticketId, router]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    setSubmittingComment(true);
    try {
      const response = await postApiTicketsByIdComments({
        path: { id: ticketId },
        body: { content: commentText },
        throwOnError: false
      });
      
      if (response.data !== undefined && response.error === undefined) {
        setCommentText("");
        fetchTicket(); // Reload ticket to get new comment
      } else {
        // @ts-ignore
        alert(response.error?.title || "Failed to add comment");
      }
    } catch (err: any) {
      alert(err.message || "Error adding comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleChangeStatus = async (newStatus: string) => {
    setChangingStatus(true);
    try {
      const response = await putApiTicketsByIdStatus({
        path: { id: ticketId },
        body: { status: newStatus },
        throwOnError: false
      });
      
      if (response.data !== undefined && response.error === undefined) {
        fetchTicket(); // Reload to get new status
      } else {
        // @ts-ignore
        alert(response.error?.title || "Failed to change status");
      }
    } catch (err: any) {
      alert(err.message || "Error changing status");
    } finally {
      setChangingStatus(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", textAlign: "center" }}>Loading ticket details...</div>;
  }

  if (error || !ticket) {
    return (
      <div style={{ padding: "2rem" }}>
        <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
          {error || "Ticket not found"}
        </div>
        <Link href="/tickets" style={{ color: "var(--accent)", textDecoration: "none" }}>&larr; Back to Tickets</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <Link href="/tickets" style={{ color: "#6b7280", textDecoration: "none", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "4px" }}>
          &larr; Back to Tickets
        </Link>
      </div>
      
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", marginBottom: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <h1 style={{ margin: "0 0 8px 0", fontSize: "1.5rem", color: "#111827" }}>{ticket.title}</h1>
            <div style={{ display: "flex", gap: "12px", fontSize: "0.85rem", color: "#6b7280" }}>
              <span>Ticket #{ticket.id?.substring(0, 8)}</span>
              <span>•</span>
              <span>{new Date(ticket.createdAt!).toLocaleString()}</span>
              <span>•</span>
              <span>{ticket.categoryName || "No Category"}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <span style={{ padding: "4px 12px", borderRadius: "9999px", backgroundColor: "#f3f4f6", color: "#4b5563", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>
              Priority: {ticket.priority}
            </span>
            <span style={{ padding: "4px 12px", borderRadius: "9999px", backgroundColor: ticket.status?.toLowerCase() === "open" ? "#d1fae5" : ticket.status?.toLowerCase() === "closed" ? "#f3f4f6" : "#e0e7ff", color: ticket.status?.toLowerCase() === "open" ? "#059669" : ticket.status?.toLowerCase() === "closed" ? "#4b5563" : "#4338ca", fontSize: "0.75rem", fontWeight: "600", textTransform: "uppercase" }}>
              Status: {ticket.status}
            </span>
          </div>
        </div>

        <div style={{ marginTop: "24px", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px", border: "1px solid #f3f4f6" }}>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "#374151", lineHeight: 1.6 }}>
            {ticket.description}
          </p>
        </div>

        <div style={{ marginTop: "24px", display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4b5563" }}>Change Status:</span>
          <select 
            value={ticket.status} 
            onChange={(e) => handleChangeStatus(e.target.value)}
            disabled={changingStatus}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.85rem", backgroundColor: "white", outline: "none" }}
          >
            <option value="Open">Open</option>
            <option value="InProgress">In Progress</option>
            <option value="Closed">Closed</option>
          </select>
          {changingStatus && <span style={{ fontSize: "0.8rem", color: "#6b7280" }}>Updating...</span>}
        </div>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "24px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
        <h2 style={{ margin: "0 0 20px 0", fontSize: "1.25rem", color: "#111827" }}>Conversation</h2>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
          {(!ticket.comments || ticket.comments.length === 0) ? (
            <p style={{ color: "#6b7280", fontStyle: "italic", margin: 0, textAlign: "center", padding: "20px 0" }}>No comments yet.</p>
          ) : (
            ticket.comments.map((comment: any) => (
              <div key={comment.id} style={{ display: "flex", gap: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#4338ca", fontWeight: "bold", flexShrink: 0 }}>
                  {comment.userName?.substring(0, 2).toUpperCase() || "U"}
                </div>
                <div style={{ flex: 1, backgroundColor: "#f9fafb", padding: "12px 16px", borderRadius: "0 12px 12px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                    <strong style={{ fontSize: "0.9rem", color: "#111827" }}>{comment.userName || "User"}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{new Date(comment.createdAt!).toLocaleString()}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "0.9rem", color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleAddComment} style={{ marginTop: "24px" }}>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Type your message here..."
            rows={3}
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "12px" }}>
            <button 
              type="submit" 
              disabled={submittingComment || !commentText.trim()}
              style={{ padding: "8px 20px", backgroundColor: "#0ea5e9", color: "white", border: "none", borderRadius: "6px", fontWeight: "600", fontSize: "0.9rem", cursor: (submittingComment || !commentText.trim()) ? "not-allowed" : "pointer", opacity: (submittingComment || !commentText.trim()) ? 0.7 : 1 }}
            >
              {submittingComment ? "Sending..." : "Send Message"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
