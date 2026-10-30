import Link from "next/link";
import "./landing.css";
import { Footer } from "@/components/Footer";
import { Logo } from "@/components/Note";
import { MyCelebrations } from "@/components/MyCelebrations";
import { HeroStage } from "@/components/landing/HeroStage";
import { AudienceTabs } from "@/components/landing/AudienceTabs";
import { THEMES } from "@/lib/themes";
import { feeFlat, feePercent, naira, serviceFee } from "@/lib/money";
import { ABROAD_ENABLED } from "@/lib/flags";

const PLAY_URL = process.env.NEXT_PUBLIC_PLAY_STORE_URL || "https://play.google.com/store/apps/details?id=online.odogwu.app";
const FEE_EXAMPLES = [2000, 5000, 10000, 50000];

const FAQ: { q: string; a: React.ReactNode }[] = [
  { q: "Does Odogwu hold the money?", a: <>Never. Every payment is processed by Paystack and paid straight into the celebrant&apos;s own bank account. There&apos;s no Odogwu wallet or balance.</> },
  { q: "When does the money arrive?", a: <>The next working day after each payment. Money from a Saturday party usually lands on Monday.</> },
  { q: "What if a guest doesn't spray all their notes?", a: <>It&apos;s still the celebrant&apos;s. The pack is a gift the moment it&apos;s paid; spraying is the fun part.</> },
  { q: "Do guests need to download an app?", a: <>No. They scan the QR code and it opens in their phone&apos;s browser. Android users can also <a href={PLAY_URL}>get the app on Google Play</a>.</> },
  { q: "What do we need at the venue?", a: <>A laptop connected to a projector or TV, steady internet, and the table cards printed from your dashboard.</> },
  { q: "Do we get anything to keep?", a: <>A spray report of who gave what, and a 20-second highlight reel to post. <Link href="/demo/recap">See an example reel</Link>.</> },
  ...(ABROAD_ENABLED ? [{ q: "Can family abroad spray?", a: <>Yes. They open the guest link from anywhere, pay with a foreign card, and watch the wall live.</> }] : []),
];

