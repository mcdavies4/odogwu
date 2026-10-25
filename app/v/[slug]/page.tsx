import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { clientId } from "@/lib/security";
import { siteUrl } from "@/lib/events";
import { earnings, sharePct, venueEvents, venueWithKey } from "@/lib/venues";
import { naira } from "@/lib/money";
import { Logo } from "@/components/Note";
import { Footer } from "@/components/Footer";
import { CopyLink } from "@/components/CopyLink";
import { InstallButton } from "@/components/InstallButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Venue dashboard · Odogwu", robots: { index: false } };

const day = (iso: string | null) =>
  iso ? new Date(iso + (iso.length === 10 ? "T12:00:00" : "")).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

// Private dashboard for an event centre: every celebration created with its link, and what it has earned.
export default async function VenueDashboard({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;
  const venue = await venueWithKey(slug, key, clientId(await headers()));
  if (!venue) notFound();

  const events = (await venueEvents([venue.id])).get(venue.id) ?? [];
  const total = events.reduce((s, e) => s + e.total, 0);
  const earned = earnings(total, venue.share_bps);
  const site = siteUrl();
  const clientLink = `${site}/host/new?venue=${venue.slug}`;

  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap wrap-wide stack">
        <div>
          <p className="step">Partner dashboard</p>
          <h1 style={{ fontSize: 32 }}>{venue.name}</h1>
          {venue.city && <p className="muted">{venue.city}</p>}
        </div>
        <div className="ok small">Bookmark this page. It&apos;s your private venue link.</div>

        <div className="stats report-stats">
          <div className="stat"><b>{events.length}</b><span>Celebrations</span></div>
          <div className="stat"><b>{naira(total)}</b><span>Sprayed at your venue</span></div>
          <div className="stat"><b>{naira(earned)}</b><span>Your earnings ({sharePct(venue.share_bps)}%)</span></div>
          <div className="stat"><b>{events.filter((e) => e.is_open).length}</b><span>Open now</span></div>
        </div>
        <p className="small muted">
          You earn {sharePct(venue.share_bps)}% of every spray pack at celebrations created with your link. Odogwu pays your
          share to you monthly. The money guests spray always goes straight to the celebrant.
        </p>

        <div className="row">
          <a className="btn" href={`/host/new?venue=${venue.slug}`}>Create a celebration for a client</a>
          <a className="btn btn-ghost" href="/demo/wall" target="_blank" rel="noopener">Show clients the demo wall</a>
        </div>
        <CopyLink label="Link for your clients" url={clientLink} note="Send this to couples and hosts so they can set up their own celebration. It still counts towards your share." />

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>Celebrations at {venue.name}</h2>
          {events.length === 0 ? (
            <p className="muted">None yet. Create one above, or send your client link to your next booking.</p>
          ) : (
            <div className="table-wrap">
              <table className="visits">
                <thead><tr><th>Date</th><th>Celebration</th><th>Sprayed</th><th>Your share</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td>{day(e.event_date ?? e.created_at.slice(0, 10))}</td>
                      <td style={{ textTransform: "none" }}>{e.title}</td>
                      <td>{naira(e.total)}</td>
                      <td>{naira(earnings(e.total, venue.share_bps))}</td>
                      <td><span className={`pill ${e.is_open ? "success" : ""}`}>{e.is_open ? "Open" : "Closed"}</span></td>
                      <td><a href={`/e/${e.slug}/wall`} target="_blank" rel="noopener">Spray wall</a></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="small muted">
            To manage a celebration (QR cards, Now dancing, theme, report), use the host link you got when you created it.
            On the device you used, it&apos;s under &quot;Your celebrations&quot; on the Odogwu home page. Guest lists stay
            private to each host.
          </p>
        </section>
        <InstallButton className="btn btn-ghost btn-block" label="Install Odogwu on this device" />
      </main>
      <Footer />
    </>
  );
}
