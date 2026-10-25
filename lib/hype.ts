// Stored name for anonymous guests, and how the wall shows them.
export const ANONYMOUS = "Anonymous";
export const SECRET_LABEL = "Secret\u00a0Odogwu\u00a0🤫";
export const displayName = (name: string) => (name.trim() === ANONYMOUS ? SECRET_LABEL : name.trim());

const SECRET_LINES = [
  ["is spraying in secret!", "no name, just love!"],
  ["no name, big love! 🔥", "the money is raining!"],
  ["somebody is not playing! 👑", "who is this Odogwu?!"],
  ["the whole hall wants to know who! 👑", "a legend in disguise!"],
];

const ABROAD_LINES = [
  ["is spraying all the way from abroad! ✈️", "distance is not a barrier!"],
  ["the love crossed the ocean! 🌍", "sending it from abroad! ✈️"],
  ["diaspora don land! 👑", "abroad money is landing!"],
  ["the whole diaspora is shaking! 👑", "a global Odogwu!"],
];

// What the wall says about a guest's spraying streak. Grows with the amount.
export const TIERS = [
  { min: 1_000, lines: ["is spraying!", "is showing love!", "don land!"] },
  { min: 10_000, lines: ["Odogwu! 🔥", "the money is raining!", "na you biko!"] },
  { min: 50_000, lines: ["Chairman of the day! 👑", "Big Odogwu!", "money no be problem!"] },
  { min: 200_000, lines: ["Odogwu of odogwus! 👑", "this one na legend!", "the whole hall dey shake!"] },
];

export function tierFor(amount: number): number {
  let t = -1;
  TIERS.forEach((tier, i) => { if (amount >= tier.min) t = i; });
  return t;
}

export type GuestKind = "normal" | "secret" | "abroad";

export function kindOf(name: string): GuestKind {
  if (name === SECRET_LABEL || name.trim() === ANONYMOUS) return "secret";
  return /[\u{1F1E6}-\u{1F1FF}]{2}$/u.test(name.trim()) ? "abroad" : "normal";
}

export function lineFor(tier: number, seed: number, kind: GuestKind | boolean = "normal"): string {
  const k: GuestKind = kind === true ? "secret" : kind === false ? "normal" : kind;
  const t = Math.max(0, tier);
  const lines = k === "secret" ? SECRET_LINES[t] : k === "abroad" ? ABROAD_LINES[t] : TIERS[t].lines;
  return lines[Math.abs(seed) % lines.length];
}

export const MILESTONES = [
  50_000, 100_000, 250_000, 500_000, 1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000,
];

export function crossedMilestone(prev: number, next: number): number | null {
  let hit: number | null = null;
  for (const m of MILESTONES) if (prev < m && next >= m) hit = m;
  return hit;
}
