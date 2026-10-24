# Odogwu v1: digital money spraying

Guests scan a QR code, buy a spray pack with Paystack (card / transfer / USSD), and swipe notes that rain on a live projector wall. The celebrant's share settles straight to their bank via a **Paystack subaccount split**, next working day (T+1). Odogwu never holds funds — no wallet, no stored value.

**Stack:** Next.js 16 (App Router) · TypeScript · Supabase (Postgres + Realtime) · Paystack · installable PWA.

## How the money flows

1. Celebrant creates a celebration → account name resolved by Paystack → **subaccount** created.
2. Guest buys a pack: pays `pack + fee`. `transaction_charge = fee` goes to Odogwu's main account (Paystack's fee comes out of it, `bearer: account`). The full pack value settles to the celebrant.
3. Payment is confirmed server-side (`/transaction/verify` + webhook). Amount and currency are checked.
4. Each swipe calls `spray_note()` in Postgres, which locks the payment row so nobody can spray more than they paid.
5. Unsprayed balance is still the celebrant's. The pack is a gift once paid.

## Pages

| Route | What it is |
|---|---|
| `/` | Landing |
| `/demo` | Swipe demo, no payment or database (good for showing people) |
| `/host/new` | Create a celebration (bank + account resolve) |
| `/h/[slug]?key=…` | Private host dashboard: QR code, totals, open/close |
| `/e/[slug]` | Guest page: buy a spray pack |
| `/e/[slug]/spray?reference=…` | Swipe-to-spray screen (Paystack returns here) |
| `/e/[slug]/wall` | Live spray wall for the projector |

## Setup (about 15 minutes)

### 1. Supabase
- New project → **SQL Editor** → paste `supabase/schema.sql` → Run.
- **Project Settings → API**: copy URL, `anon` key, `service_role` key.

### 2. Paystack
- **Settings → API Keys & Webhooks**: copy the secret key (test first: `sk_test_…`).
- Set **Webhook URL** to `https://YOUR-DOMAIN/api/paystack/webhook`.
- Make sure your business is activated for live mode before real parties. Describe it to Paystack as an *event gifting marketplace using split payments*, which is exactly what it is.

### 3. Run locally (PowerShell)
```powershell
cd odogwu
copy .env.example .env.local   # then fill in the values
npm install
npm run dev
```
Open http://localhost:3000/demo on your laptop, or use your laptop's IP on your phone.

### 4. Push to GitHub (PowerShell)
```powershell
cd odogwu
git init
git add .
git commit -m "Odogwu v1"
git branch -M main
git remote add origin https://github.com/mcdavies4/odogwu.git
git push -u origin main
```
(Create the empty `odogwu` repo on GitHub first, with no README.)

### 5. Deploy on Vercel
Import the repo → add the env vars from `.env.example` (set `NEXT_PUBLIC_SITE_URL` to your real domain) → Deploy. Then update the Paystack webhook URL to the live domain.

## Testing a full flow (Paystack test mode)
1. `/host/new` → pick a bank and use a real 10-digit account (test mode resolve still works for most banks).
2. Open the host dashboard → **Open spray wall** in another tab.
3. Scan the QR or open the guest link → buy a pack → pay with Paystack's test card `4084 0840 8408 4081`, any future expiry, CVV `408`, OTP `123456`.
4. Swipe. Notes appear on the wall live.

## Settings
- `PLATFORM_FEE_PERCENT` (default 5): your cut, added on top of the pack. At 5% it covers Paystack's 1.5% + ₦100 (capped at ₦2,000) on every pack size.
- Packs and note values: `lib/money.ts`.

## Things to know
- **Payout timing:** T+1 working day. Weekend parties settle Monday. Say so to hosts (the app already does).
- **Refunds:** a split payment has already been allocated to the celebrant, so refunds have to be handled with Paystack support. Make your terms say packs are non-refundable gifts.
- **Flutterwave backup:** Flutterwave has the same subaccount/split model (`subaccounts` + `split_type`). Swap `lib/paystack.ts` if you ever need to.
- **Old native app listings:** point the App Store / Play Store "Odogwu" listings at this web app, or update them to a thin wrapper later.

