import Link from "next/link";
import { Logo } from "@/components/Note";
import { RecapPlayer, type RecapSummary } from "@/components/RecapPlayer";

export const metadata = { title: "Highlight reel demo · Odogwu" };

const SAMPLE: RecapSummary = {
  title: "Tolu & Chidi's wedding",
  celebrant: "the couple",
  date: "14 November 2026",
  venue: "Eko Grand Hall",
  total: 1_284_500,
  guests: 146,
  notes: 3_912,
  packs: 212,
  top: [
    { name: "Chief Emeka", amount: 250_000 },
    { name: "Secret Odogwu 🤫", amount: 180_000 },
    { name: "Aunty Ngozi 🇬🇧", amount: 95_000 },
  ],
  flags: ["🇳🇬", "🇬🇧", "🇺🇸", "🇨🇦", "🇮🇪"],
};

export default function DemoRecap() {
  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap stack">
        <div>
          <h1 style={{ fontSize: 30 }}>Highlight reel</h1>
          <p className="muted">Every celebration gets one. This is a pretend wedding; hosts get theirs from their dashboard.</p>
        </div>
        <RecapPlayer summary={SAMPLE} />
      </main>
    </>
  );
}
