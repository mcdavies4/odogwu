import Link from "next/link";
import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin login · Odogwu", robots: { index: false, follow: false } };

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await hasAdminSession()) redirect("/admin");
  const { error } = await searchParams;
  return (
    <main className="wrap stack" style={{ minHeight: "80dvh", display: "grid", alignContent: "center", maxWidth: 460 }}>
      <Link href="/" className="brand">Odogwu</Link>
      <section className="panel stack" style={{ padding: 24 }}>
        <p className="small muted" style={{ margin: 0 }}>PRIVATE ADMIN AREA</p>
        <h1 style={{ fontSize: 30, margin: 0 }}>Sign in to Odogwu</h1>
        <p className="muted">Use the admin key configured by you in Vercel. This is separate from guest, host and partner accounts.</p>
        {error === "1" && <div className="error" role="alert">That admin key was not accepted. Check it and try again.</div>}
        <form className="stack" action="/api/admin/login" method="post">
          <label className="field">
            <span>Admin key</span>
            <input className="input" name="key" type="password" autoComplete="current-password" required minLength={8} autoFocus />
          </label>
          <button className="btn" type="submit">Sign in securely</button>
        </form>
        <p className="small muted" style={{ marginBottom: 0 }}>Your session expires after 12 hours. Do not share your admin key.</p>
      </section>
    </main>
  );
}
