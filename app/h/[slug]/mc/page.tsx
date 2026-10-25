import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { clientId } from "@/lib/security";
import { hostEvent } from "@/lib/report";
import { siteUrl } from "@/lib/events";
import { McKit } from "@/components/McKit";

export const dynamic = "force-dynamic";
export const metadata = { title: "MC kit · Odogwu", robots: { index: false } };

export default async function Mc({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { slug } = await params;
  const { key } = await searchParams;
  const ev = await hostEvent(slug, key, clientId(await headers()));
  if (!ev || !key) notFound();
  return (
    <McKit
      url={`${siteUrl()}/e/${ev.slug}`}
      celebrant={ev.celebrant_name}
      title={ev.title}
      payee={ev.account_name}
      backHref={`/h/${ev.slug}?key=${encodeURIComponent(key)}`}
      dancingOn={ev.theme !== undefined}
    />
  );
}
