"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from "react";

/* ============================================================
   Toast System — AGECS Engineering Design
   Bugatti-inspired: monospaced labels, hairline borders,
   no shadows, sharp corners, pure black canvas
   ============================================================ */

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number; // ms, default 4000
}

interface ToastContextType {
  toast: (message: string, type?: ToastType, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ── Individual toast item ───────────────────────────────── */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));

    // Auto dismiss
    timerRef.current = setTimeout(() => dismiss(), toast.duration ?? 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onRemove(toast.id), 320);
  };

  const configs: Record<ToastType, { color: string; bg: string; border: string; icon: JSX.Element; label: string }> = {
    success: {
      color: "#5fa657",
      bg: "rgba(95,166,87,0.08)",
      border: "rgba(95,166,87,0.3)",
      label: "SUCCESS",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    error: {
      color: "#c04040",
      bg: "rgba(192,64,64,0.08)",
      border: "rgba(192,64,64,0.3)",
      label: "ERROR",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      ),
    },
    warning: {
      color: "#d4a017",
      bg: "rgba(212,160,23,0.08)",
      border: "rgba(212,160,23,0.3)",
      label: "WARNING",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    info: {
      color: "#c3d9f3",
      bg: "rgba(195,217,243,0.06)",
      border: "rgba(195,217,243,0.2)",
      label: "INFO",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
      ),
    },
  };

  const cfg = configs[toast.type];

  return (
    <div
      onClick={dismiss}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "1rem 1.25rem",
        background: "#0d0d0d",
        border: `1px solid ${cfg.border}`,
        borderLeft: `3px solid ${cfg.color}`,
        cursor: "pointer",
        userSelect: "none",
        transform: visible && !leaving ? "translateX(0)" : "translateX(calc(100% + 2rem))",
        opacity: visible && !leaving ? 1 : 0,
        transition: "transform 0.32s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.32s ease",
        maxWidth: "360px",
        width: "100%",
        boxSizing: "border-box",
        pointerEvents: "auto",
      }}
    >
      {/* Icon */}
      <div style={{ color: cfg.color, flexShrink: 0, marginTop: "1px" }}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "9px",
          fontWeight: 400,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: cfg.color,
          marginBottom: "0.3rem",
        }}>
          {cfg.label}
        </div>
        <div style={{
          fontFamily: "'Cormorant Garamond', Garamond, serif",
          fontSize: "15px",
          fontWeight: 400,
          color: "#cccccc",
          lineHeight: 1.45,
          wordBreak: "break-word",
        }}>
          {toast.message}
        </div>
      </div>

      {/* Close */}
      <div style={{
        color: "#666666",
        flexShrink: 0,
        marginTop: "1px",
        lineHeight: 1,
      }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>
    </div>
  );
}

/* ── Provider ─────────────────────────────────────────────── */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]); // max 5 visible
  }, []);

  const ctxValue: ToastContextType = {
    toast: addToast,
    success: (msg, dur) => addToast(msg, "success", dur),
    error:   (msg, dur) => addToast(msg, "error", dur ?? 6000),
    warning: (msg, dur) => addToast(msg, "warning", dur),
    info:    (msg, dur) => addToast(msg, "info", dur),
  };

  return (
    <ToastContext.Provider value={ctxValue}>
      {children}

      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.6rem",
          alignItems: "flex-end",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
