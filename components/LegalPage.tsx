import Link from "next/link";
import { Logo } from "./Note";
import { Footer } from "./Footer";
import { LEGAL_UPDATED } from "@/lib/contact";

/** Shared layout for Terms, Privacy and Contact. */
export function LegalPage({ title, intro, children, dated = true }: {
  title: string;
  intro?: React.ReactNode;
  children: React.ReactNode;
  dated?: boolean;
}) {
  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap legal">
        <h1>{title}</h1>
        {dated && <p className="muted small">Last updated {LEGAL_UPDATED}</p>}
        {intro && <div className="legal-intro">{intro}</div>}
        {children}
      </main>
      <Footer />
    </>
  );
}
