// Where diaspora guests can say they're spraying from. Shown as a flag on the wall.

export const COUNTRIES: { code: string; name: string }[] = [
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "IE", name: "Ireland" },
  { code: "DE", name: "Germany" },
  { code: "NL", name: "Netherlands" },
  { code: "IT", name: "Italy" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "BE", name: "Belgium" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "QA", name: "Qatar" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "ZA", name: "South Africa" },
  { code: "GH", name: "Ghana" },
  { code: "KE", name: "Kenya" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "CN", name: "China" },
  { code: "MY", name: "Malaysia" },
  { code: "IN", name: "India" },
  { code: "TR", name: "Türkiye" },
  { code: "PL", name: "Poland" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "FI", name: "Finland" },
  { code: "DK", name: "Denmark" },
  { code: "CH", name: "Switzerland" },
  { code: "AT", name: "Austria" },
  { code: "PT", name: "Portugal" },
  { code: "BR", name: "Brazil" },
  { code: "JP", name: "Japan" },
];

/** "GB" → 🇬🇧 */
export function flagOf(code: string): string {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

export function isCountry(code: unknown): code is string {
  return typeof code === "string" && COUNTRIES.some((c) => c.code === code);
}

const FLAG_AT_END = /\s?([\u{1F1E6}-\u{1F1FF}]{2})$/u;

/** The flag at the end of a guest's name, if they sprayed from abroad. */
export function flagIn(name: string): string | null {
  const m = name.trim().match(FLAG_AT_END);
  return m ? m[1] : null;
}
