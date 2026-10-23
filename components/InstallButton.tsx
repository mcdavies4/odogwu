"use client";
import { useEffect, useState } from "react";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

/**
 * "Install Odogwu" — Android/desktop Chrome get the real install prompt;
 * iPhone/iPad get a short sheet showing the Share → Add to Home Screen steps.
 * Hidden when the app is already installed.
 */
export function InstallButton({ className = "btn btn-ghost", label = "Install Odogwu" }: { className?: string; label?: string }) {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [installed, setInstalled] = useState(true); // assume installed until we check, so nothing flashes
  const [sheet, setSheet] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    const ua = navigator.userAgent;
    setIsIOS(/iPhone|iPad|iPod/.test(ua) || (ua.includes("Macintosh") && "ontouchend" in document));

    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!deferred && !isIOS)) return null;

  async function install() {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferred(null);
    } else {
      setSheet(true);
    }
  }

  return (
    <>
      <button type="button" className={className} onClick={install}>
        <AppGlyph /> {label}
      </button>
      {sheet && (
        <div className="install-backdrop" onClick={() => setSheet(false)} role="presentation">
          <div className="install-sheet" role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}>
            <h2 id="install-title">Add Odogwu to your Home Screen</h2>
            <ol className="install-steps">
              <li>
                <span className="install-n">1</span>
                <span>Tap the <strong>Share</strong> button <ShareGlyph /> in your browser bar.</span>
              </li>
              <li>
                <span className="install-n">2</span>
                <span>Scroll down and tap <strong>Add to Home Screen</strong> <PlusGlyph />.</span>
              </li>
              <li>
                <span className="install-n">3</span>
                <span>Tap <strong>Add</strong>. Odogwu opens from your Home Screen like any app.</span>
              </li>
            </ol>
            <button type="button" className="btn btn-block" onClick={() => setSheet(false)}>Got it</button>
          </div>
        </div>
      )}
    </>
  );
}

function AppGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
    </svg>
  );
}
function ShareGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share" style={{ verticalAlign: "-3px" }}>
      <path d="M12 3v13" /><path d="m7 8 5-5 5 5" /><path d="M5 12v8h14v-8" />
    </svg>
  );
}
function PlusGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" style={{ verticalAlign: "-3px" }}>
      <rect x="3" y="3" width="18" height="18" rx="4" /><path d="M12 8v8M8 12h8" />
    </svg>
  );
}
