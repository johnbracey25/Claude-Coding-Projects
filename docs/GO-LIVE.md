# Going live — make the `/join` signup link real

Follow these once. ~20–30 minutes, no coding. After this you'll have a public URL
you can paste into a Nextdoor post, and signups will flow into your People list.

## 1. Create the database (Supabase — free)

1. Go to <https://supabase.com> → sign up → **New project**.
2. Name it (e.g. `eve-research`), pick a region near you, set a database password
   (save it somewhere).
3. When the project is ready, open **SQL Editor** → **New query**.
4. Copy the contents of `supabase/migrations/0001_people.sql`, paste, click **Run**.
5. Do the same for `supabase/migrations/0002_public_signup.sql`.
   - (Run any higher-numbered migration files in order, too.)
6. Go to **Project Settings → API** and copy these three values:
   - **Project URL**
   - **anon public** key
   - **service_role** key (keep this secret — it's like an admin password)

## 2. Add a login for you and Lauren

1. In Supabase, open **Authentication → Users → Add user**.
2. Add yourself and Lauren with email + password. (Staff sign-in uses these.)

## 3. Put the app online (Vercel — free)

1. Go to <https://vercel.com> → sign up with your GitHub account.
2. **Add New → Project** → import the `Claude-Coding-Projects` repo.
3. Before deploying, open **Environment Variables** and add:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |
   | `SUPABASE_SERVICE_ROLE_KEY` | your service_role key |
   | `NEXT_PUBLIC_APP_URL` | your Vercel URL (e.g. `https://eve-research.vercel.app`) |

4. Click **Deploy**. When it finishes you'll get a URL like
   `https://eve-research.vercel.app`.

## 4. Test it

- Visit `https://YOUR-URL/join` and submit a test signup.
- Sign in at `https://YOUR-URL/dashboard` → **People** — your test should appear.
- On the dashboard, use **Share your signup link** to copy a tagged link
  (e.g. `…/join?src=nextdoor`) and post it.

## 5. (Optional) Turn on email + text invites

Invites work once you add these. Until then, the app still matches candidates and
logs invites as "skipped".

**Email — Resend (free tier):**
1. Sign up at <https://resend.com>, verify a sending domain (or use their test domain).
2. Create an API key. In Vercel env vars add:
   - `RESEND_API_KEY` = your key
   - `EMAIL_FROM` = `Eve Research <bookings@yourdomain.com>`

**Text — Twilio:**
1. Sign up at <https://twilio.com>, buy a phone number with SMS.
2. In Vercel env vars add:
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` (e.g. `+1512…`)
3. In the Twilio number's **Messaging** config, set the inbound webhook to
   `https://YOUR-URL/api/webhooks/twilio` so "STOP" opt-outs are honored.

Redeploy after adding env vars.

## Notes

- Want a custom domain (e.g. `studies.everesearch.com`)? Add it in Vercel →
  **Settings → Domains**, then update `NEXT_PUBLIC_APP_URL`.
- Running locally instead? `cp .env.example .env.local`, paste the same values,
  then `npm install && npm run dev` → <http://localhost:3000>.
