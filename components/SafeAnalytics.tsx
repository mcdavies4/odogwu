"use client";
import { Analytics } from "@vercel/analytics/next";

const PRIVATE_PARAMS = ["key", "reference", "trxref"];

/** Vercel Analytics, with private keys and payment references removed before anything is sent. */
export function SafeAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const url = new URL(event.url);
          if (url.pathname.startsWith("/admin")) return null;
          PRIVATE_PARAMS.forEach((p) => url.searchParams.delete(p));
          return { ...event, url: url.toString() };
        } catch {
          return event;
        }
      }}
    />
  );
}
