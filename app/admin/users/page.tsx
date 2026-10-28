import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase-server";
import { clientId } from "@/lib/security";
import { isAdmin } from "@/lib/admin";
import { Logo } from "@/components/Note";
import { naira } from "@/lib/money";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "User intelligence · Odogwu",
  robots: { index: false },
};

type EventRow = {
  id: string;
  slug: string;
  title: string;
  event_date: string | null;
  host_email?: string | null;
  host_phone?: string | null;
  created_at: string;
  is_open?: boolean;
  venue_id?: string | null;
};

type PaymentRow = {
  event_id: string;
  guest_name: string;
  guest_email: string;
  amount_kobo: number;
  status: string;
  paid_at: string | null;
  created_at: string;
};

type PartnerRow = {
  id: string;
  name: string;
  kind?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  source?: string | null;
  created_at: string;
};

type UserRecord = {
  key: string;
  email: string;
  name: string;
  roles: Set<string>;
  firstSeen: string;
  eventsCreated: number;
  successfulPayments: number;
  successfulValueKobo: number;
  lastActivity: string;
  source: string;
};

const when = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const normalEmail = (value?: string | null) => (value || "").trim().toLowerCase();

const roleLabel = (role: string) =>
  ({ guest: "Guest", host: "Host", planner: "Event planner", venue: "Venue partner" })[role] || role;

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; q?: string; role?: string }>;
}) {
  const { key, q = "", role = "all" } = await searchParams;
  if (!(await isAdmin(key, clientId(await headers())))) notFound();

  const db = supabaseAdmin();

  // Never select host_key, venue_key, bank account details, or payment references
  // for this dashboard. This is an operational directory, not a secrets viewer.
  const [eventResult, paymentResult, partnerResult] = await Promise.all([
    db
      .from("events")
      .select("id,slug,title,event_date,host_email,host_phone,created_at,is_open,venue_id")
      .order("created_at", { ascending: false })
      .limit(3000),
    db
      .from("payments")
      .select("event_id,guest_name,guest_email,amount_kobo,status,paid_at,created_at")
      .order("created_at", { ascending: false })
      .limit(5000),
    db
      .from("venues")
      .select("id,name,kind,email,phone,city,source,created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
  ]);

  // Older installations may not have run the host-email or partner metadata
  // migrations. Keep the dashboard useful without pretending those fields exist.
  let events = (eventResult.data ?? []) as EventRow[];
  if (eventResult.error) {
    const fallback = await db
      .from("events")
      .select("id,slug,title,event_date,host_phone,created_at,is_open,venue_id")
      .order("created_at", { ascending: false })
      .limit(3000);
    events = (fallback.data ?? []) as EventRow[];
  }

  const payments = (paymentResult.data ?? []) as PaymentRow[];
  const partners = (partnerResult.data ?? []) as PartnerRow[];
  const users = new Map<string, UserRecord>();
  const eventById = new Map(events.map((event) => [event.id, event]));

  function touch(
    emailValue: string | null | undefined,
    roleName: string,
    nameValue: string | null | undefined,
    activity: string,
    source = "Not recorded",
  ) {
    const email = normalEmail(emailValue);
    if (!email) return null;
    let user = users.get(email);
    if (!user) {
      user = {
        key: email,
        email,
        name: (nameValue || "").trim() || "Name not recorded",
        roles: new Set<string>(),
        firstSeen: activity,
        eventsCreated: 0,
        successfulPayments: 0,
        successfulValueKobo: 0,
        lastActivity: activity,
        source,
      };
      users.set(email, user);
    }
    user.roles.add(roleName);
    if (activity && (!user.firstSeen || activity < user.firstSeen)) user.firstSeen = activity;
    if (activity && (!user.lastActivity || activity > user.lastActivity)) user.lastActivity = activity;
    if (user.name === "Name not recorded" && nameValue) user.name = nameValue;
    if (user.source === "Not recorded" && source !== "Not recorded") user.source = source;
    return user;
  }

  // Hosts can only be identified by email when the host-email migration exists.
  for (const event of events) {
    const user = touch(event.host_email, "host", event.title, event.created_at);
    if (user) user.eventsCreated += 1;
  }

  // Guest identity is based on the email used at checkout. This measures known
  // checkout users, not every person who attended an event.
  for (const payment of payments) {
    const event = eventById.get(payment.event_id);
    const user = touch(
      payment.guest_email,
      "guest",
      payment.guest_name,
      payment.paid_at || payment.created_at,
      "Checkout (source not attributed)",
    );
    if (!user) continue;
    if (payment.status === "success") {
      user.successfulPayments += 1;
      user.successfulValueKobo += Number(payment.amount_kobo || 0);
    }
    if (event?.venue_id) user.source = user.source === "Not recorded" ? "Venue partner link" : user.source;
  }

  for (const partner of partners) {
    const partnerRole = partner.kind === "planner" ? "planner" : "venue";
    const user = touch(partner.email, partnerRole, partner.name, partner.created_at, partner.source || "Partner sign-up");
    if (user && partner.kind === "planner") user.roles.add("planner");
  }

  const needle = q.trim().toLowerCase();
  const validRoles = ["all", "guest", "host", "planner", "venue"];
  const selectedRole = validRoles.includes(role) ? role : "all";
  const filtered = [...users.values()]
    .filter((user) => {
      const matchesQuery =
        !needle ||
        user.email.includes(needle) ||
        user.name.toLowerCase().includes(needle);
      const matchesRole = selectedRole === "all" || user.roles.has(selectedRole);
      return matchesQuery && matchesRole;
    })
    .sort((a, b) => b.lastActivity.localeCompare(a.lastActivity));

  const guestCount = [...users.values()].filter((user) => user.roles.has("guest")).length;
  const hostCount = [...users.values()].filter((user) => user.roles.has("host")).length;
  const plannerCount = [...users.values()].filter((user) => user.roles.has("planner")).length;
  const successfulPayments = payments.filter((payment) => payment.status === "success");
  const totalValueKobo = successfulPayments.reduce((sum, payment) => sum + Number(payment.amount_kobo || 0), 0);

  const queryString = (nextRole: string) => {
    const params = new URLSearchParams();
    if (key) params.set("key", key);
    if (q) params.set("q", q);
    if (nextRole !== "all") params.set("role", nextRole);
    return `/admin/users?${params.toString()}`;
  };

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/admin/venues?key=${encodeURIComponent(key || "")}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Partners</Link>
          <Link href={`/admin/visits?key=${encodeURIComponent(key || "")}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Demo visits</Link>
        </nav>
      </header>

      <main className="wrap wrap-wide stack">
        <div className="stack" style={{ gap: 6 }}>
          <p className="step">Admin · Growth</p>
          <h1 style={{ fontSize: 30 }}>User intelligence</h1>
          <p className="muted">Understand who is using Odogwu, how they engage, and which audiences are growing.</p>
        </div>

        <div className="stats">
          <div className="stat"><b>{users.size.toLocaleString("en-GB")}</b><span>Known unique emails</span></div>
          <div className="stat"><b>{guestCount.toLocaleString("en-GB")}</b><span>Guest checkout users</span></div>
          <div className="stat"><b>{hostCount.toLocaleString("en-GB")}</b><span>Hosts identified by email</span></div>
          <div className="stat"><b>{plannerCount.toLocaleString("en-GB")}</b><span>Event planners</span></div>
        </div>

        <div className="stats">
          <div className="stat"><b>{successfulPayments.length.toLocaleString("en-GB")}</b><span>Successful payments</span></div>
          <div className="stat"><b>{naira(totalValueKobo / 100)}</b><span>Successful pack value</span></div>
          <div className="stat"><b>{events.length.toLocaleString("en-GB")}</b><span>Celebrations created</span></div>
          <div className="stat"><b>{partners.length.toLocaleString("en-GB")}</b><span>Venue & planner profiles</span></div>
        </div>

        {(eventResult.error || paymentResult.error || partnerResult.error) && (
          <div className="panel stack">
            <strong>Some metrics may be incomplete.</strong>
            <p className="small muted">
              One or more database queries failed. Check that the current Supabase schema and migrations are applied.
              {eventResult.error ? ` Events: ${eventResult.error.message}.` : ""}
              {paymentResult.error ? ` Payments: ${paymentResult.error.message}.` : ""}
              {partnerResult.error ? ` Partners: ${partnerResult.error.message}.` : ""}
            </p>
          </div>
        )}

        <section className="panel stack">
          <h2 style={{ fontSize: 20 }}>Find users</h2>
          <form method="GET" action="/admin/users" className="stack" style={{ gap: 10 }}>
            {key && <input type="hidden" name="key" value={key} />}
            <label className="field">
              <span>Search by name or email</span>
              <input className="input" name="q" defaultValue={q} placeholder="e.g. guest@example.com" />
            </label>
            <label className="field">
              <span>User segment</span>
              <select className="input" name="role" defaultValue={selectedRole}>
                <option value="all">All user types</option>
                <option value="guest">Guests</option>
                <option value="host">Hosts</option>
                <option value="planner">Event planners</option>
                <option value="venue">Venue partners</option>
              </select>
            </label>
            <button className="btn" type="submit">Apply filters</button>
          </form>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["all", "guest", "host", "planner", "venue"].map((item) => (
              <Link
                key={item}
                href={queryString(item)}
                className={selectedRole === item ? "btn" : "btn btn-ghost"}
                style={{ minHeight: 40 }}
              >
                {item === "all" ? "Everyone" : roleLabel(item)}
              </Link>
            ))}
          </div>
        </section>

        <section className="stack">
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <h2 style={{ fontSize: 20 }}>Users ({filtered.length.toLocaleString("en-GB")})</h2>
            <span className="small muted">Combined by email where available</span>
          </div>
          {filtered.length === 0 ? (
            <div className="panel">
              <p className="muted">No matching users found. Host accounts created before host email was saved may not be identifiable here.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table className="visits">
                <thead>
                  <tr>
                    <th>Name / business</th>
                    <th>Email</th>
                    <th>Segment</th>
                    <th>Celebrations</th>
                    <th>Successful payments</th>
                    <th>Successful value</th>
                    <th>First seen</th>
                    <th>Last activity</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.key}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{[...user.roles].map(roleLabel).join(", ")}</td>
                      <td>{user.eventsCreated}</td>
                      <td>{user.successfulPayments}</td>
                      <td>{naira(user.successfulValueKobo / 100)}</td>
                      <td>{when(user.firstSeen)}</td>
                      <td>{when(user.lastActivity)}</td>
                      <td>{user.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="small muted">
          Data notes: guests are identified by checkout email; hosts are identified by host email where that field is available;
          planners and venue partners are identified by partner profile. One person may appear in multiple segments.
          “Successful value” is the value of successful spray-pack payments, not a statement of Odogwu revenue or payout.
          Marketing source attribution is not yet collected consistently, so unrecorded sources are labelled accordingly.
        </p>
      </main>
    </>
  );
}
