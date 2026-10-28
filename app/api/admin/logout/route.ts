import { NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-session";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) {
        return NextResponse.redirect(new URL("/admin", request.url), 303);
      }
    } catch {
      return NextResponse.redirect(new URL("/admin", request.url), 303);
    }
  }
  const response = NextResponse.redirect(new URL("/admin/login", request.url), 303);
  response.cookies.set({ name: ADMIN_COOKIE, value: "", httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/admin", maxAge: 0 });
  return response;
}
