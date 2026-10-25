import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { clientId } from "@/lib/security";
import { isAdmin } from "@/lib/admin";
import { siteUrl } from "@/lib/events";
import { earnings, sharePct, venueEvents, type Venue } from "@/lib/venues";
import { naira } from "@/lib/money";
import { Logo } from "@/components/Note";
import { ShareEdit } from "@/components/ShareEdit";
import { VenueAdmin } from "@/components/VenueAdmin";
import { CopyLink } from "@/components/CopyLink";

export const dynamic = "force-dynamic";
export const metadata = { title: "Venue partners · Odogwu", robots: { index: false } };

// Private: /admin/venues?key=YOUR_ADMIN_KEY
export default async function VenuesAdmin({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!(await isAdmin(key, clientId(await headers())))) notFound();

  const { data, error } = await supabaseAdmin().from("venues").select("*").order("created_at", { ascending: false });
  const venues = (data ?? []) as Venue[];
  const byVenue = await venueEvents(venues.map((v) => v.id)).catch(() => new Map());
  const site = siteUrl();

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <Link href={`/admin/visits?key=${encodeURIComponent(key!)}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Demo visits</Link>
      </header>
      <main className="wrap wrap-wide stack">
        <h1 style={{ fontSize: 30 }}>Partners</h1>
        <p className="muted small">Venues and planners can sign themselves up at /partners. Add one by hand below if you need to.</p>
        {error && <div className="error">Couldn&apos;t load venues. Run supabase/features.sql in Supabase first.</div>}
        <VenueAdmin adminKey={key!} />

        {venues.length === 0 ? (
          <p className="muted">No venues yet. Add your first event centre above.</p>
        ) : (
          <div className="table-wrap">
            <table className="visits">
              <thead><tr><th>Venue</th><th>Share</th><th>Celebrations</th><th>Sprayed</th><th>You owe them</th><th>Contact</th></tr></thead>
              <tbody>
                {venues.map((v) => {
                  const evs = byVenue.get(v.id) ?? [];
                  const total = evs.reduce((s: number, e: { total: number }) => s + e.total, 0);
                  return (
                    <tr key={v.id}>
                      <td>{v.name}{v.city ? `, ${v.city}` : ""}{(v as Venue & { kind?: string; source?: string }).kind === "planner" ? " · planner" : ""}{(v as Venue & { source?: string }).source === "self" ? " · signed up" : ""}</td>
                      <td><ShareEdit slug={v.slug} adminKey={key!} pct={sharePct(v.share_bps)} /></td>
                      <td>{evs.length}</td>
                      <td>{naira(total)}</td>
                      <td><strong>{naira(earnings(total, v.share_bps))}</strong></td>
                      <td>{v.contact ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="small muted">&quot;You owe them&quot; is all-time. Pay venues from your own Paystack balance (your fee income), for example monthly, and keep a note of what you&apos;ve paid.</p>

        {venues.length > 0 && (
          <details className="panel">
            <summary><strong>Venue links</strong></summary>
            <div className="stack" style={{ marginTop: 12 }}>
              {venues.map((v) => (
                <div key={v.id} className="stack">
                  <strong>{v.name}</strong>
                  <CopyLink label="Private dashboard" url={`${site}/v/${v.slug}?key=${v.venue_key}`} />
                  <CopyLink label="Client link" url={`${site}/host/new?venue=${v.slug}`} />
                </div>
              ))}
            </div>
          </details>
        )}
      </main>
    </>
  );
}
