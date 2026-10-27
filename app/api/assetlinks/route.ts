import { NextResponse } from "next/server";

/**
 * Served at /.well-known/assetlinks.json (see next.config.mjs). It tells Android that the Odogwu
 * app may open this site full screen, with no browser bar, and open odogwu.online links.
 *
 * ANDROID_PACKAGE: the app's package name (e.g. online.odogwu.app, or the old app's if you're updating that listing)
 * ANDROID_SHA256:  comma-separated SHA-256 certificate fingerprints. Add BOTH the "App signing key" and the
 *                  "Upload key" fingerprints from Play Console → Test and release → App integrity.
 */
export const dynamic = "force-dynamic";

export function GET() {
  const pkg = (process.env.ANDROID_PACKAGE || "online.odogwu.app").trim();
  const fingerprints = (process.env.ANDROID_SHA256 || "")
    .split(",")
    .map((f) => f.trim().toUpperCase())
    .filter((f) => /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(f));
  const body = fingerprints.length
    ? [{ relation: ["delegate_permission/common.handle_all_urls"], target: { namespace: "android_app", package_name: pkg, sha256_cert_fingerprints: fingerprints } }]
    : [];
  return NextResponse.json(body, { headers: { "Cache-Control": "public, max-age=3600" } });
}
