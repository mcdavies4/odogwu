import Link from "next/link";
import { Logo } from "@/components/Note";
import { Footer } from "@/components/Footer";
import { HelpCentre } from "@/components/HelpCentre";
import { faqGroups } from "@/lib/faq";
import { feeFlat, feePercent } from "@/lib/money";
import { COMPANY, COMPANY_ADDRESS, SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = {
  title: "Help · Odogwu",
  description: "Answers for guests, hosts and partners, and a quick check for any spray pack.",
};

const clip = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : undefined);

export default async function Help({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const fee = `${feePercent()}% + ₦${feeFlat().toLocaleString()}`;
  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap stack">
        <div>
          <h1 style={{ fontSize: 34 }}>How can we help?</h1>
          <p className="muted">Most things fix themselves from this page. If not, a real person is a message away.</p>
        </div>
        <HelpCentre
          groups={faqGroups(fee)}
          initial={{ ref: clip(sp.ref, 60), topic: clip(sp.topic, 20), event: clip(sp.event, 80) }}
          supportEmail={SUPPORT_EMAIL}
        />
        <p className="muted small center">{COMPANY}, {COMPANY_ADDRESS}</p>
      </main>
      <Footer />
    </>
  );
}
