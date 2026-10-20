"use client";

import { useEffect, useState } from "react";
import { getApiAcademicDomains, putApiAcademicDomains } from "@/client";
import { useToast } from "@/components/ToastProvider";
import { usePermissions } from "@/components/AuthProvider";

/**
 * The email domains that count as academic. A user who verifies an email on one of them (or a subdomain:
 * "edu.eg" covers "cu.edu.eg") gets the academic badge and can use academic-only promocodes.
 */
export default function AcademicDomainsCard() {
  const { canField } = usePermissions();
  const canEdit = canField("promocodes", "academicDomains");
  const [text, setText] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error: toastError } = useToast();

  useEffect(() => {
    getApiAcademicDomains({ throwOnError: false })
      .then((res) => {
        const list = res.data?.value ?? [];
        setSaved(list);
        setText(list.join("\n"));
      })
      .finally(() => setLoading(false));
  }, []);

  const domains = Array.from(new Set(text.split(/[\s,;]+/).map((d) => d.trim().replace(/^[@.]+/, "").toLowerCase()).filter(Boolean)));
  const changed = domains.join("\n") !== saved.join("\n");

  const save = async () => {
    setSaving(true);
    try {
      const res = await putApiAcademicDomains({ body: { domains }, throwOnError: false });
      if (!res.data?.isSuccess) {
        toastError(res.data?.errors?.map((e) => e.description).filter(Boolean).join(", ") || "Failed to save the domains.");
        return;
      }
      const list = res.data.value ?? [];
      setSaved(list);
      setText(list.join("\n"));
      success("Academic domains saved.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section style={{ marginTop: "1.5rem", padding: "1.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)", background: "var(--bg-surface)", maxWidth: 640 }}>
      <h2 style={{ margin: "0 0 0.25rem", fontSize: "1rem", fontWeight: 700 }}>Academic email domains</h2>
      <p style={{ margin: "0 0 0.85rem", fontSize: "0.82rem", color: "var(--text-muted)" }}>
        Users who verify an email on one of these domains get the academic badge and can use academic-only promocodes.
        Each domain also covers its subdomains (edu.eg covers cu.edu.eg). One per line.
      </p>
      <textarea
        className="form-input"
        rows={5}
        value={text}
        disabled={loading || !canEdit}
        onChange={(e) => setText(e.target.value)}
        placeholder={"edu\nedu.eg\nac.uk"}
        style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", resize: "vertical" }}
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.6rem" }}>
        <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{domains.length} domain{domains.length !== 1 ? "s" : ""}</span>
        <button type="button" className="btn-primary" onClick={save} disabled={!canEdit || loading || saving || !changed}>
          {saving ? "Saving..." : "Save domains"}
        </button>
      </div>
    </section>
  );
}
