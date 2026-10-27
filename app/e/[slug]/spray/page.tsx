import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPublicEvent } from "@/lib/events";
import { SprayScreen } from "@/components/SprayScreen";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function SprayPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const ev = await getPublicEvent(slug);
  if (!ev) notFound();
  const reference = sp.reference || sp.trxref || "";

  return (
    <Suspense>
      <SprayScreen slug={ev.slug} celebrant={ev.celebrant_name} reference={reference} />
    </Suspense>
  );
}
