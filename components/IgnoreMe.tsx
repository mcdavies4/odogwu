"use client";
import { useEffect, useState } from "react";

export function IgnoreMe() {
  const [ignored, setIgnored] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      setIgnored(!!localStorage.getItem("odogwu:notrack"));
    } catch {
      setIgnored(false);
    }
  }, []);

  function toggle() {
    try {
      if (ignored) localStorage.removeItem("odogwu:notrack");
      else localStorage.setItem("odogwu:notrack", "1");
      setIgnored(!ignored);
    } catch {}
  }

  return (
    <div className="panel stack" style={{ gap: 10 }}>
      <strong>Your own visits</strong>
      <p className="small muted">
        {ignored === null
          ? "Checking this browser…"
          : ignored
            ? "This browser is not being counted, so your own testing won't inflate the numbers."
            : "This browser is being counted. Switch it off so your own testing doesn't inflate the numbers. It applies to this browser only, so repeat it on your phone."}
      </p>
      <button type="button" className="btn btn-ghost" style={{ minHeight: 44 }} onClick={toggle} disabled={ignored === null}>
        {ignored ? "Count my visits again" : "Don't count my visits on this device"}
      </button>
    </div>
  );
}
