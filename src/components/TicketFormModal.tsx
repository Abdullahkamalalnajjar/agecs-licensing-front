"use client";

import { useState } from "react";
import { postApiTickets } from "@/client";

type TicketFormModalProps = {
  categories: any[];
  onClose: () => void;
  onSuccess: () => void;
};

export default function TicketFormModal({ categories, onClose, onSuccess }: TicketFormModalProps) {
  const [ticketData, setTicketData] = useState({
    title: "",
    description: "",
    categoryId: "",
    priority: "medium",
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = {
        title: ticketData.title,
        description: ticketData.description,
        categoryId: ticketData.categoryId || undefined,
        priority: ticketData.priority
      };

      const response = await postApiTickets({ body: payload, throwOnError: false });

      if (response.data) {
        onSuccess();
      } else if (response.error) {
        // @ts-ignore
        const errorMsg = response.error?.title || response.error?.detail || "Failed to create ticket.";
        setError(errorMsg);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the ticket.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{ backgroundColor: "#ffffff", color: "#111827", width: "100%", maxWidth: "500px", padding: "24px", borderRadius: "12px", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "700" }}>Create Support Ticket</h2>
          <button type="button" onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.5rem", color: "#6b7280", lineHeight: 1 }}>&times;</button>
        </div>

        {error && (
          <div style={{ padding: "1rem", backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem" }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="title" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Title</label>
              <input id="title" type="text" value={ticketData.title} onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })} required style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", color: "#111827" }} placeholder="Brief summary of the issue" />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="categoryId" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Category</label>
              <select id="categoryId" value={ticketData.categoryId} onChange={(e) => setTicketData({ ...ticketData, categoryId: e.target.value })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", backgroundColor: "white", color: "#111827", appearance: "auto" }}>
                <option value="">Select a category...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="priority" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Priority</label>
              <select id="priority" value={ticketData.priority} onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", backgroundColor: "white", color: "#111827", appearance: "auto" }}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label htmlFor="description" style={{ fontSize: "0.875rem", fontWeight: "600", color: "#111827" }}>Description</label>
              <textarea id="description" value={ticketData.description} onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })} required rows={4} style={{ padding: "10px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "0.875rem", outline: "none", resize: "vertical", color: "#111827" }} placeholder="Detailed explanation" />
            </div>

          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "32px" }}>
            <button type="button" onClick={onClose} style={{ padding: "10px 20px", background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", cursor: "pointer", color: "#111827", fontSize: "0.875rem", fontWeight: "600" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving} style={{ padding: "10px 20px", background: "#0ea5e9", border: "none", borderRadius: "8px", cursor: "pointer", color: "#ffffff", fontSize: "0.875rem", fontWeight: "600" }}>
              {saving ? "Submitting..." : "Submit Ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
