/** Shared footer: makes it plain that Odogwu never holds anyone's money. */
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
      <p className="footer-small">Odogwu by The 36th Solutions Ltd</p>
    </footer>
  );
}
