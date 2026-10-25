import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { clientId } from "@/lib/security";
import { hostEvent } from "@/lib/report";
import { siteUrl } from "@/lib/events";
import { TableCards } from "@/components/TableCards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Table cards · Odogwu", robots: { index: false } };

export default async function Cards({
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
    <TableCards
      url={`${siteUrl()}/e/${ev.slug}`}
      celebrant={ev.celebrant_name}
      title={ev.title}
      payee={ev.account_name}
      bank={ev.bank_name}
      backHref={`/h/${ev.slug}?key=${encodeURIComponent(key)}`}
    />
  );
}
