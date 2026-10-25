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
- `PLATFORM_FEE_PERCENT` (default 5) and `PLATFORM_FEE_FLAT` (default 100): the guest's service fee is 5% + ₦100 on top of the pack. Paystack's charge (1.5%, plus ₦100 on payments of ₦2,500 and over, capped at ₦2,000) comes out of it, leaving Odogwu about 3.2–4% of each pack.
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

## Anonymous spraying
Guests can switch on **Spray anonymously**. They appear on the wall and leaderboard as "Secret Odogwu 🤫", and their name never reaches the screen or anyone's phone. They can optionally leave their name for the celebrant's private spray report.

**One-time setup:** run `supabase/anonymous.sql` in Supabase → SQL Editor. (Until you do, anonymous sprays still work and stay anonymous; the optional private name just isn't saved.)

## New in this version

**One-time setup:** run `supabase/features.sql` in Supabase → SQL Editor. Then add `THEME_PRICE_NAIRA` and `NEXT_PUBLIC_SUPPORT_EMAIL` in Vercel (see `.env.example`) and redeploy.

| Feature | Where |
|---|---|
| Terms, Privacy, Help pages | `/terms`, `/privacy`, `/contact`, linked from every footer. Have a Nigerian lawyer review them before launch. |
| Printable QR table cards | Host dashboard → **Table cards** (6 per A4, colour or ink-saver) |
| Spray from abroad | **Off until you set `NEXT_PUBLIC_ABROAD_ENABLED=true`** in Vercel and redeploy. Only do that after Paystack approves international payments. Then the guest page shows "I'm spraying from abroad" and flags appear on the wall. |
| Now dancing | Host dashboard → **Now dancing**. Shows on the wall and guests' phones within a few seconds. |
| "I sprayed" share card | Guests get it after spraying; share to status or download |
| Highlight reel | Host dashboard → **Highlight reel**: plays, and saves as a video. Example: `/demo/recap` |
| Venue partners | `/admin/venues?key=ADMIN_KEY` to add a venue; they get `/v/...` dashboard and a client link. Pay their share yourself, e.g. monthly. |
| Premium wall themes | Host dashboard → **Wall theme**. One-off unlock via Paystack (to your own balance). Preview: `/demo/wall?theme=wedding` |

**Privacy promise to keep:** the Privacy Policy says celebration records are deleted 24 months after the event. Do this once a year in Supabase:
```sql
delete from events where created_at < now() - interval '24 months';
```

## Host sign-in, rehearsal checklist, MC kit

**One-time setup**
1. Run `supabase/login.sql` in Supabase → SQL Editor.
2. Create a free account at resend.com → **API Keys** → create a key. In Vercel add `RESEND_API_KEY` (and `EMAIL_FROM` once your domain is verified), then redeploy.
3. Until your domain is verified in Resend, emails only reach your own Resend account email. Verify the domain (Resend → Domains) as soon as you buy it.

| Feature | Where |
|---|---|
| Host email | Required on "Create a celebration". The host gets an email with their private link straight away. |
| Host sign-in | `/host/login` (also in the home page top bar). They get an email with a one-tap **magic link** and a 6-digit code as backup (10 minutes, single use, 3 emails per 10 minutes). The link opens a page with a Sign in button, so email scanners can't use it up. |
| Rehearsal checklist | Top of every host dashboard. 9 checks for the day before; ticks are saved on the device. |
| MC kit | Dashboard → **MC kit**: printable MC script (6 moments) and an A4 entrance poster with the QR. |

Celebrations created before this update have no email saved, so their hosts still need the private link.

## Self-serve and automation

Odogwu runs itself: hosts, guests and partners fix most problems without contacting you, and you hear about the rest by email.

**What it does on its own**
- **Help centre** (`/help`): searchable answers for guests, hosts and partners. Guests can check any spray pack with Paystack and go straight back to their notes. The "Message us" form checks any payment reference automatically before it reaches you, emails you (reply goes straight to them), and sends them a confirmation.
- **Hosts fix their own details**: change the celebration name/date, change the payout account (the bank name is checked, a new Paystack subaccount is made, and the host is emailed every time), and see payouts straight from Paystack.
- **Partners sign themselves up** (`/partners`): venues and planners get their dashboard and client link instantly, by email too. They sign back in with their email like hosts. You get an email for each new partner and can change their share on the Partners admin page.
- **Every morning at 7am Lagos time** (`/api/cron/daily`): re-checks unconfirmed payments with Paystack, emails hosts their rehearsal checklist the day before and their results the morning after, and emails you one summary of what happened and anything that needs you.
- **Instant alerts** to you if guests can't pay, a celebration can't be created, a Paystack webhook fails, or a payment arrives at the wrong amount (max one email per problem type every 10 minutes).
- **Your inbox** (`/admin/inbox`): open help requests and this week's problems in one place.

**One-time setup**
1. Run `supabase/automation.sql` in Supabase → SQL Editor.
2. In Vercel, add `ADMIN_EMAIL`, `CRON_SECRET` and `PARTNER_SHARE_PERCENT` (see `.env.example`), then redeploy.
3. Make sure `RESEND_API_KEY` is set and your domain is verified in Resend, or no emails go out.
