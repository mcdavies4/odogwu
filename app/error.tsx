"use client";
import { useEffect } from "react";

// Shown if any page crashes, instead of a blank screen.
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="wrap stack center" style={{ minHeight: "100dvh", display: "grid", alignContent: "center", justifyItems: "center" }}>
      <h1 style={{ fontSize: 28 }}>Something went wrong</h1>
      <p className="muted">Nothing was charged. Try again, and if it keeps happening, refresh the page.</p>
      <button className="btn" onClick={() => reset()}>Try again</button>
      <a href="/help" className="btn btn-ghost">Get help</a>
    </main>
  );
}
