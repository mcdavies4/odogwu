import Link from "next/link";
import { Logo } from "@/components/Note";
import { Footer } from "@/components/Footer";
import { PartnerSignup } from "@/components/PartnerSignup";
import { partnerShare } from "@/lib/money";

export const metadata = {
  title: "Partners · Odogwu",
  description: "Event centres and planners: give your celebrations a live spray wall and earn a share of every spray pack.",
};

export default function Partners() {
  const share = partnerShare();
  const example = Math.round(2_000_000 * share / 100).toLocaleString("en-NG");
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <Link href="/host/login" className="topbar-link keep">Sign in</Link>
      </header>
      <main className="wrap stack">
        <section className="partner-hero">
          <p className="step">For event centres &amp; planners</p>
          <h1 style={{ fontSize: "clamp(32px, 7vw, 46px)" }}>Every owambe you host can <span style={{ color: "var(--gold)" }}>earn you more.</span></h1>
          <p className="muted">
            Give your celebrants a live spray wall: guests scan, swipe, and the money rains on your screen. You earn {share}% of
            everything sprayed at the celebrations you bring. A party that sprays ₦2m earns you ₦{example}.
          </p>
        </section>

        <div className="perk-grid">
          <div className="perk"><strong>⚡ Set up in 2 minutes</strong><small>Sign up below and get your dashboard and client link straight away. No calls, no contracts.</small></div>
          <div className="perk"><strong>💸 {share}% of every spray</strong><small>Celebrations made with your link count towards your share, paid to you monthly.</small></div>
          <div className="perk"><strong>📺 A show on your screens</strong><small>The spray wall runs on any projector or TV with a browser. It&apos;s a talking point at every event.</small></div>
          <div className="perk"><strong>🛡️ Nothing to handle</strong><small>Guests pay through Paystack, straight to the celebrant&apos;s bank. No cash to count, nothing to reconcile.</small></div>
        </div>

        <section className="panel stack">
          <h2 style={{ fontSize: 22 }}>Become a partner</h2>
          <PartnerSignup />
        </section>

        <section className="stack">
          <h2 style={{ fontSize: 20 }}>How it works</h2>
          <ol className="steps">
            <li><span className="step-n">1</span><div><h3>Send celebrants your link</h3><p className="muted">They create their celebration with it in two minutes and add their bank account.</p></div></li>
            <li><span className="step-n">2</span><div><h3>Put the wall on your screen</h3><p className="muted">Guests scan the table cards and spray. Every note lands on the screen live.</p></div></li>
            <li><span className="step-n">3</span><div><h3>Watch your earnings</h3><p className="muted">Your dashboard shows each celebration, what was sprayed, and your share.</p></div></li>
          </ol>
          <p className="small muted">Want to see it first? <Link href="/demo/wall">Open the demo wall</Link> on your screen and <Link href="/demo">spray from your phone</Link>. Questions? <Link href="/help?topic=partner">Ask us</Link>.</p>
        </section>
      </main>
      <Footer />
    </>
  );
}
