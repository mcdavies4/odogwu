"use client";
import { useEffect } from "react";

/** Logs one visit per page per browser tab, tagged with the ?ref= from the link. */
export function TrackVisit({ page, refTag }: { page: "wall" | "spray"; refTag?: string }) {
  useEffect(() => {
    const key = `odogwu:tracked:${page}:${refTag ?? ""}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    // Small delay so instant bounces and link scanners that run JS briefly aren't counted.
    const t = setTimeout(() => {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, ref: refTag }),
        keepalive: true,
      }).catch(() => {});
    }, 2500);
    return () => clearTimeout(t);
  }, [page, refTag]);
  return null;
}
