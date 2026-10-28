import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/admin";
import { clientId } from "@/lib/security";
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const key = String(form?.get("key") ?? "");
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
      }
    } catch {
      return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
    }
  }

  const valid = await isAdmin(key, clientId(request.headers));
  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin", request.url), 303);
  response.cookies.set({
    name: ADMIN_COOKIE,
    value: createAdminSessionToken(),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}
