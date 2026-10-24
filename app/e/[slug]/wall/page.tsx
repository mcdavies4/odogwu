import { notFound } from "next/navigation";
import { getPublicEvent, siteUrl } from "@/lib/events";
import { supabaseAdmin } from "@/lib/supabase-server";
import { fetchAll } from "@/lib/report";
import { SprayWall, type Spray } from "@/components/SprayWall";

export const dynamic = "force-dynamic";

export default async function WallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getPublicEvent(slug);
  if (!ev) notFound();

  // Every spray so far, so a reloaded wall shows the true total even after 1,000+ notes.
  const db = supabaseAdmin();
  const data = await fetchAll<Spray>((f, t) =>
    db.from("sprays").select("id,guest_name,amount_naira,created_at").eq("event_id", ev.id).order("id", { ascending: true }).range(f, t)
  ).catch(() => [] as Spray[]);

  return (
    <SprayWall
      eventId={ev.id}
      title={ev.title}
      celebrant={ev.celebrant_name}
      guestUrl={`${siteUrl()}/e/${ev.slug}`}
      payee={ev.account_name}
      initial={(data ?? []) as Spray[]}
    />
  );
}
