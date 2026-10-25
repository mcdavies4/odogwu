import Link from "next/link";
import { Footer } from "@/components/Footer";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { clientId } from "@/lib/security";
import { buildReport, hostEvent } from "@/lib/report";
import { getPublicEvent, siteUrl } from "@/lib/events";
import { naira, themePrice } from "@/lib/money";
import { themeOf } from "@/lib/themes";
import { Logo } from "@/components/Note";
import { ShareQR } from "@/components/ShareQR";
import { ToggleOpen } from "@/components/ToggleOpen";
import { InstallButton } from "@/components/InstallButton";
import { RememberHost } from "@/components/MyCelebrations";
import { NowDancing } from "@/components/NowDancing";
import { ThemePicker } from "@/components/ThemePicker";
import { CopyLink } from "@/components/CopyLink";
import { ABROAD_ENABLED } from "@/lib/flags";
import { Rehearsal } from "@/components/Rehearsal";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

type Payment = { reference: string; guest_name: string; amount_kobo: number; status: string; created_at: string; paid_at: string | null; private_name?: string | null };

export default async function HostDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;
  const db = supabaseAdmin();
  const ev = await hostEvent(slug, key, clientId(await headers()));
  if (!ev || !key) notFound();

  const { data: payments } = await db
    .from("payments")
    .select("*")
    .eq("event_id", ev.id)
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(200);

  // Totals come from the full report so they stay right past 1,000 sprays.
  const report = await buildReport(ev.id);
  const pub = await getPublicEvent(slug);
  const totalNaira = report.total;
  const guests = report.guests.length;
  const guestUrl = `${siteUrl()}/e/${ev.slug}`;
  const k = encodeURIComponent(key);
  const featuresReady = ev.theme !== undefined; // supabase/features.sql has been run

  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap stack">
        <RememberHost slug={ev.slug} hostKey={key} title={ev.title} />
        <div>
          <h1 style={{ fontSize: 30 }}>{ev.title}</h1>
          <p className="muted">
            Paying out to {ev.account_name} · {ev.bank_name} ····{ev.account_last4}
          </p>
          {pub?.venue_name && <p className="venue-tag" style={{ marginTop: 10 }}>📍 At {pub.venue_name}</p>}
        </div>

        <div className="ok small">
          Bookmark this page. It&apos;s your private host link, and anyone with it can manage this celebration.
        </div>

        <Rehearsal slug={ev.slug} hostKey={key} payee={ev.account_name} bank={ev.bank_name} />

        <div className="stats">
          <div className="stat"><b>{naira(totalNaira)}</b><span>Received</span></div>
          <div className="stat"><b>{guests}</b><span>{guests === 1 ? "Guest" : "Guests"} sprayed</span></div>
        </div>
        <p className="small muted">
          Paystack pays this to your bank the next working day. Money from a Saturday party arrives on Monday.
        </p>

        {ev.is_open ? <ShareQR url={guestUrl} title={ev.celebrant_name} /> : <div className="error">Spraying is closed. Guests can&apos;t buy new packs.</div>}

        <div className="row">
          <Link className="btn" href={`/e/${ev.slug}/wall`} target="_blank">Open spray wall</Link>
          <ToggleOpen slug={ev.slug} hostKey={key} open={ev.is_open} />
        </div>
        <p className="small muted">Put the spray wall on a projector or TV. It updates live as guests spray.</p>

        <div className="tool-grid">
          <Link className="tool" href={`/h/${ev.slug}/cards?key=${k}`}><span>🖨️</span><strong>Table cards</strong><small>Print QR cards for every table</small></Link>
          <Link className="tool" href={`/h/${ev.slug}/report?key=${k}`}><span>📋</span><strong>Spray report</strong><small>Who sprayed and how much</small></Link>
          <Link className="tool" href={`/h/${ev.slug}/recap?key=${k}`}><span>🎬</span><strong>Highlight reel</strong><small>A 20-second video to post</small></Link>
          <Link className="tool" href={`/h/${ev.slug}/mc?key=${k}`}><span>🎤</span><strong>MC kit</strong><small>Script and entrance poster</small></Link>
          <Link className="tool" href={`/e/${ev.slug}/wall`} target="_blank"><span>📺</span><strong>Spray wall</strong><small>For the projector or TV</small></Link>
        </div>

        {featuresReady ? (
          <>
            <NowDancing slug={ev.slug} hostKey={key} initial={ev.now_dancing ?? null} />
            <ThemePicker slug={ev.slug} hostKey={key} initial={themeOf(ev.theme)} unlocked={Boolean(ev.themes_unlocked)} price={themePrice()} />
          </>
        ) : (
          <div className="panel small muted">
            Now dancing and wall themes switch on once <code>supabase/features.sql</code> has been run in Supabase.
          </div>
        )}

        {ABROAD_ENABLED && <section className="panel stack">
          <div>
            <h2 style={{ fontSize: 20 }}>✈️ Family abroad can spray too</h2>
            <p className="small muted">
              Send them the guest link. They pick their country, pay with a foreign card, and their flag shows next to their
              name on the wall. They can watch the wall live from the same page.
            </p>
          </div>
          <CopyLink label="Guest link" url={guestUrl} />
        </section>}

        <InstallButton className="btn btn-ghost btn-block" label="Install Odogwu on this phone" />

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>Latest spray packs</h2>
          {(payments?.length ?? 0) === 0 ? (
            <p className="muted">No one has sprayed yet. Share the QR code to get things going.</p>
          ) : (
            <ul className="list">
              {(payments as Payment[]).map((p) => (
                <li key={p.reference}>
                  <span>
                    {p.guest_name === "Anonymous" ? `🤫 ${p.private_name || "Anonymous"}` : p.guest_name}
                    <span className={`pill ${p.status}`}>{p.status === "success" ? "Paid" : "Waiting"}</span>
                  </span>
                  <strong>{naira(Number(p.amount_kobo) / 100)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
