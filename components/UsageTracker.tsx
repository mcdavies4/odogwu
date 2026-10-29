"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export function UsageTracker() {
  const pathname = usePathname();
  const lastSent = useRef<string | null>(null);
  const firstPage = useRef(true);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/notes-render")) return;
    try {
      if (localStorage.getItem("odogwu:notrack")) return;
    } catch {}

    const t = setTimeout(() => {
      if (lastSent.current === pathname) return;
      lastSent.current = pathname;

      const params = new URLSearchParams(window.location.search);
      const source = params.get("utm_source") || params.get("ref") || "";
      const referrer = firstPage.current ? document.referrer : "";
      firstPage.current = false;

      fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname, referrer, source }),
        keepalive: true,
      }).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [pathname]);

  return null;
}
