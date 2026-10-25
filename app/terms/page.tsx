import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { COMPANY, COMPANY_ADDRESS, SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = { title: "Terms · Odogwu", description: "The rules for using Odogwu to spray money at celebrations." };

export default function Terms() {
  return (
    <LegalPage
      title="Terms of use"
      intro={
        <p>
          These terms are an agreement between you and {COMPANY} ({COMPANY_ADDRESS}), which runs Odogwu. By creating a
          celebration or buying a spray pack, you agree to them. The short version: <strong>spray packs are gifts, they go
          straight to the celebrant through Paystack, and Odogwu never holds the money.</strong>
        </p>
      }
    >
      <h2>1. What Odogwu is</h2>
      <p>
        Odogwu lets guests send money gifts to a celebrant from their phones and shows the spraying live on a screen. We are
        not a bank and we don&apos;t keep a wallet or balance for anyone. Payments are processed by Paystack, a licensed
        payment company, and paid by Paystack directly into the celebrant&apos;s bank account.
      </p>

      <h2>2. Hosts and celebrants</h2>
      <ul>
        <li>You must be at least 18 and allowed to receive money into the bank account you add.</li>
        <li>We ask your bank to confirm the account name, and we show that name to guests so they know who they&apos;re paying. Don&apos;t add an account that isn&apos;t yours or the celebrant&apos;s.</li>
        <li>Your host link gives full control of the celebration. Keep it private. Anyone with it can see who sprayed.</li>
        <li>You&apos;re responsible for your event and for how you describe it to guests.</li>
        <li>If a celebration is created through a venue partner&apos;s link, that venue can see the celebration&apos;s name, date and total sprayed, but not your guest list.</li>
      </ul>

      <h2>3. Guests and spray packs</h2>
      <ul>
        <li><strong>A spray pack is a gift to the celebrant.</strong> Once it&apos;s paid, the money belongs to the celebrant, even if you don&apos;t swipe every note on screen.</li>
        <li><strong>Spray packs can&apos;t be refunded.</strong> Please check the celebration name and the payee name before you pay.</li>
        <li>You pay a service fee on top of the pack (shown before you pay). It covers payment charges and runs Odogwu, and it isn&apos;t refundable.</li>
        <li>If you pay with a card from outside Nigeria, your bank converts the amount from naira and may add its own charges.</li>
        <li>If you choose to spray anonymously, your name won&apos;t appear on the wall. If you give a name anyway, only the celebrant sees it.</li>
      </ul>

      <h2>4. When the money arrives</h2>
      <p>
        Paystack normally pays the celebrant the next working day, so a weekend celebration usually settles on Monday.
        Bank holidays, bank delays and Paystack&apos;s own checks can make it take longer. These are outside our control.
      </p>

      <h2>5. Mistakes, disputes and chargebacks</h2>
      <ul>
        <li>If something went wrong with a payment, contact us first at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> with your payment reference. We&apos;ll help, but we can&apos;t reverse a gift that has already been paid to a celebrant.</li>
        <li>If a payment is reversed or charged back through a bank or Paystack, Paystack may recover that amount from the celebrant&apos;s future settlements.</li>
        <li>Making a false chargeback for a gift you knowingly gave may be treated as fraud.</li>
      </ul>

      <h2>6. Names and behaviour on the wall</h2>
      <p>
        Names on the spray wall are shown publicly at the event. Don&apos;t use names that are offensive, impersonate
        someone or advertise anything. We block some names automatically, and we can remove names, close a celebration or
        refuse service if Odogwu is misused, including for fraud or money laundering.
      </p>

      <h2>7. Premium wall themes</h2>
      <p>
        Hosts can pay a one-off fee to unlock extra wall themes for one celebration. This fee goes to Odogwu, not the
        celebrant, and isn&apos;t refundable once the themes are unlocked.
      </p>

      <h2>8. Our responsibility</h2>
      <p>
        We work hard to keep Odogwu running smoothly, but we provide it &quot;as is&quot; and can&apos;t promise it will
        always be available, for example if the venue&apos;s internet fails. As far as the law allows, we aren&apos;t
        liable for indirect losses, and our total liability to you is limited to the service fees you paid us. Nothing in
        these terms limits rights you have by law.
      </p>

      <h2>9. Changes and law</h2>
      <p>
        We may update these terms and will change the date at the top when we do. These terms are governed by the laws of
        the Federal Republic of Nigeria. See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>10. Contact</h2>
      <p>
        {COMPANY}, {COMPANY_ADDRESS}. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or use the{" "}
        <Link href="/help">Help page</Link>.
      </p>
    </LegalPage>
  );
}
