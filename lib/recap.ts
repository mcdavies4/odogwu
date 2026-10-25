import "server-only";
import { buildReport } from "./report";
import { flagIn } from "./countries";
import { SECRET_LABEL } from "./hype";
import type { RecapSummary } from "@/components/RecapPlayer";

/** Everything the highlight reel needs. Anonymous guests stay "Secret Odogwu", never their private name. */
export async function recapSummary(ev: { id: string; title: string; celebrant_name: string; event_date: string | null }, venue: string | null): Promise<RecapSummary> {
  const r = await buildReport(ev.id);
  const flags = new Set<string>();
  for (const g of r.guests) {
    if (g.anonymous) continue;
    const f = flagIn(g.name);
    flags.add(f ?? "🇳🇬");
  }
  return {
    title: ev.title,
    celebrant: ev.celebrant_name,
    date: ev.event_date
      ? new Date(ev.event_date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : null,
    venue,
    total: r.total,
    guests: r.guests.length,
    notes: r.notes,
    packs: r.packs,
    top: r.guests.slice(0, 3).map((g) => ({ name: g.anonymous ? SECRET_LABEL : g.name, amount: g.gift })),
    flags: [...flags].sort((a, b) => (a === "🇳🇬" ? -1 : b === "🇳🇬" ? 1 : 0)),
  };
}
