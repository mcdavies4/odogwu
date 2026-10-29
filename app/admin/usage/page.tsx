import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { clientId } from "@/lib/security";
import { isAdmin } from "@/lib/admin";
import { Logo } from "@/components/Note";
import { IgnoreMe } from "@/components/IgnoreMe";
import { naira } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Site usage · Odogwu", robots: { index: false } };

type Row = { label: string; views: number; visitors?: number };
type Day = { day: string; views: number; visitors: number };
type Report = {
  days: number;
  live_visitors: number;
  today_views: number;
  today_visitors: number;
  views: number;
  visitors: number;
  daily: Day[];
  pages: Row[];
  referrers: Row[];
  sources: Row[];
  countries: Row[];
  cities: Row[];
  devices: Row[];
  celebrations_created: number;
  packs_paid: number;
  packs_value_kobo: number;
  notes_sprayed: number;
};

const RANGES = [7, 30, 90];
const num = (v: number) => Number(v || 0).toLocaleString("en-GB");
const shortDay = (iso: string) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export default async function Usage({ searchParams }: { searchParams: Promise<{ key?: string; days?: string }> }) {
  const { key, days } = await searchParams;
  if (!(await isAdmin(key, clientId(await headers())))) notFound();

  const range = RANGES.includes(Number(days)) ? Number(days) : 7;
  const k = encodeURIComponent(key || "");

  const { data, error } = await supabaseAdmin().rpc("usage_report", { p_days: range });
  const r = (data ?? null) as Report | null;

  const nav = (
    <header className="topbar">
      <Link href="/" className="brand"><Logo />Odogwu</Link>
      <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link href={`/admin/users?key=${k}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Users</Link>
        <Link href={`/admin/visits?key=${k}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Demo visits</Link>
        <Link href={`/admin/venues?key=${k}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Partners</Link>
        <Link href={`/admin/inbox?key=${k}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Inbox</Link>
      </nav>
    </header>
  );

  if (error || !r) {
    return (
      <>
        {nav}
        <main className="wrap wrap-wide stack">
          <h1 style={{ fontSize: 30 }}>Site usage</h1>
          <div className="error">
            Couldn&apos;t load usage. Run supabase/usage.sql in Supabase → SQL Editor first.
            {error ? ` (${error.message})` : ""}
          </div>
        </main>
      </>
    );
  }

  const maxViews = Math.max(1, ...r.daily.map((d) => d.views));
  const perVisitor = r.visitors ? (r.views / r.visitors).toFixed(1) : "—";
  const empty = r.views === 0;

  return (
    <>
      {nav}
      <main className="wrap wrap-wide stack">
        <div className="stack" style={{ gap: 6 }}>
          <p className="step">Admin · Traffic</p>
          <h1 style={{ fontSize: 30 }}>Site usage</h1>
          <p className="muted">Who is visiting Odogwu, from where, and what they look at. Times are UK time.</p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {RANGES.map((n) => (
            <Link
              key={n}
              href={`/admin/usage?key=${k}&days=${n}`}
              className={n === range ? "btn" : "btn btn-ghost"}
              style={{ minHeight: 40 }}
            >
              Last {n} days
            </Link>
          ))}
        </div>

        <div className="stats">
          <div className="stat"><b>{num(r.live_visitors)}</b><span>On the site now (last 30 min)</span></div>
          <div className="stat"><b>{num(r.today_visitors)}</b><span>Visitors today · {num(r.today_views)} views</span></div>
          <div className="stat"><b>{num(r.visitors)}</b><span>Visitors, last {range} days</span></div>
          <div className="stat"><b>{num(r.views)}</b><span>Page views · {perVisitor} per visitor</span></div>
        </div>

        <section className="panel stack">
          <h2 style={{ fontSize: 20 }}>Traffic by day</h2>
          {empty ? (
            <p className="muted">
              No page views recorded yet. Views appear here a couple of seconds after someone opens the site.
              Open the site in another browser to test it.
            </p>
          ) : (
            <>
              <div
                role="img"
                aria-label={`Daily page views and visitors for the last ${range} days. Busiest day had ${num(maxViews)} views.`}
                style={{ display: "flex", alignItems: "flex-end", gap: range > 30 ? 1 : 3, height: 150 }}
              >
                {r.daily.map((d) => (
                  <div
                    key={d.day}
                    title={`${shortDay(d.day)}: ${num(d.views)} views, ${num(d.visitors)} visitors`}
                    style={{ flex: 1, height: "100%", position: "relative", display: "flex", alignItems: "flex-end" }}
                  >
                    <div style={{ width: "100%", height: `${(d.views / maxViews) * 100}%`, minHeight: d.views ? 2 : 0, background: "var(--gold)", opacity: 0.35, borderRadius: "3px 3px 0 0" }} />
                    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: `${(d.visitors / maxViews) * 100}%`, minHeight: d.visitors ? 2 : 0, background: "var(--gold)", borderRadius: "3px 3px 0 0" }} />
                  </div>
                ))}
              </div>
              <div className="small muted" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>{shortDay(r.daily[0].day)}</span>
                <span>{shortDay(r.daily[r.daily.length - 1].day)}</span>
              </div>
              <p className="small muted">
                <span style={{ color: "var(--gold)" }}>■</span> Visitors &nbsp;
                <span style={{ color: "var(--gold)", opacity: 0.45 }}>■</span> Page views. Tap or hover a bar for the numbers.
              </p>
              <details>
                <summary className="small">Show as a table</summary>
                <div className="table-wrap">
                  <table className="visits">
                    <thead><tr><th>Day</th><th>Visitors</th><th>Page views</th></tr></thead>
                    <tbody>
                      {[...r.daily].reverse().map((d) => (
                        <tr key={d.day}><td>{shortDay(d.day)}</td><td>{num(d.visitors)}</td><td>{num(d.views)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </>
          )}
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>What people did, last {range} days</h2>
          <div className="stats">
            <div className="stat"><b>{num(r.celebrations_created)}</b><span>Celebrations created</span></div>
            <div className="stat"><b>{num(r.packs_paid)}</b><span>Spray packs paid</span></div>
            <div className="stat"><b>{naira(r.packs_value_kobo / 100)}</b><span>Value of packs paid</span></div>
            <div className="stat"><b>{num(r.notes_sprayed)}</b><span>Notes sprayed</span></div>
          </div>
          <p className="small muted">
            These come straight from your events, payments and sprays, not from tracking, so they are exact.
            Pack value is what guests paid, not your revenue.
          </p>
        </section>

        <BarList title="Top pages" rows={r.pages} showVisitors empty={empty} />
        <BarList title="Where visitors came from" note="The site they clicked from. Links shared in WhatsApp or typed in often show as Direct." rows={r.referrers} empty={empty} />
        {r.sources.length > 0 && (
          <BarList title="Tagged links" note="Links with ?utm_source= or ?ref= on the end, such as your venue links." rows={r.sources} empty={empty} />
        )}
        <BarList title="Countries" rows={r.countries} empty={empty} />
        <BarList title="Cities" rows={r.cities} empty={empty} />
        <BarList title="Devices" rows={r.devices} empty={empty} />

        <IgnoreMe />

        <p className="small muted">
          Data notes: counts come from Odogwu&apos;s own anonymous page-view log, so they will differ from Vercel Analytics
          (which counts differently and keeps its own numbers). A visitor is an anonymous code that resets every UK day, so
          someone who returns on three days counts three times. Link-preview bots and crawlers are skipped, as are visitors
          using a browser that blocks scripts or has been switched off above. Page paths are stored without celebration
          names or keys, and views are deleted after 180 days.
        </p>
      </main>
    </>
  );
}

function BarList({ title, note, rows, showVisitors, empty }: { title: string; note?: string; rows: Row[]; showVisitors?: boolean; empty?: boolean }) {
  const max = Math.max(1, ...rows.map((x) => x.views));
  return (
    <section className="panel stack">
      <h2 style={{ fontSize: 20 }}>{title}</h2>
      {note && <p className="small muted">{note}</p>}
      {rows.length === 0 ? (
        <p className="muted">{empty ? "Nothing recorded yet." : "Nothing in this period."}</p>
      ) : (
        <ul className="list">
          {rows.map((row) => (
            <li key={row.label} style={{ position: "relative", alignItems: "center" }}>
              <span
                aria-hidden
                style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: `${(row.views / max) * 100}%`, background: "var(--gold)", opacity: 0.14, borderRadius: 6 }}
              />
              <span style={{ position: "relative", wordBreak: "break-word", paddingLeft: 6 }}>{row.label}</span>
              <span style={{ position: "relative", whiteSpace: "nowrap" }}>
                <strong>{num(row.views)}</strong>
                {showVisitors && row.visitors !== undefined && <span className="muted small"> · {num(row.visitors)} visitors</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
