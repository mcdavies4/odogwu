import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-session";
import { supabaseAdmin } from "@/lib/supabase-server";
import { Logo } from "@/components/Note";

export const dynamic = "force-dynamic";
export const metadata = { title: "User directory · Odogwu", robots: { index: false, follow: false } };

type UserRow = { id: string; name: string; email: string; roles: string[]; detail: string; createdAt: string | null };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ q?: string; role?: string }> }) {
  if (!(await hasAdminSession())) redirect("/admin/login");
  const { q = "", role = "all" } = await searchParams;
  const db = supabaseAdmin();
  const [eventsResult, paymentsResult, partnersResult] = await Promise.all([
    db.from("events").select("id,slug,title,celebrant_name,event_date,host_phone,created_at").order("created_at", { ascending: false }).limit(5000),
    db.from("payments").select("id,event_id,guest_name,guest_email,status,created_at,paid_at").order("created_at", { ascending: false }).limit(10000),
    db.from("venues").select("id,name,email,phone,kind,city,created_at").order("created_at", { ascending: false }).limit(5000),
  ]);
  const users = new Map<string, UserRow>();

  for (const p of paymentsResult.data ?? []) {
    if (p.status !== "success") continue;
    const email = String(p.guest_email ?? "").trim().toLowerCase();
    if (!email) continue;
    const id = `email:${email}`;
    const row = users.get(id) ?? { id, name: String(p.guest_name ?? "Guest"), email, roles: [], detail: "Guest checkout · successful payment", createdAt: p.created_at ?? null };
    if (!row.roles.includes("Guest")) row.roles.push("Guest");
    if (p.created_at && (!row.createdAt || p.created_at < row.createdAt)) row.createdAt = p.created_at;
    users.set(id, row);
  }

  for (const e of eventsResult.data ?? []) {
    const phone = String(e.host_phone ?? "").trim();
    if (!phone) continue;
    const id = `phone:${phone}`;
    const row = users.get(id) ?? { id, name: String(e.celebrant_name ?? "Host"), email: "", roles: [], detail: "", createdAt: e.created_at ?? null };
    if (!row.roles.includes("Host")) row.roles.push("Host");
    row.detail = [row.detail, `Event: ${e.title} (${e.slug})`].filter(Boolean).join(" · ");
    if (e.created_at && (!row.createdAt || e.created_at < row.createdAt)) row.createdAt = e.created_at;
    users.set(id, row);
  }

  for (const partner of partnersResult.data ?? []) {
    const email = String(partner.email ?? "").trim().toLowerCase();
    const id = email ? `email:${email}` : `partner:${partner.id}`;
    const row = users.get(id) ?? { id, name: String(partner.name ?? "Partner"), email, roles: [], detail: "", createdAt: partner.created_at ?? null };
    const roleName = partner.kind === "planner" ? "Event planner" : "Venue partner";
    if (!row.roles.includes(roleName)) row.roles.push(roleName);
    row.detail = [row.detail, [partner.city, partner.phone].filter(Boolean).join(" · ")].filter(Boolean).join(" · ");
    if (partner.created_at && (!row.createdAt || partner.created_at < row.createdAt)) row.createdAt = partner.created_at;
    users.set(id, row);
  }

  const needle = q.trim().toLowerCase();
  const filtered = [...users.values()].filter((u) => {
    const matchesQuery = !needle || [u.name, u.email, u.detail, u.roles.join(" ")].some((v) => v.toLowerCase().includes(needle));
    const matchesRole = role === "all" || u.roles.includes(role);
    return matchesQuery && matchesRole;
  }).sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""));

  return (
    <>
      <header className="topbar"><Link href="/admin" className="brand"><Logo />Odogwu Admin</Link><form action="/api/admin/logout" method="post"><button className="btn btn-ghost" type="submit">Log out</button></form></header>
      <main className="wrap wrap-wide stack">
        <div className="row" style={{ justifyContent: "space-between", flexWrap: "wrap" }}><div><h1 style={{ fontSize: 30, marginBottom: 4 }}>User directory</h1><p className="muted">Known identities inferred from payments, event records and partner sign-ups.</p></div><Link className="btn btn-ghost" href="/admin">Back to overview</Link></div>
        {(eventsResult.error || paymentsResult.error || partnersResult.error) && <div className="error">Some records could not be loaded. Check the Supabase schema and permissions.</div>}
        <div className="stats"><div className="stat"><b>{users.size}</b><span>Unique records (not verified unique people)</span></div><div className="stat"><b>{[...users.values()].filter(u => u.roles.includes("Guest")).length}</b><span>Guest records</span></div><div className="stat"><b>{[...users.values()].filter(u => u.roles.includes("Host")).length}</b><span>Host records</span></div><div className="stat"><b>{[...users.values()].filter(u => u.roles.includes("Event planner") || u.roles.includes("Venue partner")).length}</b><span>Partner records</span></div></div>
        <form className="row" method="get" style={{ alignItems: "end", flexWrap: "wrap" }}>
          <label className="field" style={{ flex: "1 1 240px" }}><span>Search name, email or detail</span><input className="input" name="q" defaultValue={q} placeholder="Search users" /></label>
          <label className="field" style={{ minWidth: 180 }}><span>Role</span><select className="input" name="role" defaultValue={role}><option value="all">All roles</option><option value="Guest">Guest</option><option value="Host">Host</option><option value="Event planner">Event planner</option><option value="Venue partner">Venue partner</option></select></label>
          <button className="btn" type="submit">Filter</button>
        </form>
        <p className="small muted">Showing {filtered.length} record(s). A guest may also be a host or planner. Odogwu does not currently track a guest's full account profile or marketing source, so these are known records rather than a complete list of every visitor.</p>
        <div className="table-wrap"><table className="visits"><thead><tr><th>Name</th><th>Email / identifier</th><th>Role(s)</th><th>Details</th><th>First record</th></tr></thead><tbody>
          {filtered.map((u) => <tr key={u.id}><td>{u.name}</td><td>{u.email || u.id.replace(/^(phone:|partner:)/, "")}</td><td>{u.roles.join(", ")}</td><td>{u.detail || "—"}</td><td>{u.createdAt ? new Date(u.createdAt).toLocaleDateString("en-GB") : "—"}</td></tr>)}
          {filtered.length === 0 && <tr><td colSpan={5}>No matching records.</td></tr>}
        </tbody></table></div>
      </main>
    </>
  );
}
