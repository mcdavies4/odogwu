import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login · Odogwu", robots: { index: false, follow: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string }> }) {
  if (await hasAdminSession()) redirect("/admin");
  const { error, sent } = await searchParams;

  return (
    <main className="wrap stack" style={{ minHeight: "80dvh", display: "grid", alignContent: "center", maxWidth: 460 }}>
      <Link href="/" className="brand">Odogwu</Link>
      <section className="panel stack" style={{ padding: 24 }}>
        <p className="small muted" style={{ margin: 0 }}>PRIVATE ADMIN AREA</p>
        <h1 style={{ fontSize: 30, margin: 0 }}>Sign in to Odogwu</h1>
        <p className="muted">Enter the designated administrator email. We’ll send a secure sign-in link if it is authorised.</p>
        {sent === "1" && <div className="notice" role="status">If the address is authorised and email delivery is configured, a sign-in link will arrive shortly. Check your inbox and junk folder.</div>}
        {error === "1" && <div className="error" role="alert">We couldn’t start sign-in. Check the administrator configuration and try again.</div>}
        <form className="stack" action="/api/admin/login" method="post">
          <label className="field">
            <span>Administrator email</span>
            <input className="input" name="email" type="email" autoComplete="email" required maxLength={254} autoFocus />
          </label>
          <button className="btn" type="submit">Email me a sign-in link</button>
        </form>
        <p className="small muted" style={{ marginBottom: 0 }}>Only the authorised administrator can enter this area. Sign-in links expire according to your Supabase Auth settings.</p>
      </section>
    </main>
  );
}
