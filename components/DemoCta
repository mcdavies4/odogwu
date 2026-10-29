"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function DemoCta({ refTag }: { refTag?: string }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem("odogwu:cta-closed")) return;
    } catch {}
    const t = setTimeout(() => setShow(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  function close() {
    setShow(false);
    try {
      sessionStorage.setItem("odogwu:cta-closed", "1");
    } catch {}
  }

  return (
    <div
      role="region"
      aria-label="Become an Odogwu partner"
      style={{
        position: "fixed",
        left: 12,
        right: 12,
        bottom: "calc(12px + env(safe-area-inset-bottom))",
        zIndex: 60,
        maxWidth: 520,
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 10px 10px 16px",
        borderRadius: 999,
        background: "rgba(42, 8, 32, 0.92)",
        border: "1px solid var(--line)",
        boxShadow: "0 8px 30px rgba(0,0,0,.45)",
        backdropFilter: "blur(8px)",
        color: "var(--lace)",
      }}
    >
      <span style={{ flex: 1, fontSize: 14, lineHeight: 1.3 }}>Want this wall at your venue?</span>
      <Link
        href={`/partners?ref=${encodeURIComponent(refTag || "demo-wall")}`}
        className="btn"
        style={{ minHeight: 40, padding: "0 16px", fontSize: 14, whiteSpace: "nowrap" }}
      >
        Become a partner
      </Link>
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss"
        style={{ background: "none", border: 0, color: "var(--lace-dim)", fontSize: 22, lineHeight: 1, padding: "6px 8px", cursor: "pointer" }}
      >
        ×
      </button>
    </div>
  );
}
