// Feature switches set in Vercel. NEXT_PUBLIC_ values are baked in at build time, so redeploy after changing.

/** Guests abroad can pick their country and pay with a foreign card. Turn on only once
 * Paystack has approved international payments (Settings → Preferences). */
export const ABROAD_ENABLED = process.env.NEXT_PUBLIC_ABROAD_ENABLED === "true";
