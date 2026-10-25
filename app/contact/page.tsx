import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { COMPANY, COMPANY_ADDRESS, SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = { title: "Contact · Odogwu", description: "Get help with Odogwu." };

export default function Contact() {
  const subject = encodeURIComponent("Odogwu help");
  const body = encodeURIComponent("Celebration name:\nPayment reference (starts with odg_):\nWhat happened:\n");
  return (
    <LegalPage title="Get help" dated={false} intro={<p>We&apos;re a small team and we read every message.</p>}>
      <a className="btn btn-block" href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`}>Email {SUPPORT_EMAIL}</a>

      <h2>To help us help you faster, include</h2>
      <ul>
        <li>The celebration name.</li>
        <li>Your <strong>payment reference</strong>. It starts with <code>odg_</code> and is shown at the bottom of your spray screen, and in your Paystack receipt email.</li>
        <li>What happened, and roughly when.</li>
      </ul>

      <h2>Quick answers</h2>
      <p><strong>I paid but can&apos;t see my notes.</strong> If you paid by bank transfer, it can take a minute or two. Keep the spray screen open. You can also reopen the celebration link and tap &quot;Continue spraying your last pack&quot;.</p>
      <p><strong>When does the celebrant get the money?</strong> Paystack pays them the next working day. See <Link href="/#fees">how fees work</Link>.</p>
      <p><strong>Can I get a refund?</strong> Spray packs are gifts and go straight to the celebrant, so we can&apos;t refund them. See our <Link href="/terms">Terms</Link>.</p>
      <p><strong>I lost my host link.</strong> Open Odogwu on the phone or laptop you used to create the celebration: it&apos;s under &quot;Your celebrations&quot; on the home page. Or <Link href="/host/login">sign in with the email you used</Link> and we&apos;ll send you a code.</p>

      <p className="muted small" style={{ marginTop: 28 }}>{COMPANY}, {COMPANY_ADDRESS}</p>
    </LegalPage>
  );
}
