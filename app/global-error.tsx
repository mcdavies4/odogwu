"use client";

// Last-resort screen if the whole app fails to load.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#2a0820", color: "#fcefd9", fontFamily: "system-ui, sans-serif", textAlign: "center", padding: 16 }}>
        <main>
          <h1 style={{ fontSize: 26 }}>Something went wrong</h1>
          <p style={{ color: "#d9c3b3" }}>Refresh the page to carry on.</p>
          <button onClick={() => reset()} style={{ minHeight: 52, padding: "0 24px", borderRadius: 999, border: 0, background: "#f2b705", color: "#2a0820", fontWeight: 700, fontSize: 16 }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