export default function Home() {
  const pct = feePercent();
  const flat = feeFlat();
  return (
    <div className="lp">
      <header className="lp-header">
        <div className="lp-container lp-header-in">
          <Link href="/" className="brand"><Logo />Odogwu</Link>
          <nav className="lp-nav" aria-label="Main">
            <a href="#how">How it works</a>
            <a href="#fees">Fees</a>
            <Link href="/partners">Partners</Link>
            <Link href="/help">Help</Link>
            <Link href="/host/login">Sign in</Link>
          </nav>
          <Link href="/host/new" className="btn lp-header-cta">Create a celebration</Link>
        </div>
      </header>

      <section className="lp-hero">
        <div className="lp-container lp-hero-in">
          <div className="lp-hero-copy">
            <h1>Spray the money. Leave the cash at home.</h1>
            <p className="lp-lead">
              Guests scan a QR code, swipe notes off their phones, and watch them rain on the big screen.
              The celebrant gets every naira in their own bank the next working day.
            </p>
            <div className="lp-actions">
              <Link href="/host/new" className="btn">Create a celebration</Link>
              <Link href="/demo" className="btn btn-ghost">Try spraying</Link>
            </div>
            <ul className="lp-hero-facts">
              <li>Free for hosts</li>
              <li>Payments by Paystack</li>
              <li>Paid the next working day</li>
            </ul>
          </div>
          <HeroStage />
        </div>
      </section>

      <section className="lp-trust lp-light">
        <div className="lp-container lp-trust-in">
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>
            <p><strong>We never hold your money.</strong> Paystack pays it straight into the celebrant&apos;s own bank account.</p>
          </div>
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg>
            <p><strong>Card, transfer or USSD.</strong> Guests see the exact total, and the account name, before they pay.</p>
          </div>
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></svg>
            <p><strong>Works on any phone.</strong> No download needed, or <a href={PLAY_URL}>get the Android app</a>.</p>
          </div>
        </div>
      </section>

      <MyCelebrations />

      <section className="lp-section lp-light" id="how">
        <div className="lp-container">
          <h2>How it works</h2>
          <ol className="lp-steps">
            <li>
              <span className="lp-step-n">1</span>
              <h3>Create your celebration</h3>
              <p>Add the celebrant&apos;s bank account. We check the account name with the bank, so guests know exactly who they&apos;re paying.</p>
            </li>
            <li>
              <span className="lp-step-n">2</span>
              <h3>Put up the QR code</h3>
              <p>Print table cards from your dashboard and put the spray wall on the projector. The MC script tells guests what to do.</p>
            </li>
            <li>
              <span className="lp-step-n">3</span>
              <h3>Guests spray from their phones</h3>
              <p>Every note they swipe lands on the big screen with their name. The top sprayer wears the crown.</p>
            </li>
            <li>
              <span className="lp-step-n">4</span>
              <h3>The money arrives next working day</h3>
              <p>Paystack settles straight to the celebrant&apos;s bank. Download the spray report and the highlight reel to keep.</p>
            </li>
          </ol>
        </div>
      </section>

      <section className="lp-section lp-lace">
        <div className="lp-container">
          <h2>Made for everyone at the party</h2>
          <AudienceTabs fee={{ pct, flat }} />
        </div>
      </section>

      <section className="lp-section lp-dark">
        <div className="lp-container lp-themes">
          <div className="lp-themes-copy">
            <h2>A wall to match the occasion</h2>
            <p>{THEMES.length} spray wall themes, from Owambe Classic to Detty December. Switch anytime, even mid-party.</p>
            <Link href="/demo/wall" className="btn btn-ghost">Open the demo wall</Link>
          </div>
          <ul className="lp-swatches">
            {THEMES.map((t) => (
              <li key={t.id}>
                <Link href={`/demo/wall?theme=${t.id}`} aria-label={`Preview the ${t.name} theme`}>
                  <span className="lp-swatch" style={{ background: t.swatch[0] }} aria-hidden="true">
                    <i style={{ background: t.swatch[1] }} /><i style={{ background: t.swatch[2] }} />
                  </span>
                  <span className="lp-swatch-name">{t.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="lp-section lp-light" id="fees">
        <div className="lp-container lp-fees">
          <div>
            <h2>Simple, upfront fees</h2>
            <p className="lp-sub">Free for hosts. Guests pay a {pct}% + {naira(flat)} service fee on top of each pack, and see the total before they pay. The celebrant receives 100% of the pack.</p>
            <ul className="lp-ticks">
              <li>No sign-up, withdrawal or monthly fees</li>
              <li>Card and bank charges come out of our fee, never the celebrant&apos;s money</li>
              <li>Premium wall themes are optional</li>
            </ul>
          </div>
          <table className="lp-table">
            <caption>What a guest pays</caption>
            <thead><tr><th scope="col">Spray pack</th><th scope="col">Service fee</th><th scope="col">Guest pays</th><th scope="col">Celebrant gets</th></tr></thead>
            <tbody>
              {FEE_EXAMPLES.map((p) => {
                const fee = serviceFee(p, pct, flat);
                return (
                  <tr key={p}><td>{naira(p)}</td><td>{naira(fee)}</td><td>{naira(p + fee)}</td><td><b>{naira(p)}</b></td></tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="lp-section lp-lace">
        <div className="lp-container lp-faq">
          <h2>Questions people ask</h2>
          <div>
            {FAQ.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
            <p className="lp-faq-more">More answers in the <Link href="/help">Help centre</Link>.</p>
          </div>
        </div>
      </section>

      <section className="lp-cta">
        <div className="lp-container lp-cta-in">
          <h2>Planning a celebration?</h2>
          <p>Set it up free in two minutes. We&apos;ll email you everything you need for the day.</p>
          <div className="lp-actions">
            <Link href="/host/new" className="btn lp-btn-wine">Create a celebration</Link>
            <a href={PLAY_URL} className="btn lp-btn-outline">Get the Android app</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
