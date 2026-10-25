import Link from "next/link";
import { confirmThemePayment } from "@/lib/themePayments";
import { Logo } from "@/components/Note";
import { BackToDashboard } from "@/components/BackToDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Themes unlocked · Odogwu", robots: { index: false } };

function cleanRef(v: string | string[] | undefined): string {
  const list = Array.isArray(v) ? v : v ? [v] : [];
  for (const item of list) {
    const ref = item.split("?")[0].trim();
    if (/^odt_[A-Za-z0-9_-]{4,100}$/.test(ref)) return ref;
  }
  return "";
}

// Paystack sends the host back here after paying for premium wall themes.
export default async function ThemesPaid({ searchParams }: { searchParams: Promise<{ reference?: string | string[]; trxref?: string | string[] }> }) {
  const sp = await searchParams;
  const reference = cleanRef(sp.reference) || cleanRef(sp.trxref);
  let result: { status: "success" | "pending" | "failed"; slug: string | null } = { status: "failed", slug: null };
  if (reference) {
    try {
      result = await confirmThemePayment(reference);
    } catch {
      result = { status: "pending", slug: null };
    }
  }

  const heading =
    result.status === "success" ? "Themes unlocked! 🎨" :
    result.status === "pending" ? "Payment still processing" :
    "That payment didn't go through";
  const text =
    result.status === "success" ? "Every wall theme is now available for your celebration. Pick one on your dashboard." :
    result.status === "pending" ? "Paid by bank transfer? It can take a minute. Your themes unlock automatically once it arrives." :
    "No money was taken. You can try again from your dashboard.";

  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap stack center" style={{ minHeight: "70dvh", display: "grid", alignContent: "center", justifyItems: "center" }}>
        <h1 style={{ fontSize: 28 }}>{heading}</h1>
        <p className="muted">{text}</p>
        <BackToDashboard slug={result.slug} />
      </main>
    </>
  );
}
