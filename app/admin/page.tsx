import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Logo } from "@/components/Note";
import { naira } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin dashboard · Odogwu", robots: { index: false, follow: false } };

export default async function AdminDashboard() {
  if (!(await hasAdminSession())) redirect("/admin/login");

  const db = supabaseAdmin();
  const [eventsResult, paymentsResult, venuesResult] = await Promise.all([
    db.from("events").select("id,slug,title,celebrant_name,event_date,is_open,host_phone,created_at").order("created_at", { ascending: false }).limit(1000),
    db.from("payments").select("id,event_id,guest_name,guest_email,amount_kobo,status,created_at,paid_at").order("created_at", { ascending: false }).limit(5000),
    db.from("venues").select("id,name,email,phone,kind,city,created_at").order("created_at", { ascending: false }).limit(1000),
  ]);
  const events = eventsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const partners = venuesResult.data ?? [];
  const successful = payments.filter((p) => p.status === "success");
  const totalKobo = successful.reduce((sum, p) => sum + Number(p.amount_kobo || 0), 0);
  const guestCount = new Set(successful.map((p) => String(p.guest_email ?? "").trim().toLowerCase()).filter(Boolean)).size;
  const hosts = new Set(events.map((e) => String(e.host_phone ?? "").trim()).filter(Boolean)).size;

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <form action="/api/admin/logout" method="post"><button className="btn btn-ghost" type="submit">Log out</button></form>
      </header>
      <main className="wrap wrap-wide stack">
        <div className="stack" style={{ gap: 4 }}>
          <p className="small muted" style={{ margin: 0 }}>PRIVATE ADMIN AREA</p>
          <h1 style={{ fontSize: 32, margin: 0 }}>Odogwu overview</h1>
          <p className="muted">Monitor activity across guests, hosts, events and partner sign-ups.</p>
        </div>
        {(eventsResult.error || paymentsResult.error || venuesResult.error) && <div className="error">Some dashboard data could not be loaded. Check Supabase table access and schema.</div>}
        <section className="stats">
          <div className="stat"><b>{guestCount}</b><span>Guest emails with successful payments</span></div>
          <div className="stat"><b>{hosts}</b><span>Hosts identified by phone number</span></div>
          <div className="stat"><b>{events.length}</b><span>Events loaded</span></div>
          <div className="stat"><b>{partners.length}</b><span>Venue / planner partners</span></div>
          <div className="stat"><b>{successful.length}</b><span>Successful payments</span></div>
          <div className="stat"><b>{naira(totalKobo / 100)}</b><span>Successful payment value</span></div>
        </section>
        <section className="panel stack">
          <h2 style={{ fontSize: 21, margin: 0 }}>User intelligence</h2>
          <p className="muted" style={{ margin: 0 }}>Open the directory to inspect known guest emails, hosts and partners. Roles can overlap; guests are only counted when their email is available on a successful payment.</p>
          <div className="row" style={{ flexWrap: "wrap" }}>
            <Link className="btn" href="/admin/users">Open user directory</Link>
            <Link className="btn btn-ghost" href="/admin/inbox">Support inbox</Link>
            <Link className="btn btn-ghost" href="/admin/venues">Partners</Link>
            <Link className="btn btn-ghost" href="/admin/visits">Demo visits</Link>
          </div>
          <p className="small muted" style={{ marginBottom: 0 }}>The legacy Inbox, Partners and Demo visits pages may still ask for the existing admin key. This login securely protects this dashboard and the user directory.</p>
        </section>
        <section className="stack">
          <h2 style={{ fontSize: 21 }}>Recent events</h2>
          {events.length === 0 ? <p className="muted">No events found.</p> : (
            <div className="table-wrap"><table className="visits"><thead><tr><th>Event</th><th>Celebrant</th><th>Date</th><th>Status</th><th>Created</th></tr></thead><tbody>
              {events.slice(0, 20).map((event) => <tr key={event.id}><td>{event.title}<div className="small muted">{event.slug}</div></td><td>{event.celebrant_name}</td><td>{event.event_date || "—"}</td><td>{event.is_open ? "Open" : "Closed"}</td><td>{new Date(event.created_at).toLocaleDateString("en-GB")}</td></tr>)}
            </tbody></table></div>
          )}
        </section>
      </main>
    </>
  );
}
