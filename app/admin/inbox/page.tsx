import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { clientId } from "@/lib/security";
import { Logo } from "@/components/Note";
import { HelpDone } from "@/components/HelpDone";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inbox · Odogwu", robots: { index: false } };

type Help = { id: number; topic: string; name: string | null; email: string | null; phone: string | null; event_slug: string | null; reference: string | null; message: string; auto_check: string | null; status: string; created_at: string };
type Incident = { id: number; kind: string; detail: Record<string, unknown>; created_at: string };

const TOPIC: Record<string, string> = { paid: "Paid but can't spray", payout: "Payout", host: "Hosting", wall: "Spray wall", partner: "Partnering", feedback: "Feedback", other: "Other" };

const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Private: /admin/inbox → asks for your ADMIN_KEY. Help requests, and anything that went wrong this week.
export default async function Inbox({ searchParams }: { searchParams: Promise<{ key?: string; all?: string }> }) {
  const { key, all } = await searchParams;
  if (!key) {
    return (
      <main className="wrap stack" style={{ minHeight: "70dvh", alignContent: "center", display: "grid" }}>
        <h1 style={{ fontSize: 28 }}>Odogwu inbox</h1>
        <form className="stack" method="get">
          <label className="field"><span>Admin key</span><input className="input" name="key" type="password" autoComplete="current-password" required /></label>
          <button className="btn">Open</button>
        </form>
      </main>
    );
  }
  if (!(await isAdmin(key, clientId(await headers())))) notFound();
  const k = encodeURIComponent(key);
  const db = supabaseAdmin();
  let q = db.from("help_requests").select("*").order("created_at", { ascending: false }).limit(100);
  if (!all) q = q.eq("status", "open");
  const [{ data: help, error }, { data: incidents }] = await Promise.all([
    q,
    db.from("incidents").select("*").gte("created_at", new Date(Date.now() - 7 * 86400_000).toISOString()).order("created_at", { ascending: false }).limit(100),
  ]);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <div className="topbar-links">
          <Link className="topbar-link keep" href={`/admin/venues?key=${k}`}>Partners</Link>
          <Link className="topbar-link keep" href={`/admin/visits?key=${k}`}>Demo visits</Link>
        </div>
      </header>
      <main className="wrap wrap-wide stack">
        <h1 style={{ fontSize: 30 }}>Inbox</h1>
        {error && <div className="error">Run supabase/automation.sql in Supabase to keep help requests here. They still reach your email.</div>}

        <section className="stack">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 style={{ fontSize: 20 }}>{all ? "All help requests" : "Waiting for a reply"} ({help?.length ?? 0})</h2>
            <Link className="chip" style={{ display: "inline-flex", alignItems: "center" }} href={all ? `/admin/inbox?key=${k}` : `/admin/inbox?key=${k}&all=1`}>{all ? "Only open" : "Show all"}</Link>
          </div>
          {(help ?? []).length === 0 && <p className="muted">Nothing waiting. 🎉</p>}
          {((help ?? []) as Help[]).map((h) => (
            <article key={h.id} className="panel stack" style={{ gap: 8, opacity: h.status === "done" ? 0.6 : 1 }}>
              <div className="row" style={{ justifyContent: "space-between", gap: 8 }}>
                <strong>#{h.id} · {TOPIC[h.topic] ?? h.topic}</strong>
                <span className="small muted">{when(h.created_at)}</span>
              </div>
              <div className="small">
                {h.name || "No name"} · <a href={`mailto:${h.email}?subject=${encodeURIComponent(`Re: your Odogwu help request #${h.id}`)}`}>{h.email}</a>
                {h.phone && <> · <a href={`https://wa.me/${h.phone.replace(/\D/g, "").replace(/^0/, "234")}`}>{h.phone}</a></>}
                {h.event_slug && <> · {h.event_slug}</>}
              </div>
              <p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{h.message}</p>
              {h.auto_check && <div className="small ok">Automatic check: {h.auto_check}</div>}
              <div><HelpDone id={h.id} adminKey={key} done={h.status === "done"} /></div>
            </article>
          ))}
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>What went wrong this week</h2>
          {(incidents ?? []).length === 0 ? <p className="muted">Nothing. 👌</p> : (
            <ul className="list">
              {((incidents ?? []) as Incident[]).map((i) => (
                <li key={i.id}>
                  <span><strong>{i.kind.replace(/_/g, " ")}</strong> <span className="small muted">{JSON.stringify(i.detail).slice(0, 160)}</span></span>
                  <span className="small muted">{when(i.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
