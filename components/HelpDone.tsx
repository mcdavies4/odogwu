"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function HelpDone({ id, adminKey, done }: { id: number; adminKey: string; done: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="chip" disabled={busy} onClick={async () => {
      setBusy(true);
      await fetch("/api/admin/help", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ id, done: !done }) });
      setBusy(false);
      router.refresh();
    }}>{done ? "Reopen" : "Mark done ✓"}</button>
  );
}
