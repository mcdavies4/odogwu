import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_SESSION_MAX_AGE, createAdminSessionToken } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
    }
  }

  const body = await request.json().catch(() => null) as { access_token?: unknown } | null;
  const accessToken = typeof body?.access_token === "string" ? body.access_token : "";
  const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!accessToken || accessToken.length > 10000 || !adminEmail || !supabaseUrl || !anonKey || !process.env.ADMIN_KEY) {
    return NextResponse.json({ error: "Could not verify administrator." }, { status: 401 });
  }

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { data, error } = await supabase.auth.getUser(accessToken);
    const authenticatedEmail = String(data.user?.email ?? "").trim().toLowerCase();
    if (error || !data.user || !authenticatedEmail || authenticatedEmail !== adminEmail) {
      return NextResponse.json({ error: "This account is not authorised for the admin area." }, { status: 403 });
    }

    const response = NextResponse.json({ ok: true });
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
  } catch {
    return NextResponse.json({ error: "Could not verify administrator." }, { status: 401 });
  }
}
