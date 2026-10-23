import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPublicEvent } from "@/lib/events";
import { SprayScreen } from "@/components/SprayScreen";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

/** Accepts a single value, a repeated param, or a value with a stray "?…" glued on. */
function cleanRef(v: string | string[] | undefined): string {
  const list = Array.isArray(v) ? v : v ? [v] : [];
  for (const item of list) {
    const ref = item.split("?")[0].trim();
    if (/^[A-Za-z0-9_-]{6,100}$/.test(ref)) return ref;
  }
  return "";
}

export default async function SprayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reference?: string | string[]; trxref?: string | string[] }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const ev = await getPublicEvent(slug);
  if (!ev) notFound();
  const reference = cleanRef(sp.reference) || cleanRef(sp.trxref);

  return (
    <Suspense>
      <SprayScreen slug={ev.slug} celebrant={ev.celebrant_name} reference={reference} />
    </Suspense>
  );
}
