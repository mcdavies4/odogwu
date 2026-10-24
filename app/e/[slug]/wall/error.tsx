"use client";
import { useEffect, useState } from "react";

// If the projector wall ever crashes mid-party, it reloads itself instead of sitting blank.
export default function WallError({ error }: { error: Error }) {
  const [secs, setSecs] = useState(8);
  useEffect(() => {
    console.error(error);
    const t = setInterval(() => setSecs((s) => s - 1), 1000);
    const r = setTimeout(() => window.location.reload(), 8000);
    return () => { clearInterval(t); clearTimeout(r); };
  }, [error]);
  return (
    <main className="wall pattern" style={{ display: "grid", placeItems: "center", textAlign: "center" }}>
      <div>
        <h1 style={{ fontSize: 40 }}>Reconnecting the spray wall…</h1>
        <p className="muted" style={{ marginTop: 12 }}>Back in {Math.max(0, secs)} seconds. No sprays are lost.</p>
      </div>
    </main>
  );
}
