"use client";
import { useEffect, useState } from "react";

/** Finds the host's private dashboard link saved on this phone, so we never put the key in a payment URL. */
export function BackToDashboard({ slug }: { slug: string | null }) {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    if (!slug) return;
    try {
      const list = JSON.parse(localStorage.getItem("odogwu:hosted") || "[]") as { slug: string; key: string }[];
      const hit = list.find((h) => h.slug === slug);
      if (hit) setHref(`/h/${hit.slug}?key=${encodeURIComponent(hit.key)}`);
    } catch {}
  }, [slug]);
  if (href) return <a className="btn" href={href}>Back to your dashboard</a>;
  return <p className="small muted">Open your celebration from the private host link you saved, or from &quot;Your celebrations&quot; on the Odogwu home page.</p>;
}
