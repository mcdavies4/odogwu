import { notFound } from "next/navigation";
import { getPublicEvent, siteUrl } from "@/lib/events";
import { supabaseAdmin } from "@/lib/supabase-server";
import { fetchAll } from "@/lib/report";
import { SprayWall, type Spray } from "@/components/SprayWall";
import { SPRAY_COLUMNS, SPRAY_COLUMNS_BASIC } from "@/lib/recognition";

export const dynamic = "force-dynamic";

export default async function WallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getPublicEvent(slug);
  if (!ev) notFound();

  // Every spray so far, so a reloaded wall shows the true total even after 1,000+ notes.
  const db = supabaseAdmin();
  const load = (cols: string) =>
    fetchAll<Spray>((f, t) => db.from("sprays").select(cols).eq("event_id", ev.id).order("id", { ascending: true }).range(f, t) as never);
  // Falls back to the basic columns until supabase/recognition.sql has been run.
  const data = await load(SPRAY_COLUMNS).catch(() => load(SPRAY_COLUMNS_BASIC)).catch(() => [] as Spray[]);

  return (
    <SprayWall
      eventId={ev.id}
      title={ev.title}
      celebrant={ev.celebrant_name}
      guestUrl={`${siteUrl()}/e/${ev.slug}`}
      payee={ev.account_name}
      slug={ev.slug}
      theme={ev.theme}
      nowDancing={ev.now_dancing}
      venueName={ev.venue_name}
      open={ev.is_open}
      bigSpray={ev.big_spray_naira}
      showPhotos={ev.show_photos}
      initial={(data ?? []) as Spray[]}
    />
  );
}
