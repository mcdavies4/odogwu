import { notFound } from "next/navigation";
import { getPublicEvent, siteUrl } from "@/lib/events";
import { supabaseAdmin } from "@/lib/supabase-server";
import { SprayWall, type Spray } from "@/components/SprayWall";

export const dynamic = "force-dynamic";

export default async function WallPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ev = await getPublicEvent(slug);
  if (!ev) notFound();

  const { data } = await supabaseAdmin()
    .from("sprays")
    .select("id,guest_name,amount_naira,created_at")
    .eq("event_id", ev.id)
    .order("id", { ascending: true })
    .limit(20000);

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
