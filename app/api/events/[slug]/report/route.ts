import { allow, clientId, tooMany } from "@/lib/security";
import { buildReport, hostEvent } from "@/lib/report";

export const dynamic = "force-dynamic";

// Spreadsheet (CSV) download of everyone who sprayed. Host key required.
// Stops spreadsheet apps from treating a guest's name as a formula.
function cell(v: string | number | null): string {
  let s = v === null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
}

const lagosTime = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Africa/Lagos", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const who = clientId(req.headers);
  if (!(await allow(`report:${who}`, 60, 20))) return tooMany();
  const { slug } = await ctx.params;
  const key = new URL(req.url).searchParams.get("key");
  const ev = await hostEvent(slug, key, who);
  if (!ev) return new Response("Not found", { status: 404 });

  const r = await buildReport(ev.id);
  const rows: (string | number | null)[][] = [
    ["Position", "Guest", "Anonymous", "Gift (NGN)", "Sprayed on screen (NGN)", "Spray packs", "Email", "First spray (Lagos time)", "Last spray (Lagos time)"],
    ...r.guests.map((g, i) => [i + 1, g.name, g.anonymous ? "Yes (keep private)" : "", g.gift, g.sprayed, g.packs, g.email, lagosTime(g.first), lagosTime(g.last)]),
    [],
    ["", "TOTAL", "", r.total, r.sprayed, r.packs, "", "", ""],
  ];
  const csv = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
  const file = `${ev.slug}-spray-report.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
