import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-server";
import { headers } from "next/headers";
import { allow, clientId, safeEqual } from "@/lib/security";
import { siteUrl } from "@/lib/events";
import { naira } from "@/lib/money";
import { Logo } from "@/components/Note";
import { ShareQR } from "@/components/ShareQR";
import { ToggleOpen } from "@/components/ToggleOpen";
import { InstallButton } from "@/components/InstallButton";
import { RememberHost } from "@/components/MyCelebrations";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

type Payment = { reference: string; guest_name: string; amount_kobo: number; status: string; created_at: string; paid_at: string | null };

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
  const { data: ev } = await db.from("events").select("*").eq("slug", slug).maybeSingle();
  if (!ev || !key || !safeEqual(key, ev.host_key)) {
    await allow(`hostfail:${clientId(await headers())}`, 600, 30);
    notFound();
  }

  const { data: payments } = await db
    .from("payments")
    .select("reference,guest_name,amount_kobo,status,created_at,paid_at")
    .eq("event_id", ev.id)
    .neq("status", "failed")
    .order("created_at", { ascending: false })
    .limit(200);

  const paid = (payments as Payment[] | null ?? []).filter((p) => p.status === "success");
  const totalNaira = paid.reduce((s, p) => s + Number(p.amount_kobo) / 100, 0);
  const guests = new Set(paid.map((p) => p.guest_name.toLowerCase())).size;
  const guestUrl = `${siteUrl()}/e/${ev.slug}`;

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
        </div>

        <div className="ok small">
          Bookmark this page. It&apos;s your private host link, and anyone with it can manage this celebration.
        </div>

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
        <InstallButton className="btn btn-ghost btn-block" label="Install Odogwu on this phone" />

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>Spray packs</h2>
          {(payments?.length ?? 0) === 0 ? (
            <p className="muted">No one has sprayed yet. Share the QR code to get things going.</p>
          ) : (
            <ul className="list">
              {(payments as Payment[]).map((p) => (
                <li key={p.reference}>
                  <span>
                    {p.guest_name}
                    <span className={`pill ${p.status}`}>{p.status === "success" ? "Paid" : "Waiting"}</span>
                  </span>
                  <strong>{naira(Number(p.amount_kobo) / 100)}</strong>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
