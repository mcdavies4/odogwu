import { SprayWall } from "@/components/SprayWall";
import { siteUrl } from "@/lib/events";

export const metadata = { title: "Spray wall demo · Odogwu" };
export const dynamic = "force-dynamic";

// A pretend party: fake guests spray in bursts so you can see (and show off) the wall.
export default function DemoWall() {
  return (
    <SprayWall
      demo
      eventId="demo"
      title="Tolu & Chidi's wedding"
      celebrant="the couple"
      guestUrl={`${siteUrl()}/demo`}
      initial={[]}
    />
  );
}
