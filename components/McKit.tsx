"use client";
import { QRCodeSVG } from "qrcode.react";
import { Logo } from "./Note";

type Props = { url: string; celebrant: string; title: string; payee: string; backHref: string; dancingOn: boolean };

/** Page 1: what the MC says and when. Page 2: an A4 poster for the entrance. */
export function McKit({ url, celebrant, title, payee, backHref, dancingOn }: Props) {
  const short = url.replace(/^https?:\/\//, "");
  return (
    <div className="mc-page">
      <div className="cards-controls no-print">
        <a className="btn btn-ghost" href={backHref}>Back to dashboard</a>
        <button type="button" className="btn" onClick={() => window.print()}>Print MC kit</button>
        <p className="small muted">Two pages: the MC&apos;s script, and a poster for the entrance or the stage.</p>
      </div>

      <article className="mc-sheet mc-script">
        <div className="mc-brand"><Logo /> ODOGWU · MC SCRIPT</div>
        <h1>{title}</h1>
        <p className="mc-sub">Spraying {celebrant} from your phones. Read these out at the right moments. Say it your own way!</p>

        <section>
          <h2>1. When guests are seated</h2>
          <blockquote>
            &quot;Ladies and gentlemen, tonight we&apos;re spraying {celebrant} the modern way! No cash wahala. Scan the code on
            your table, choose how much you want to spray, and swipe the notes up from your phone. Watch the big screen,
            your name go show!&quot;
          </blockquote>
        </section>

        <section>
          <h2>2. When the celebrant comes out to dance</h2>
          <blockquote>
            &quot;{celebrant} is on the floor! Bring out your phones, scan the code, and let the money rain! Who will be
            tonight&apos;s Odogwu? Look at the screen, the top sprayer gets the crown! 👑&quot;
          </blockquote>
          {dancingOn && <p className="mc-tip">Tip: set &quot;Now dancing&quot; on the dashboard each time a new group goes to the floor. It shows big on the screen.</p>}
        </section>

        <section>
          <h2>3. When the screen hits a milestone</h2>
          <blockquote>&quot;We just passed [amount] for {celebrant}! Who&apos;s taking us to the next one? Odogwu, where you dey?!&quot;</blockquote>
        </section>

        <section>
          <h2>4. Hype the top sprayer</h2>
          <blockquote>&quot;Chairman of the day! [Name] is leading! Who wan collect that crown?&quot;</blockquote>
          <p className="mc-tip">Some guests spray as &quot;Secret Odogwu 🤫&quot;. Play with it: &quot;Who is this Secret Odogwu?!&quot;</p>
        </section>

        <section>
          <h2>5. If anyone asks</h2>
          <ul>
            <li><strong>Where does the money go?</strong> Straight to {payee}&apos;s bank, by the next working day. Odogwu never holds it.</li>
            <li><strong>How do I pay?</strong> Card, bank transfer or USSD.</li>
            <li><strong>No app needed.</strong> It opens in the phone&apos;s browser.</li>
            <li><strong>Can I hide my name?</strong> Yes, switch on &quot;Spray anonymously&quot;.</li>
          </ul>
        </section>

        <section>
          <h2>6. Last call</h2>
          <blockquote>&quot;Last chance to spray {celebrant} tonight! Scan the code now, the screen is still live.&quot;</blockquote>
        </section>
      </article>

      <article className="mc-sheet mc-poster">
        <div className="poster-brand"><Logo /> ODOGWU</div>
        <p className="poster-kicker">No cash? No problem.</p>
        <h2 className="poster-title">Spray {celebrant}<br />from your phone</h2>
        <div className="poster-qr"><QRCodeSVG value={url} size={260} bgColor="#ffffff" fgColor="#2a0820" level="M" marginSize={0} /></div>
        <ol className="poster-steps">
          <li><span>1</span>Scan</li>
          <li><span>2</span>Pick an amount</li>
          <li><span>3</span>Swipe to spray</li>
        </ol>
        <p className="poster-payee">Money goes straight to <strong>{payee}</strong> · Card, transfer or USSD</p>
        <p className="poster-url">{short}</p>
      </article>
    </div>
  );
}
