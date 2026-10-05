"use client";

import { useEffect, useRef, useState } from "react";
import { getIdentityClients } from "@/client";
import type { ClientDto } from "@/client/types.gen";

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "https://localhost:5003";

type ClientPickerProps = {
  value: ClientDto | null;
  onChange: (client: ClientDto | null) => void;
};

/**
 * Searchable picker for an existing account (by email, user name or phone), backed by GET /identity/clients.
 * Searching server-side means it works however many accounts there are.
 */
export default function ClientPicker({ value, onChange }: ClientPickerProps) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Debounced search; the latest request wins.
  useEffect(() => {
    if (value) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      const res = await getIdentityClients({ baseUrl, query: { search: search.trim() || undefined, take: 20 }, throwOnError: false });
      if (cancelled) return;
      setResults(res.data?.value ?? []);
      setHighlight(0);
      setLoading(false);
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [search, value]);

  // Close the results when clicking outside.
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!wrapRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const pick = (client: ClientDto) => {
    onChange(client);
    setOpen(false);
    setSearch("");
  };

  if (value) {
    return (
      <div className="cp-selected">
        <span className="cp-avatar">{(value.email || "?").charAt(0).toUpperCase()}</span>
        <div className="cp-main">
          <div className="cp-email">{value.userName && value.userName !== value.email ? value.userName : value.email}</div>
          <div className="cp-meta">
            {[value.userName && value.userName !== value.email ? value.email : null, value.phoneNumber].filter(Boolean).join(" · ") || "Existing account"}
          </div>
        </div>
        {value.roles?.[0] && <span className="cp-role">{value.roles[0]}</span>}
        <button type="button" className="btn-ghost cp-change" onClick={() => onChange(null)}>Change</button>
      </div>
    );
  }

  return (
    <div className="cp-wrap" ref={wrapRef}>
      <div className="cp-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
        <input
          type="search"
          className="form-input"
          placeholder="Search by email, user name or phone…"
          value={search}
          role="combobox"
          aria-expanded={open}
          aria-controls="client-picker-results"
          aria-autocomplete="list"
          onFocus={() => setOpen(true)}
          onChange={(e) => { setSearch(e.target.value); setOpen(true); }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setHighlight((h) => Math.min(h + 1, results.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
            // Enter would submit the license form.
            if (e.key === "Enter") { e.preventDefault(); if (results[highlight]) pick(results[highlight]); }
            if (e.key === "Escape") setOpen(false);
          }}
        />
      </div>

      {open && (
        <ul className="cp-results" id="client-picker-results" role="listbox">
          {loading && results.length === 0 ? (
            <li className="cp-empty">Searching…</li>
          ) : results.length === 0 ? (
            <li className="cp-empty">No accounts match &ldquo;{search}&rdquo;. Switch to <strong>New client</strong> to create one.</li>
          ) : (
            results.map((client, i) => (
              <li
                key={client.userId}
                role="option"
                aria-selected={i === highlight}
                className={`cp-option ${i === highlight ? "is-active" : ""}`}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); pick(client); }}
              >
                <span className="cp-avatar">{(client.email || "?").charAt(0).toUpperCase()}</span>
                <span className="cp-main">
                  <span className="cp-email">{client.userName && client.userName !== client.email ? client.userName : client.email}</span>
                  {((client.userName && client.userName !== client.email) || client.phoneNumber) && (
                    <span className="cp-meta">{[client.userName && client.userName !== client.email ? client.email : null, client.phoneNumber].filter(Boolean).join(" · ")}</span>
                  )}
                </span>
                {client.roles?.[0] && <span className="cp-role">{client.roles[0]}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
