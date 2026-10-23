import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { siteUrl } from "@/lib/events";
import { Logo } from "@/components/Note";
import { LinkMaker } from "@/components/LinkMaker";

export const dynamic = "force-dynamic";
export const metadata = { title: "Demo visits · Odogwu", robots: { index: false } };

type Visit = { id: number; ref: string | null; page: string; country: string | null; city: string | null; device: string | null; created_at: string };

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Europe/London", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const place = (v: Visit) => [v.city, v.country].filter(Boolean).join(", ") || "Unknown";
const venueName = (ref: string | null) => (ref ? ref.replace(/-/g, " ") : "Untagged link");

// Private: open /admin/visits?key=YOUR_ADMIN_KEY (set ADMIN_KEY in Vercel).
export default async function Visits({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  const adminKey = process.env.ADMIN_KEY;
  if (!adminKey || !key || key !== adminKey) notFound();

  const { data, error } = await supabaseAdmin()
    .from("demo_visits")
    .select("id,ref,page,country,city,device,created_at")
    .order("created_at", { ascending: false })
    .limit(2000);
  const visits = (data ?? []) as Visit[];

  // One row per venue: how many opens of each page, and when they last looked.
  const byVenue = new Map<string, { ref: string | null; wall: number; spray: number; last: string; where: string; device: string }>();
  for (const v of visits) {
    const k = v.ref ?? "";
    const row = byVenue.get(k) ?? { ref: v.ref, wall: 0, spray: 0, last: v.created_at, where: place(v), device: v.device ?? "" };
    if (v.page === "wall") row.wall++; else row.spray++;
    byVenue.set(k, row);
  }
  const venues = [...byVenue.values()].sort((a, b) => (a.last < b.last ? 1 : -1));

  return (
    <>
      <header className="topbar"><Link href="/" className="brand"><Logo />Odogwu</Link></header>
      <main className="wrap wrap-wide stack">
        <h1 style={{ fontSize: 30 }}>Who opened the demo</h1>
        {error && <div className="error">Couldn&apos;t load visits. Run supabase/demo-visits.sql in Supabase first.</div>}

        <div className="stats">
          <div className="stat"><b>{venues.filter((v) => v.ref).length}</b><span>Venues that opened it</span></div>
          <div className="stat"><b>{visits.length}</b><span>Total opens</span></div>
        </div>

        <LinkMaker site={siteUrl()} />

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>By venue</h2>
          {venues.length === 0 ? (
            <p className="muted">No one has opened a demo link yet. Opens show up here within a few seconds.</p>
          ) : (
            <div className="table-wrap">
              <table className="visits">
                <thead><tr><th>Venue</th><th>Spray wall</th><th>Phone demo</th><th>Last opened (UK time)</th><th>From</th></tr></thead>
                <tbody>
                  {venues.map((v) => (
                    <tr key={v.ref ?? "_"} className={v.ref ? "" : "untagged"}>
                      <td>{venueName(v.ref)}</td><td>{v.wall}</td><td>{v.spray}</td><td>{when(v.last)}</td><td>{v.where}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>Latest opens</h2>
          <ul className="list">
            {visits.slice(0, 40).map((v) => (
              <li key={v.id}>
                <span>
                  <strong style={{ textTransform: v.ref ? "capitalize" : "none" }}>{venueName(v.ref)}</strong> opened the {v.page === "wall" ? "spray wall" : "phone demo"}
                  <span className="muted small"> · {place(v)} · {v.device}</span>
                </span>
                <span className="muted small">{when(v.created_at)}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
