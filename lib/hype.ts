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

export function lineFor(tier: number, seed: number): string {
  const lines = TIERS[Math.max(0, tier)].lines;
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
