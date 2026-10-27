import { SprayScreen } from "@/components/SprayScreen";
import { TrackVisit } from "@/components/TrackVisit";

export const metadata = { title: "Try spraying · Odogwu" };

// No payment, no database: a ₦5,000 practice pack to feel the swipe.
// ?ref=venue-name tags the visit (see /admin/visits).
export default async function Demo({ searchParams }: { searchParams: Promise<{ ref?: string }> }) {
  const { ref } = await searchParams;
  const tag = ref ? String(ref).toLowerCase().replace(/[^a-z0-9-_]/g, "").slice(0, 60) : "";
  return (
    <>
      <TrackVisit page="spray" refTag={tag || undefined} />
      <SprayScreen slug="demo" celebrant="the birthday girl" reference="demo" title="Kemi's 30th birthday" nowDancing="The birthday girl" />
    </>
  );
}
