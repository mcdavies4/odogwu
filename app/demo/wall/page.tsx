import { SprayWall } from "@/components/SprayWall";
import { siteUrl } from "@/lib/events";

export const metadata = { title: "Spray wall demo · Odogwu" };
export const dynamic = "force-dynamic";

// A pretend party: fake guests spray in bursts so you can see (and show off) the wall.
// Add ?stress=60 to the address to fire 60 sprays a second and test a laptop before an event.
export default async function DemoWall({ searchParams }: { searchParams: Promise<{ stress?: string }> }) {
  const { stress } = await searchParams;
  const rate = Math.min(500, Math.max(0, Number(stress) || 0));
  return (
    <SprayWall
      demo
      stress={rate}
      eventId="demo"
      title="Tolu & Chidi's wedding"
      celebrant="the couple"
      guestUrl={`${siteUrl()}/demo`}
      initial={[]}
    />
  );
}