## Next (v2 ideas)
- Diaspora guests paying in GBP (Stripe or Flutterwave GBP collection → NGN settlement)
- Host login instead of the private-link key
- MC mode: big-screen "Top sprayer" callouts, sound effects
- Downloadable spray report for the celebrant

## Before an event: test the projector laptop
Open `/demo/wall?stress=60` on the laptop that will run the spray wall. It fires 60 fake sprays a second (a very busy party). If notes fall smoothly, the laptop is fine. Use `?stress=200` for an extreme test.

Also open the app the day before: free Supabase projects pause after a week with no activity.

## Changing the note designs
The wall uses pre-rendered images of the notes (`public/notes/*.webp`) because spinning a picture is much lighter than redrawing vector art. After editing `components/Note.tsx`, run the site (`npm run build && npm run start`) and then:
```
pip install playwright pillow
python -m playwright install chromium
python scripts/render-notes.py
```

## See which venues opened your demo
1. In Supabase → SQL Editor, run `supabase/demo-visits.sql` once.
2. In Vercel → Settings → Environment Variables, add `ADMIN_KEY` (any long private word), then redeploy.
3. Open `https://YOUR-DOMAIN/admin/visits?key=YOUR_ADMIN_KEY`. Bookmark it.
4. Use **Make a tracking link** on that page to get a personal link for each venue you email (e.g. `/demo/wall?ref=eko-grand-hall`).

For overall traffic (including untagged links already sent), turn on **Analytics** in your Vercel project.

## Security
What's built in:
- **Payments can't be faked.** Every payment is re-checked with Paystack on the server (amount and currency), and the webhook signature is verified.
- **Nobody can spray more than they paid.** The database locks each spray pack.
- **Secrets stay on the server.** The Supabase service key and Paystack key are in files marked `server-only`; the build fails if browser code ever imports them.
- **Database locked down.** The public key can only read sprays from the last 3 days (for the live wall) and can't write anything.
- **Rate limits** on every action (bank lookups, creating celebrations, payments, sprays, demo tracking, admin login) so bots can't hammer the site or burn your Paystack quota. Limits are generous because a whole hall can share one Wi-Fi.
- **Admin lock-out** after 10 wrong keys in 15 minutes. Host and admin keys are compared in constant time.
- **Wall-safe names:** links, phone numbers, emails and offensive words are refused as guest or celebration names.
- **Browser protections:** Content Security Policy, no framing (stops click-jacking), strict referrer rules so private links don't leak, and private pages are never cached or indexed.
- **Analytics never records** host keys or payment references.
- **Won't go blank mid-party:** crash pages, a self-reloading spray wall, and the projector screen is kept awake.
- **Keep-alive:** a daily Vercel Cron job pings the database so Supabase never pauses.

**One-time setup:** run `supabase/security.sql` in Supabase → SQL Editor.

**Your checklist**
1. Turn on two-factor login for GitHub, Vercel, Supabase and Paystack.
2. Keep the GitHub repo **private**.
3. Make `ADMIN_KEY` at least 20 random characters.
4. Never paste the Supabase service key or Paystack secret key into chat, email or code. If one ever leaks, create a new one and update Vercel.
5. Tell hosts to show the spray wall on screen: its QR code is always genuine, and it shows the bank-verified name guests should see before paying.

## Spray report for the celebrant
On the host dashboard, tap **Spray report**. It lists every guest who sprayed, what they gave, how many packs, when, and their email if they gave one, sorted from the biggest sprayer down.
- **Download spreadsheet** for Excel or Google Sheets (safe against formula tricks in guest names).
- **Print or save as PDF** for a clean white keepsake copy to send the couple.
Totals read every record, so they stay correct for very big parties (thousands of notes).
