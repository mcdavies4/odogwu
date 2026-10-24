import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { clientId } from "@/lib/security";
import { buildReport, hostEvent } from "@/lib/report";
import { naira } from "@/lib/money";
import { Logo } from "@/components/Note";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Spray report · Odogwu", robots: { index: false } };

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Africa/Lagos", hour: "2-digit", minute: "2-digit" });

// The celebrant's record of who sprayed and how much: for thank-yous and keepsakes.
export default async function SprayReport({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;
  const ev = await hostEvent(slug, key, clientId(await headers()));
  if (!ev || !key) notFound();

  const r = await buildReport(ev.id);
  const date = ev.event_date
    ? new Date(ev.event_date + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : null;
  const unsprayed = r.total - r.sprayed;

  return (
    <>
      <header className="topbar no-print">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <Link href={`/h/${ev.slug}?key=${key}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Back to dashboard</Link>
      </header>
      <main className="wrap wrap-wide stack report">
        <div className="report-head">
          <div className="report-brand print-only"><Logo /> Odogwu spray report</div>
          <h1 style={{ fontSize: 32 }}>{ev.title}</h1>
          <p className="muted">{[date, `Spraying ${ev.celebrant_name}`].filter(Boolean).join(" · ")}</p>
        </div>

        <div className="stats report-stats">
          <div className="stat"><b>{naira(r.total)}</b><span>Total gifts</span></div>
          <div className="stat"><b>{r.guests.length}</b><span>{r.guests.length === 1 ? "Guest" : "Guests"}</span></div>
          <div className="stat"><b>{r.packs}</b><span>Spray packs</span></div>
          <div className="stat"><b>{r.guests[0] ? (r.guests[0].anonymous ? "Secret Odogwu 🤫" : r.guests[0].name) : "—"}</b><span>Top sprayer</span></div>
        </div>

        <div className="row no-print">
          <a className="btn" href={`/api/events/${ev.slug}/report?key=${encodeURIComponent(key)}`}>Download spreadsheet</a>
          <PrintButton />
        </div>

        {r.guests.some((g) => g.anonymous) && (
          <p className="small muted">
            🤫 Guests marked &quot;sprayed anonymously&quot; showed as Secret Odogwu on the wall. Only you can see their names here, so please keep them private.
          </p>
        )}
        {unsprayed > 0 && (
          <p className="small muted">
            {naira(unsprayed)} was paid but not swiped on the screen. It&apos;s still yours: every pack is a gift once it&apos;s paid.
          </p>
        )}
        {r.pending > 0 && (
          <p className="small muted no-print">
            {r.pending} {r.pending === 1 ? "pack is" : "packs are"} still waiting for payment (usually a bank transfer that wasn&apos;t completed) and {r.pending === 1 ? "isn't" : "aren't"} counted.
          </p>
        )}

        {r.guests.length === 0 ? (
          <p className="muted">No one has sprayed yet. Your report fills in as guests spray.</p>
        ) : (
          <div className="table-wrap">
            <table className="visits report-table">
              <thead>
                <tr><th>#</th><th>Guest</th><th className="num">Gift</th><th className="num">Packs</th><th>Time</th><th>Email</th></tr>
              </thead>
              <tbody>
                {r.guests.map((g, i) => (
                  <tr key={g.name + i}>
                    <td>{i + 1}</td>
                    <td className="who">
                      {g.name}
                      {g.anonymous && <span className="pill anon">{g.name === "Anonymous" ? "🤫 no name given" : "🤫 sprayed anonymously"}</span>}
                    </td>
                    <td className="num">{naira(g.gift)}</td>
                    <td className="num">{g.packs}</td>
                    <td>{time(g.first)}{g.last !== g.first ? `–${time(g.last)}` : ""}</td>
                    <td className="muted">{g.email ?? ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td></td><td>Total</td><td className="num">{naira(r.total)}</td><td className="num">{r.packs}</td><td></td><td></td></tr>
              </tfoot>
            </table>
          </div>
        )}
        <p className="small muted">Times are Lagos time. Paid through Paystack to {ev.account_name}, {ev.bank_name} ····{ev.account_last4}.</p>
      </main>
    </>
  );
}
