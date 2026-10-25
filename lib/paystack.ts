import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// PAYSTACK_API_URL is only for local testing against a stand-in; leave it unset in Vercel.
const BASE = process.env.PAYSTACK_API_URL || "https://api.paystack.co";

function key(): string {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k) throw new Error("Missing PAYSTACK_SECRET_KEY");
  return k;
}

export class PaystackError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

async function ps<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.status === false) {
    throw new PaystackError(body.message || `Paystack error ${res.status}`, res.status);
  }
  return body.data as T;
}

export type Bank = { name: string; code: string; slug: string; active: boolean };

export async function listBanks(): Promise<Bank[]> {
  const res = await fetch(`${BASE}/bank?country=nigeria&currency=NGN&perPage=200`, {
    headers: { Authorization: `Bearer ${key()}` },
    next: { revalidate: 86400 },
  });
  const body = await res.json();
  if (!res.ok || body.status === false) throw new PaystackError(body.message || "Could not load banks");
  const seen = new Set<string>();
  return (body.data as Bank[])
    .filter((b) => b.active && !seen.has(b.code) && seen.add(b.code))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function resolveAccount(accountNumber: string, bankCode: string) {
  return ps<{ account_number: string; account_name: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`
  );
}

export async function createSubaccount(input: {
  businessName: string;
  bankCode: string;
  accountNumber: string;
  phone?: string;
}) {
  return ps<{ subaccount_code: string; settlement_bank: string; account_number: string }>("/subaccount", {
    method: "POST",
    body: JSON.stringify({
      business_name: input.businessName,
      settlement_bank: input.bankCode,
      account_number: input.accountNumber,
      // Overridden per transaction by transaction_charge, so this is never used.
      percentage_charge: 0,
      primary_contact_phone: input.phone || undefined,
      description: "Odogwu celebrant",
    }),
  });
}

export async function initializeTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  subaccount: string;
  platformChargeKobo: number;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return ps<{ authorization_url: string; access_code: string; reference: string }>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        amount: input.amountKobo,
        currency: "NGN",
        reference: input.reference,
        callback_url: input.callbackUrl,
        subaccount: input.subaccount,
        // Flat amount kept by Odogwu's main account; the rest settles to the celebrant.
        transaction_charge: input.platformChargeKobo,
        // Paystack's processing fee comes out of Odogwu's share, not the celebrant's.
        bearer: "account",
        channels: ["card", "bank_transfer", "ussd", "bank"],
        metadata: input.metadata,
      }),
    }
  );
}

/** A payment to Odogwu itself (e.g. premium wall themes): no subaccount, so it settles to Odogwu's balance. */
export async function initializeOwnTransaction(input: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}) {
  return ps<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      channels: ["card", "bank_transfer", "ussd", "bank"],
      metadata: input.metadata,
    }),
  });
}

export type VerifiedTx = {
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at: string | null;
};

export async function verifyTransaction(reference: string) {
  return ps<VerifiedTx>(`/transaction/verify/${encodeURIComponent(reference)}`);
}

export function isValidWebhook(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", key()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export type Settlement = { id: number; status: string; total_amount: number; effective_amount?: number; settlement_date: string | null; createdAt?: string };

/** Payouts Paystack has made (or is making) to one celebrant's subaccount, newest first. */
export async function listSubaccountSettlements(subaccountCode: string): Promise<Settlement[]> {
  // The settlement list filters by the subaccount's numeric id, so look that up from the code first.
  const sub = await ps<{ id: number }>(`/subaccount/${encodeURIComponent(subaccountCode)}`);
  return ps<Settlement[]>(`/settlement?subaccount=${sub.id}&perPage=20`);
}
