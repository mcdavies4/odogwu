import Link from "next/link";

export default function NotFound() {
  return (
    <main className="wrap stack center" style={{ minHeight: "100dvh", display: "grid", alignContent: "center" }}>
      <h1 style={{ fontSize: 28 }}>We can&apos;t find that celebration</h1>
      <p className="muted">Check the link or scan the QR code again. Host links only work with the full private address.</p>
      <Link className="btn" href="/">Go to Odogwu</Link>
    </main>
  );
}
