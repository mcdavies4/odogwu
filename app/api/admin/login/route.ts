import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { allow, clientId } from "@/lib/security";

export const dynamic = "force-dynamic";

function loginRedirect(request: Request, status: "sent" | "error") {
  return NextResponse.redirect(new URL(status === "sent" ? "/admin/login?sent=1" : "/admin/login?error=1", request.url), 303);
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return loginRedirect(request, "error");
    } catch {
      return loginRedirect(request, "error");
    }
  }

  const form = await request.formData().catch(() => null);
  const email = String(form?.get("email") ?? "").trim().toLowerCase();
  const adminEmail = String(process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!email || email.length > 254 || !adminEmail || !supabaseUrl || !anonKey || !siteUrl) {
    return loginRedirect(request, "error");
  }
  // Do not reveal whether an email is on the administrator allowlist.
  if (email !== adminEmail) return loginRedirect(request, "sent");

  const permitted = await allow(`admin-email-login:${clientId(request.headers)}`, 900, 5);
  if (!permitted) return loginRedirect(request, "error");

  try {
    const supabase = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/admin/callback`,
        shouldCreateUser: true,
      },
    });
    if (error) return loginRedirect(request, "error");
    return loginRedirect(request, "sent");
  } catch {
    return loginRedirect(request, "error");
  }
}
