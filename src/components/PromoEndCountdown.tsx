"use client";

import { useEffect, useState } from "react";

const pad = (n: number) => String(n).padStart(2, "0");

/** "2d 04:12:33", or "04:12:33" in the last day. */
export function formatTimeLeft(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86_400);
  const clock = `${pad(Math.floor((total % 86_400) / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  return days > 0 ? `${days}d ${clock}` : clock;
}

/**
 * "Ends in 2d 04:12:33", ticking every second until the promo bar's end date. Renders nothing once it's over;
 * usePromoBars drops the bar from the site at the same moment.
 */
export default function PromoEndCountdown({ endDate }: { endDate: string }) {
  const end = new Date(endDate).getTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (Number.isNaN(end)) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [end]);

  const left = end - now;
  if (Number.isNaN(end) || left <= 0) return null;

  return (
    <span
      className="promo-ends"
      title={`Offer ends ${new Date(end).toLocaleString()}`}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.15rem 0.55rem",
        borderRadius: "999px", border: "1px solid currentColor", fontSize: "0.8em", fontWeight: 700,
        fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap", opacity: 0.9,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
      </svg>
      Ends in {formatTimeLeft(left)}
    </span>
  );
}
