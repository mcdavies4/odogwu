"use client";
import { useEffect, useState } from "react";
import type { ThemeId } from "./themes";

export type Live = { open: boolean; nowDancing: string | null; theme: ThemeId };

/** Polls /live/[slug] for who's dancing, the wall theme and whether spraying is open. */
export function useLive(slug: string | null, initial: Live, everyMs = 5000): Live {
  const [live, setLive] = useState<Live>(initial);
  useEffect(() => {
    if (!slug) return;
    let stop = false;
    async function tick() {
      try {
        const r = await fetch(`/live/${slug}`);
        if (r.ok && !stop) {
          const d = await r.json();
          setLive((prev) =>
            prev.open === d.open && prev.nowDancing === d.nowDancing && prev.theme === d.theme ? prev : d
          );
        }
      } catch {
        // offline for a moment; try again next tick
      }
    }
    const iv = setInterval(tick, everyMs);
    return () => { stop = true; clearInterval(iv); };
  }, [slug, everyMs]);
  return live;
}
