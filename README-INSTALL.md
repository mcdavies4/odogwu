# Odogwu dedicated admin login and dashboard

This package adds a dedicated login at `/admin/login`, a session-protected overview at `/admin`, and a session-protected user directory at `/admin/users`.

## Files to copy into the existing repository

Copy these paths into the repository, preserving the folder structure:

- `lib/admin-session.ts`
- `app/admin/login/page.tsx`
- `app/admin/page.tsx`
- `app/admin/users/page.tsx`
- `app/api/admin/login/route.ts`
- `app/api/admin/logout/route.ts`

Do not replace the existing `lib/admin.ts` or `lib/security.ts`; the new login uses the existing admin-key validation and rate limiting.

## Vercel configuration

In Vercel → Project → Settings → Environment Variables, set `ADMIN_KEY` to a long, unique secret (at least 32 random characters recommended). Apply it to Production and Preview as appropriate, then redeploy. Never put this value in GitHub or send it in a message.

## Login and URLs

- Login: `/admin/login`
- Overview: `/admin`
- User directory: `/admin/users`

Use the `ADMIN_KEY` value from Vercel to sign in. The app creates an HttpOnly, SameSite=Strict session cookie with a 12-hour expiry. In production the cookie is Secure. Logging out clears it.

## Test before production deployment

1. Run `npm run typecheck`.
2. Run `npm run build`.
3. Deploy to a Vercel Preview deployment first.
4. Test `/admin/login` with a wrong key and the correct key.
5. Confirm `/admin` and `/admin/users` redirect to login when signed out.
6. Confirm login opens the dashboard, user search/filter works, and logout ends the session.
7. Test that existing `/admin/inbox`, `/admin/venues`, and `/admin/visits` still work. Those legacy pages currently use their original key-based access flow and may ask for the key separately; this package does not migrate those legacy pages to cookie sessions.

## Schema assumptions

The dashboard only selects fields present in `supabase/schema.sql` and existing partner signup flow: `events.host_phone`, `payments.guest_email`, and `venues.kind/email/phone/city`. It reports known records, not all site visitors or verified unique people. Guest, host and partner roles can overlap.

## Important

The GitHub integration could not create a branch due to repository permission restrictions. No changes have been committed to your repository by this package. Add the files on a new branch and test a Preview deployment before merging to `main`.
