import { LegalPage } from "@/components/LegalPage";
import { DeleteRequest } from "@/components/DeleteRequest";
import { SUPPORT_EMAIL } from "@/lib/contact";

export const metadata = { title: "Delete your data · Odogwu", description: "Ask Odogwu to delete your account and the data linked to it." };

// Linked from the footer of every page (and so from inside the Android app), and given to Google Play as the deletion URL.
export default function DeleteAccount() {
  return (
    <LegalPage title="Delete your account and data" dated={false}
      intro={<p>Hosts, partners and guests can ask us to delete their data here. We confirm by email and complete it within 30 days.</p>}>
      <h2>What we delete</h2>
      <ul>
        <li><strong>Hosts:</strong> your email, phone number and sign-in details, and the payout account details on your celebrations.</li>
        <li><strong>Partners (venues and planners):</strong> your partner dashboard, contact details and email.</li>
        <li><strong>Guests:</strong> your name and email on spray packs you bought. On the spray wall and reports you&apos;re shown as &quot;Anonymous&quot;.</li>
      </ul>
      <h2>What we have to keep</h2>
      <p>Records of payments (amount, date and Paystack reference) are kept for as long as the law requires financial records to be kept, with your name and email removed. Paystack keeps its own payment records under its own policy.</p>
      <h2>Ask for deletion</h2>
      <DeleteRequest />
      <p className="small muted" style={{ marginTop: 18 }}>Or email {SUPPORT_EMAIL} from the address you used with Odogwu, with the subject &quot;Delete my data&quot;.</p>
    </LegalPage>
  );
}
