/** @type {import('next').NextConfig} */

const dev = process.env.NODE_ENV !== "production";

// Only our own Supabase project may be contacted from the browser.
let supabase = "https://*.supabase.co wss://*.supabase.co";
try {
  const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").host;
  if (host) supabase = `https://${host} wss://${host}`;
} catch {}

// Content Security Policy: tells browsers exactly what the app is allowed to load,
// so injected scripts, rogue iframes and data-stealing requests are blocked.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://va.vercel-scripts.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${supabase} https://va.vercel-scripts.com`,
  "media-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

const security = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), fullscreen=(self), screen-wake-lock=(self)",
  },
];

// Pages that carry a private key or payment reference in the address.
const privatePage = [
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "no-store, max-age=0" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: security },
      { source: "/h/:path*", headers: privatePage },
      { source: "/admin/:path*", headers: privatePage },
      { source: "/e/:slug/spray", headers: privatePage },
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default nextConfig;
