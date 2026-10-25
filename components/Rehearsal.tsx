"use client";
import { useEffect, useState } from "react";

type Item = { id: string; title: string; how: string; link?: { label: string; href: string; blank?: boolean } };

/** The day-before run-through for the host or venue. Ticks are saved on this device. */
export function Rehearsal({ slug, hostKey, payee, bank }: { slug: string; hostKey: string; payee: string; bank: string }) {
  const k = encodeURIComponent(hostKey);
  const items: Item[] = [
    { id: "payee", title: "Payout name is right", how: `Money goes to ${payee} (${bank}). If that's wrong, create a new celebration with the right account before guests arrive.` },
    { id: "wall", title: "Spray wall on the projector", how: "Open the wall on the laptop connected to the projector or TV, then tap Full screen.", link: { label: "Open spray wall", href: `/e/${slug}/wall`, blank: true } },
    { id: "stress", title: "Laptop can handle a busy party", how: "On that same laptop, open the stress test. If the notes fall smoothly, it's ready.", link: { label: "Run stress test", href: "/demo/wall?stress=60", blank: true } },
    { id: "sound", title: "Sound works through the speakers", how: "On the wall, tap Sound on and check you hear the chime through the venue's speakers." },
    { id: "cards", title: "Table cards printed", how: "Print one card per table, plus a poster for the entrance.", link: { label: "Print cards", href: `/h/${slug}/cards?key=${k}` } },
    { id: "scan", title: "A table card scans", how: "Scan one printed card with a phone. It should open your celebration page." },
    { id: "test", title: "One real ₦1,000 test spray", how: "Buy the smallest pack and spray it. It should land on the wall within a second. The money goes to the celebrant." },
    { id: "mc", title: "MC has the script", how: "Give the MC the one-page script so they announce Odogwu at the right moments.", link: { label: "MC kit", href: `/h/${slug}/mc?key=${k}` } },
    { id: "net", title: "Internet and power sorted", how: "The wall laptop needs steady Wi-Fi or a hotspot, and should be plugged in, not on battery." },
  ];
  const store = `odogwu:rehearsal:${slug}`;
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(store) || "{}");
      setDone(saved);
      if (items.every((i) => saved[i.id])) setOpen(false);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  function toggle(id: string) {
    setDone((d) => {
      const next = { ...d, [id]: !d[id] };
      try { localStorage.setItem(store, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  const count = items.filter((i) => done[i.id]).length;
  const all = count === items.length;

  return (
    <section className={`panel stack rehearsal${all ? " complete" : ""}`}>
      <button type="button" className="rehearsal-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>
          <strong>{all ? "✅ Ready for the party" : "🎤 Rehearsal checklist"}</strong>
          <small>{all ? "Everything checked. Enjoy!" : "Do this the day before, at the venue if you can."}</small>
        </span>
        <span className="rehearsal-count">{count}/{items.length}</span>
      </button>
      <div className="progress" aria-hidden="true"><span style={{ width: `${(count / items.length) * 100}%` }} /></div>
      {open && (
        <ol className="checklist">
          {items.map((i) => (
            <li key={i.id} className={done[i.id] ? "done" : ""}>
              <label>
                <input type="checkbox" checked={!!done[i.id]} onChange={() => toggle(i.id)} />
                <span>
                  <strong>{i.title}</strong>
                  <small>{i.how}</small>
                </span>
              </label>
              {i.link && (
                <a className="chip" href={i.link.href} target={i.link.blank ? "_blank" : undefined} rel={i.link.blank ? "noopener" : undefined}>{i.link.label}</a>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
