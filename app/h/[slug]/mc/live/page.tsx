import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { clientId } from "@/lib/security";
import { fetchAll, hostEvent } from "@/lib/report";
import { getPublicEvent } from "@/lib/events";
import { supabaseAdmin } from "@/lib/supabase-server";
import { McLive, type McSpray } from "@/components/McLive";
import { Logo } from "@/components/Note";

export const dynamic = "force-dynamic";
export const metadata = { title: "MC live · Odogwu", robots: { index: false } };

export default async function McLivePage({
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
  const pub = await getPublicEvent(slug);
  const db = supabaseAdmin();
  const load = (cols: string) =>
    fetchAll<McSpray>((f, t) => db.from("sprays").select(cols).eq("event_id", ev.id).order("id", { ascending: true }).range(f, t) as never);
  const initial = await load("id,payment_id,guest_name,amount_naira,created_at,table_no,photo_url")
    .catch(() => load("id,payment_id,guest_name,amount_naira,created_at"))
    .catch(() => [] as McSpray[]);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <Link className="small" href={`/h/${ev.slug}?key=${encodeURIComponent(key)}`}>Dashboard</Link>
      </header>
      <McLive
        eventId={ev.id}
        slug={ev.slug}
        hostKey={key}
        title={ev.title}
        celebrant={ev.celebrant_name}
        bigSpray={pub?.big_spray_naira ?? 0}
        showPhotos={pub?.show_photos ?? true}
        initial={initial}
      />
    </>
  );
}
