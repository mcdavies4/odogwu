import { Note, NoteBack } from "./Note";

/**
 * A note that tumbles through the air like real cash:
 * outer layer follows the path (fall or fly up), middle layer sways side to side,
 * inner layer spins in 3D around a random axis so you see the front and back flip.
 */
export type FlutterProps = {
  amount: number;
  mode: "fall" | "fly";
  loop?: boolean;
  style?: React.CSSProperties;
  seed?: number;
};

function rand(seed: number) {
  // small deterministic PRNG so server and client render the same values
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

export function FlutterNote({ amount, mode, loop, style, seed = Math.floor(Math.random() * 1e9) }: FlutterProps) {
  const r = rand(seed + 1);
  const vars = {
    "--dur": `${mode === "fly" ? 1.7 + r() * 0.5 : 3.8 + r() * 2.2}s`,
    "--delay": "0s",
    "--sway": `${0.7 + r() * 0.8}s`,
    "--sway-x": `${18 + r() * 40}px`,
    "--spin": `${mode === "fly" ? 0.55 + r() * 0.35 : 1.1 + r() * 1.4}s`,
    "--ax": (0.6 + r() * 0.4).toFixed(2),
    "--ay": (r() * 0.8 - 0.4).toFixed(2),
    "--az": (r() * 0.5).toFixed(2),
    "--drift": `${r() * 160 - 80}px`,
    "--tilt": `${r() * 60 - 30}deg`,
    ...style,
  } as React.CSSProperties;

  return (
    <div className={`flutter flutter-${mode}${loop ? " flutter-loop" : ""}`} style={vars} aria-hidden="true">
      <div className="flutter-path">
        <div className="flutter-sway">
          <div className="flutter-tilt">
            <div className="flutter-tumble">
              <Note amount={amount} className="flutter-face" />
              <NoteBack amount={amount} className="flutter-face flutter-back" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
