"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function ToggleOpen({ slug, hostKey, open }: { slug: string; hostKey: string; open: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (open && !confirm("Close spraying? Guests won't be able to buy new spray packs.")) return;
    setBusy(true);
    await fetch(`/api/events/${slug}/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: hostKey, open: !open }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button className="btn btn-ghost" onClick={toggle} disabled={busy} type="button">
      {open ? "Close spraying" : "Reopen spraying"}
    </button>
  );
}
