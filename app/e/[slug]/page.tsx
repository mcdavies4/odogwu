import { notFound } from "next/navigation";
import { getPublicEvent } from "@/lib/events";
import { feePercent } from "@/lib/money";
import { GuestPay } from "@/components/GuestPay";
import { Logo } from "@/components/Note";
import { Footer } from "@/components/Footer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getPublicEvent(slug);
  return ev ? { title: `Spray ${ev.celebrant_name} · Odogwu`, description: `${ev.title} — spray from your phone.` } : {};
}

export default async function GuestPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getPublicEvent(slug);
  if (!ev) notFound();

  const date = ev.event_date
    ? new Date(ev.event_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    : null;

  return (
    <>
    <main className="wrap stack">
      <div className="brand"><Logo />Odogwu</div>
      <div>
        <h1 style={{ fontSize: 32 }}>{ev.title}</h1>
        {date && <p className="muted">{date}</p>}
      </div>
      <div className="ok small">
        Money goes to <strong>{ev.account_name}</strong> ({ev.bank_name}), checked with the bank.
      </div>
      {ev.is_open ? (
        <GuestPay slug={ev.slug} celebrant={ev.celebrant_name} feePct={feePercent()} />
      ) : (
        <div className="panel"><p>Spraying has closed for this celebration. Thank you for coming!</p></div>
      )}
    </main>
    <Footer />
    </>
  );
}
