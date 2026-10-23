"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { supabaseBrowser } from "@/lib/supabase";
import { naira } from "@/lib/money";
import { FlutterNote } from "./FlutterNote";

export type Spray = { id: number; guest_name: string; amount_naira: number; created_at: string };
type Falling = { key: number; amount: number; left: number; delay: number };

const MAX_FALLING = 40;

export function SprayWall({ eventId, title, celebrant, guestUrl, initial }: {
  eventId: string; title: string; celebrant: string; guestUrl: string; initial: Spray[];
}) {
  const [sprays, setSprays] = useState<Spray[]>(initial);
  const [falling, setFalling] = useState<Falling[]>([]);
  const [latest, setLatest] = useState<Spray | null>(null);
  const seen = useRef(new Set(initial.map((s) => s.id)));
  const lastId = useRef(initial.length ? initial[initial.length - 1].id : 0);

  function addSprays(rows: Spray[]) {
    const fresh = rows.filter((s) => !seen.current.has(s.id));
    if (!fresh.length) return;
    fresh.forEach((s) => { seen.current.add(s.id); lastId.current = Math.max(lastId.current, s.id); });
    setSprays((prev) => [...prev, ...fresh]);
    setLatest(fresh[fresh.length - 1]);
    setFalling((prev) => {
      const add = fresh.slice(-12).map((s, i) => ({
        key: s.id,
        amount: s.amount_naira,
        left: Math.random() * 82,
        delay: i * 0.18,
      }));
      return [...prev, ...add].slice(-MAX_FALLING);
    });
  }

  useEffect(() => {
    const sb = supabaseBrowser();
    const channel = sb
      .channel(`wall:${eventId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sprays", filter: `event_id=eq.${eventId}` },
        (payload) => addSprays([payload.new as Spray]))
      .subscribe();

    // Safety net for flaky venue Wi-Fi: catch up on anything realtime missed.
    const poll = setInterval(async () => {
      const { data } = await sb
        .from("sprays")
        .select("id,guest_name,amount_naira,created_at")
        .eq("event_id", eventId)
        .gt("id", lastId.current)
        .order("id", { ascending: true })
        .limit(500);
      if (data?.length) addSprays(data as Spray[]);
    }, 8000);

    return () => { sb.removeChannel(channel); clearInterval(poll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const total = useMemo(() => sprays.reduce((s, r) => s + r.amount_naira, 0), [sprays]);
  const board = useMemo(() => {
    const m = new Map<string, { name: string; amt: number }>();
    for (const s of sprays) {
      const k = s.guest_name.trim().toLowerCase();
      const cur = m.get(k) ?? { name: s.guest_name.trim(), amt: 0 };
      cur.amt += s.amount_naira;
      m.set(k, cur);
    }
    return [...m.values()].sort((a, b) => b.amt - a.amt).slice(0, 8);
  }, [sprays]);

  return (
    <div className="wall pattern">
      <div className="wall-rain" aria-hidden="true">
        {falling.map((f) => (
          <FlutterNote key={f.key} seed={f.key * 31 + 7} amount={f.amount} mode="fall" style={{ left: `${f.left}%`, ["--delay" as string]: `${f.delay}s` } as React.CSSProperties} />
        ))}
      </div>

      <main className="wall-main">
        <h1>{title}</h1>
        {latest && (
          <p className="ticker" aria-live="polite" key={latest.id}>
            {latest.guest_name} sprayed <span>{naira(latest.amount_naira)}</span>
          </p>
        )}
        <div className="wall-total-label">Sprayed on {celebrant} so far</div>
        <div className="wall-total">{naira(total)}</div>
      </main>

      <aside className="wall-side">
        <div className="qr-box">
          <QRCodeSVG value={guestUrl} size={110} bgColor="#fcefd9" fgColor="#2a0820" marginSize={0} />
          <div>Scan to spray<small>{guestUrl.replace(/^https?:\/\//, "")}</small></div>
        </div>
        <div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>Top sprayers</h2>
          {board.length === 0 ? (
            <p className="muted">Who&apos;s going first?</p>
          ) : (
            <ol className="board">
              {board.map((b, i) => (
                <li key={b.name}><span className="pos">{i + 1}</span><span>{b.name}</span><span className="amt">{naira(b.amt)}</span></li>
              ))}
            </ol>
          )}
        </div>
      </aside>
    </div>
  );
}
