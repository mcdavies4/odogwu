import { SprayWall } from "@/components/SprayWall";
import { TrackVisit } from "@/components/TrackVisit";
import { siteUrl } from "@/lib/events";
import { themeOf } from "@/lib/themes";

export const metadata = { title: "Spray wall demo · Odogwu" };
export const dynamic = "force-dynamic";

// A pretend party: fake guests spray in bursts so you can see (and show off) the wall.
// ?ref=venue-name tags the visit so you can see which venue opened it (see /admin/visits).
// ?stress=60 fires 60 sprays a second to test a laptop before an event.
// ?theme=wedding|praise|birthday|naija previews a premium wall theme.
export default async function DemoWall({ searchParams }: { searchParams: Promise<{ stress?: string; ref?: string; theme?: string }> }) {
  const { stress, ref, theme } = await searchParams;
  const rate = Math.min(500, Math.max(0, Number(stress) || 0));
  const tag = ref ? String(ref).toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 60) : "";
  return (
    <>
      {!rate && <TrackVisit page="wall" refTag={tag || undefined} />}
      <SprayWall
        demo
        stress={rate}
        eventId="demo"
        title="Tolu & Chidi's wedding"
        celebrant="the couple"
        guestUrl={`${siteUrl()}/demo${tag ? `?ref=${tag}` : ""}`}
        payee="TOLULOPE ADEBAYO"
        theme={themeOf(theme)}
        nowDancing="The couple"
        venueName="Eko Grand Hall"
        initial={[]}
      />
    </>
  );
}
