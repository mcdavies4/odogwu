import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { clientId } from "@/lib/security";
import { hostEvent } from "@/lib/report";
import { getPublicEvent } from "@/lib/events";
import { recapSummary } from "@/lib/recap";
import { Logo } from "@/components/Note";
import { RecapPlayer } from "@/components/RecapPlayer";

export const dynamic = "force-dynamic";
export const metadata = { title: "Highlight reel · Odogwu", robots: { index: false } };

export default async function Recap({
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
  const pub = await getPublicEvent(slug);
  const summary = await recapSummary(ev, pub?.venue_name ?? null);

  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <Link href={`/h/${ev.slug}?key=${encodeURIComponent(key)}`} className="btn btn-ghost" style={{ minHeight: 44 }}>Back</Link>
      </header>
      <main className="wrap stack">
        <div>
          <h1 style={{ fontSize: 30 }}>Highlight reel</h1>
          <p className="muted">A 20-second recap of {ev.title}: the total, the numbers and the top sprayers. Save it and post it.</p>
        </div>
        {summary.total === 0 ? (
          <div className="panel">
            <p>Your highlight reel appears once guests start spraying. <Link href="/demo/recap">See an example</Link>.</p>
          </div>
        ) : (
          <RecapPlayer summary={summary} />
        )}
        <p className="small muted">Anonymous guests show as Secret Odogwu 🤫. It&apos;s a silent video, so add your favourite song in TikTok, Instagram or CapCut.</p>
      </main>
    </>
  );
}
