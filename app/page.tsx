import Link from "next/link";
import { Footer } from "@/components/Footer";
import { FeesSection } from "@/components/FeesSection";
import { Logo } from "@/components/Note";
import { FlutterNote } from "@/components/FlutterNote";
import { InstallButton } from "@/components/InstallButton";
import { MyCelebrations } from "@/components/MyCelebrations";

const RAIN = [
  { amount: 1000, left: "6%", delay: "0s" },
  { amount: 500, left: "50%", delay: "0.9s" },
  { amount: 200, left: "26%", delay: "1.8s" },
  { amount: 1000, left: "62%", delay: "2.7s" },
  { amount: 500, left: "14%", delay: "3.6s" },
  { amount: 50, left: "44%", delay: "4.5s" },
  { amount: 200, left: "70%", delay: "5.4s" },
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
              <InstallButton />
            </div>
          </div>
          <div className="hero-stage" aria-hidden="true">
            {RAIN.map((r, i) => (
              <FlutterNote
                key={i}
                seed={i * 7919 + 13}
                amount={r.amount}
                mode="fall"
                loop
                style={{ left: r.left, ["--delay" as string]: r.delay, ["--dur" as string]: "5.4s" } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      </section>

      <MyCelebrations />

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

      <FeesSection />

      <section className="section">
        <div className="panel stack">
          <h2 style={{ marginBottom: 0 }}>Questions people ask</h2>
          <p><strong>What does it cost?</strong> <span className="muted">Creating a celebration is free. Guests pay a service fee of 5% + ₦100 on top of each spray pack, and the celebrant receives the full pack value. <a href="#fees">See how fees work</a>.</span></p>
          <p><strong>What if a guest doesn&apos;t spray all their notes?</strong> <span className="muted">It&apos;s still the celebrant&apos;s. The pack is a gift the moment it&apos;s paid; spraying is the fun part.</span></p>
          <p><strong>Can guests spray anonymously?</strong> <span className="muted">Yes. They show on the wall as &quot;Secret Odogwu 🤫&quot;. If they want, they can leave their name for the celebrant&apos;s private thank-you list only.</span></p>
          <p><strong>When does the money arrive?</strong> <span className="muted">The next working day. A Saturday party settles on Monday.</span></p>
        </div>
      </section>

      <Footer />
    </>
  );
}
