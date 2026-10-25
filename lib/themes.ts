// Spray wall themes. Classic is free; the rest are a one-off unlock per celebration.

export type ThemeId = "classic" | "wedding" | "praise" | "birthday" | "naija";

export const THEMES: { id: ThemeId; name: string; blurb: string; premium: boolean; swatch: [string, string, string] }[] = [
  { id: "classic", name: "Owambe Classic", blurb: "Wine and gold", premium: false, swatch: ["#2a0820", "#f2b705", "#fcefd9"] },
  { id: "wedding", name: "White Wedding", blurb: "Ivory, champagne and gold", premium: true, swatch: ["#fbf6ec", "#b8860b", "#2b2118"] },
  { id: "praise", name: "Praise Night", blurb: "Royal blue and gold, for church events", premium: true, swatch: ["#0b1f4d", "#f5c542", "#eef3ff"] },
  { id: "birthday", name: "Birthday Bash", blurb: "Hot pink, purple and confetti", premium: true, swatch: ["#3b0a57", "#ff4fa3", "#fff1fa"] },
  { id: "naija", name: "Naija Pride", blurb: "Green and white", premium: true, swatch: ["#0b4d2c", "#ffffff", "#e9fff3"] },
];

export function isThemeId(v: unknown): v is ThemeId {
  return typeof v === "string" && THEMES.some((t) => t.id === v);
}

export function themeOf(v: unknown): ThemeId {
  return isThemeId(v) ? v : "classic";
}

export function isPremium(id: ThemeId) {
  return THEMES.find((t) => t.id === id)?.premium ?? false;
}
