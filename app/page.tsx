import Link from "next/link";
import { Logo, Note } from "@/components/Note";

const RAIN = [
  { amount: 1000, left: "8%", delay: "0s" },
  { amount: 500, left: "52%", delay: "1.1s" },
  { amount: 200, left: "28%", delay: "2.2s" },
  { amount: 1000, left: "64%", delay: "3.1s" },
];

export default function Home() {
  return (
    <>
      <header className="topbar">
        <Link href="/" className="brand"><Logo />Odogwu</Link>
        <Link href="/host/new" className="btn btn-ghost" style={{ minHeight: 44 }}>Create a celebration</Link>
      </header>

      <section className="hero pattern">
        <div className="hero-inner">
          <div>
            <h1>Spray the money. Leave the cash at home.</h1>
            <p className="lead">
              Guests swipe notes off their phones and they rain down on the big screen.
              The celebrant gets every naira in their bank account the next working day.
            </p>
            <div className="actions">
              <Link href="/host/new" className="btn">Create a celebration</Link>
              <Link href="/demo" className="btn btn-ghost">Try spraying</Link>
            </div>
          </div>
          <div className="hero-stage" aria-hidden="true">
            {RAIN.map((r, i) => (
              <Note key={i} amount={r.amount} className="rain-note" style={{ left: r.left, animationDelay: r.delay }} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="how">
        <div className="two-col">
          <div>
            <h2>For the celebrant</h2>
            <ol className="steps">
              <li><span className="step-n">1</span><div><h3>Add your bank account</h3><p className="muted">We check the account name with your bank so guests know the money is going to the right person.</p></div></li>
              <li><span className="step-n">2</span><div><h3>Put the QR code up</h3><p className="muted">Print it, stick it on the tables, or show the live spray wall on the projector.</p></div></li>
              <li><span className="step-n">3</span><div><h3>Get paid the next working day</h3><p className="muted">Paystack settles straight to your bank. Odogwu never holds your money.</p></div></li>
            </ol>
          </div>
          <div>
            <h2>For guests</h2>
            <ol className="steps">
              <li><span className="step-n">1</span><div><h3>Scan the code</h3><p className="muted">No app download. It opens in your phone's browser, and you can add it to your home screen.</p></div></li>
              <li><span className="step-n">2</span><div><h3>Buy a spray pack</h3><p className="muted">Pay by card, bank transfer or USSD. From ₦1,000 up.</p></div></li>
              <li><span className="step-n">3</span><div><h3>Swipe up to spray</h3><p className="muted">Every note you flick lands on the wall with your name on it.</p></div></li>
            </ol>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="panel stack">
          <h2 style={{ marginBottom: 0 }}>Questions people ask</h2>
          <p><strong>What does it cost?</strong> <span className="muted">Guests pay a small service fee on top of their pack. The celebrant receives the full pack value.</span></p>
          <p><strong>What if a guest doesn&apos;t spray all their notes?</strong> <span className="muted">It&apos;s still the celebrant&apos;s. The pack is a gift the moment it&apos;s paid; spraying is the fun part.</span></p>
          <p><strong>When does the money arrive?</strong> <span className="muted">The next working day. A Saturday party settles on Monday.</span></p>
        </div>
      </section>

      <footer className="footer">Odogwu by The 36th Solutions Ltd · Payments processed by Paystack</footer>
    </>
  );
}
