// Spray wall themes. Classic is free; the rest are a one-off unlock per celebration.

export type ThemeId =
  | "classic" | "wedding" | "praise" | "birthday" | "naija"
  | "gold" | "coral" | "royal" | "emerald" | "rosegold" | "ankara" | "club" | "december" | "life";

export const THEMES: { id: ThemeId; name: string; blurb: string; premium: boolean; swatch: [string, string, string] }[] = [
  { id: "classic", name: "Owambe Classic", blurb: "Wine and gold", premium: false, swatch: ["#2a0820", "#f2b705", "#fcefd9"] },
  { id: "wedding", name: "White Wedding", blurb: "Ivory, champagne and gold", premium: true, swatch: ["#fbf6ec", "#b8860b", "#2b2118"] },
  { id: "praise", name: "Praise Night", blurb: "Royal blue and gold, for church events", premium: true, swatch: ["#0b1f4d", "#f5c542", "#eef3ff"] },
  { id: "birthday", name: "Birthday Bash", blurb: "Hot pink, purple and confetti", premium: true, swatch: ["#3b0a57", "#ff4fa3", "#fff1fa"] },
  { id: "naija", name: "Naija Pride", blurb: "Green and white", premium: true, swatch: ["#0b4d2c", "#ffffff", "#e9fff3"] },
  { id: "gold", name: "Black & Gold", blurb: "Black-tie luxury with a moving gold shine", premium: true, swatch: ["#0d0b08", "#e8c15a", "#fff8e6"] },
  { id: "coral", name: "Coral & Gold", blurb: "Traditional wedding: deep red, coral beads", premium: true, swatch: ["#5c0f14", "#ff7a59", "#f0b34a"] },
  { id: "royal", name: "Royal Purple", blurb: "Purple, gold and spotlights for the big chiefs", premium: true, swatch: ["#24083f", "#f2c94c", "#f6efff"] },
  { id: "emerald", name: "Emerald Luxe", blurb: "Emerald and gold, art-deco fans", premium: true, swatch: ["#032b22", "#d4af37", "#effbf6"] },
  { id: "rosegold", name: "Rose Gold", blurb: "Blush and rose gold with glitter", premium: true, swatch: ["#fbeee9", "#b76e79", "#3d2420"] },
  { id: "ankara", name: "Ankara", blurb: "Bold print in orange, teal and yellow", premium: true, swatch: ["#0e4d5c", "#f28c28", "#ffd23f"] },
  { id: "club", name: "Afrobeats Night", blurb: "Neon pink and blue, after-party energy", premium: true, swatch: ["#07040f", "#ff2bd6", "#2bd9ff"] },
  { id: "december", name: "Detty December", blurb: "Festive green, red and twinkling lights", premium: true, swatch: ["#0f2f1f", "#e23c3c", "#ffcf4a"] },
  { id: "life", name: "Celebration of Life", blurb: "Calm black, white and soft gold", premium: true, swatch: ["#121417", "#d9c38a", "#f5f3ee"] },
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
