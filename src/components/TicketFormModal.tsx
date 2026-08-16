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
    <div className="modal-overlay">
      <div className="modal-container medium">
        <div className="modal-header">
          <h2 className="modal-title">Create Support Ticket</h2>
          <button type="button" className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="alert-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          
          <form id="ticketForm" onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="title" className="form-label">Title</label>
                <input id="title" type="text" className="form-input" value={ticketData.title} onChange={(e) => setTicketData({ ...ticketData, title: e.target.value })} required placeholder="Brief summary of the issue" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="categoryId" className="form-label">Category</label>
                  <select id="categoryId" className="form-input" value={ticketData.categoryId} onChange={(e) => setTicketData({ ...ticketData, categoryId: e.target.value })} style={{ appearance: "auto" }}>
                    <option value="">Select a category...</option>
                    {categories.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <select id="priority" className="form-input" value={ticketData.priority} onChange={(e) => setTicketData({ ...ticketData, priority: e.target.value })} style={{ appearance: "auto" }}>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label htmlFor="description" className="form-label">Description</label>
                <textarea id="description" className="form-input" value={ticketData.description} onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })} required rows={4} style={{ resize: "vertical" }} placeholder="Detailed explanation" />
              </div>

            </div>
          </form>
        </div>
        
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="ticketForm" className="btn-primary" disabled={saving}>
            {saving ? "Submitting..." : "Submit Ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
