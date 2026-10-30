"use client";
import { useRef, useState } from "react";
import Link from "next/link";

type Tab = {
  id: string;
  label: string;
  title: string;
  points: string[];
  cta: { label: string; href: string };
  alt: { label: string; href: string };
  card: { top: string; topValue: string; bottom: string; bottomValue: string; note: string };
};

/** Three audiences, one place: hosts, guests, and venues/planners each see what Odogwu does for them. */
export function AudienceTabs({ fee }: { fee: { pct: number; flat: number } }) {
  const example = 5000;
  const feeAmount = Math.ceil((example * fee.pct) / 100) + fee.flat;
  const n = (v: number) => "₦" + v.toLocaleString("en-NG");
  const tabs: Tab[] = [
    {
      id: "hosts",
      label: "I'm hosting",
      title: "Your celebration, paid straight to your bank",
      points: [
        "Set up in two minutes. It's free for hosts.",
        "Table cards, an MC script and a live spray wall for your projector.",
        "Paystack pays every naira into your own account the next working day.",
        "A spray report of who gave what, and a 20-second highlight reel.",
      ],
      cta: { label: "Create a celebration", href: "/host/new" },
      alt: { label: "See the spray wall", href: "/demo/wall" },
      card: { top: "A guest buys a pack", topValue: n(example + feeAmount), bottom: "You receive", bottomValue: n(example), note: `The ${fee.pct}% + ${n(fee.flat)} service fee is paid by the guest, on top.` },
    },
    {
      id: "guests",
      label: "I'm a guest",
      title: "Spray from your phone, no cash needed",
      points: [
        "Scan the QR code on your table. No app to download.",
        "Pay by card, bank transfer or USSD.",
        "Swipe each note up and it lands on the big screen with your name.",
        "Rather stay quiet? Spray as Secret Odogwu.",
      ],
      cta: { label: "Try spraying", href: "/demo" },
      alt: { label: "How fees work", href: "#fees" },
      card: { top: "Your pack", topValue: n(example), bottom: "Celebrant receives", bottomValue: n(example), note: "Every note you buy goes to the celebrant, sprayed or not." },
    },
    {
      id: "partners",
      label: "I run venues or plan events",
      title: "Earn from every spray at your events",
      points: [
        "Earn 1% of everything sprayed at the celebrations you bring.",
        "Your own live dashboard for every event.",
        "The spray wall runs on any projector or smart TV.",
        "Free to join, no contract. Sign up in two minutes.",
      ],
      cta: { label: "Become a partner", href: "/partners" },
      alt: { label: "Partner questions", href: "/help#partners" },
      card: { top: "A wedding sprays", topValue: n(2000000), bottom: "You earn", bottomValue: n(20000), note: "Paid to you monthly. Your dashboard shows every naira." },
    },
  ];
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const t = tabs[active];

  function onKey(e: React.KeyboardEvent) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const next = (active + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
    setActive(next);
    refs.current[next]?.focus();
  }

  return (
    <div className="lp-tabs">
      <div className="lp-tablist" role="tablist" aria-label="Who are you?" onKeyDown={onKey}>
        {tabs.map((x, k) => (
          <button key={x.id} ref={(el) => { refs.current[k] = el; }} role="tab" id={`tab-${x.id}`} aria-controls={`panel-${x.id}`}
            aria-selected={k === active} tabIndex={k === active ? 0 : -1} onClick={() => setActive(k)}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="lp-tabpanel" role="tabpanel" id={`panel-${t.id}`} aria-labelledby={`tab-${t.id}`} key={t.id}>
        <div>
          <h3>{t.title}</h3>
          <ul className="lp-ticks">
            {t.points.map((p) => <li key={p}>{p}</li>)}
          </ul>
          <div className="lp-actions">
            <Link className="btn" href={t.cta.href}>{t.cta.label}</Link>
            <Link className="lp-textlink" href={t.alt.href}>{t.alt.label}</Link>
          </div>
        </div>
        <div className="lp-receipt" aria-label="Example">
          <div className="lp-receipt-row"><span>{t.card.top}</span><b>{t.card.topValue}</b></div>
          <div className="lp-receipt-arrow" aria-hidden="true" />
          <div className="lp-receipt-row lp-receipt-hi"><span>{t.card.bottom}</span><b>{t.card.bottomValue}</b></div>
          <p>{t.card.note}</p>
        </div>
      </div>
    </div>
  );
}
