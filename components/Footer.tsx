import Link from "next/link";
import { COMPANY, SUPPORT_EMAIL } from "@/lib/contact";

/** Shared footer: makes it plain that Odogwu never holds anyone's money, and how to get help. */
export function Footer() {
  return (
    <footer className="footer">
      <p className="footer-trust">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z" /><path d="M9 12l2 2 4-4" />
        </svg>
        <strong>Odogwu never holds your money.</strong>
      </p>
      <p>
        Every payment is processed by Paystack and paid straight into the celebrant&apos;s own bank account, usually the next
        working day. There&apos;s no Odogwu wallet or balance.
      </p>
      <nav className="footer-links" aria-label="Footer">
        <Link href="/#fees">Fees</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Help</Link>
      </nav>
      <p className="footer-small">
        Need help? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <br />Odogwu by {COMPANY}
      </p>
    </footer>
  );
}
