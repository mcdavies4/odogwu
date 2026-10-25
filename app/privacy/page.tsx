import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { COMPANY, COMPANY_ADDRESS, SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = { title: "Privacy · Odogwu", description: "What Odogwu collects, why, and your rights under Nigerian data protection law." };

export default function Privacy() {
  return (
    <LegalPage
      title="Privacy policy"
      intro={
        <p>
          {COMPANY} ({COMPANY_ADDRESS}) runs Odogwu and is responsible for your personal data under the Nigeria Data
          Protection Act 2023. We collect as little as we can, we never see card details, and we never sell your data.
        </p>
      }
    >
      <h2>What we collect</h2>
      <h3>From hosts</h3>
      <ul>
        <li>Celebration name, date and who it&apos;s for.</li>
        <li>The payout bank and account number. Paystack uses the full number to confirm the account name and pay you; <strong>we only store the bank name, the confirmed account name and the last 4 digits.</strong></li>
        <li>An optional phone number.</li>
      </ul>
      <h3>From guests</h3>
      <ul>
        <li>The name you choose to show on the wall (or none, if you spray anonymously).</li>
        <li>An optional email for your receipt, and the country you&apos;re spraying from if you choose one.</li>
        <li>What you paid and sprayed, with the payment reference.</li>
        <li><strong>We never see or store your card or bank login details.</strong> Paystack handles those.</li>
      </ul>
      <h3>From everyone</h3>
      <ul>
        <li>Security data: a scrambled (hashed) version of your internet address, used only to stop abuse such as bots. We don&apos;t store the address itself.</li>
        <li>Basic, anonymous usage statistics (pages visited, country). Private links and payment references are removed first.</li>
        <li>Your phone remembers a few things locally, like your name and celebrations you host, so you don&apos;t have to retype them. This stays on your device.</li>
      </ul>

      <h2>Why we use it</h2>
      <ul>
        <li><strong>To provide Odogwu</strong> (our contract with you): take payments, show sprays on the wall, pay celebrants, produce the spray report.</li>
        <li><strong>To keep it safe</strong> (legitimate interest): prevent fraud, abuse and offensive names.</li>
        <li><strong>To meet the law</strong>: keep payment records where required.</li>
      </ul>

      <h2>Who sees it</h2>
      <ul>
        <li><strong>Everyone at the event</strong> sees names and amounts on the spray wall, unless you spray anonymously.</li>
        <li><strong>The host</strong> sees the full list of who sprayed, emails guests chose to give, and private names of anonymous guests who gave one.</li>
        <li><strong>Venue partners</strong> see only the name, date and total of celebrations created through their link.</li>
        <li><strong>Our service providers</strong>, only to run Odogwu: Paystack (payments), Supabase (database) and Vercel (hosting). Some of their servers are outside Nigeria; we use providers with strong security and contractual protections for these transfers.</li>
        <li>Authorities, only where the law requires it.</li>
      </ul>

      <h2>How long we keep it</h2>
      <p>
        Unfinished payments are deleted after 7 days. Celebration records are kept for up to 24 months after the event so
        hosts can download their reports, then deleted, unless the law requires us to keep payment records longer. You can
        ask us to delete your data sooner.
      </p>

      <h2>Your rights</h2>
      <p>
        You can ask to see, correct, delete or receive a copy of your personal data, object to how we use it, or withdraw
        consent. Email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> and we&apos;ll respond within the time the
        law requires. If you&apos;re unhappy with our answer, you can complain to the Nigeria Data Protection Commission
        (NDPC).
      </p>

      <h2>Children</h2>
      <p>Hosts must be 18 or over. We don&apos;t knowingly collect data from children.</p>

      <h2>Changes</h2>
      <p>
        We&apos;ll update this page and its date if anything changes. See also our <Link href="/terms">Terms of use</Link>.
      </p>
    </LegalPage>
  );
}
