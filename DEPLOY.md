# Launch Chautauqua County Courier — step by step

The site is built and deploy-ready. Deploying happens through **your** Vercel
account (free) — these are the exact clicks. ~5–10 minutes. It costs $0 to go
live on a `*.vercel.app` link; your own domain is a couple more clicks after.

## Before you start
- Your GitHub is `malachii1964-spec` and the code is in
  `malachii1964-spec/website-factory-template`.
- The courier site lives on the branch **`claude/goto-716-delivery-launch-ehujho`**
  (your other project, FutureDeskAI, is on `main` — leave that alone).
- You own the domain `chautauquacountycourier.com`.

## Step 1 — Make a free Vercel account
1. Go to **https://vercel.com/signup**
2. Click **Continue with GitHub** and approve. (Free "Hobby" plan is fine.)

## Step 2 — Import the project
1. On the Vercel dashboard, click **Add New… → Project**.
2. Find **website-factory-template** in the list and click **Import**.
   (If GitHub isn't connected yet, click **Adjust GitHub App Permissions** and
   give Vercel access to the repo, then come back.)
3. Framework will auto-detect as **Next.js**. Don't change the build settings.
4. Click **Deploy**. The first deploy may build the `main` branch — that's fine,
   we fix the branch in Step 3.

## Step 3 — Point it at the courier branch (IMPORTANT)
The courier site is on a branch, not `main`, so tell Vercel to serve it:
1. Open the project → **Settings → Git**.
2. Under **Production Branch**, change it to
   **`claude/goto-716-delivery-launch-ehujho`** → **Save**.
3. Go to the **Deployments** tab → the newest deployment → **⋯ → Redeploy**.
   That deployment is now your live courier site at `something.vercel.app`.

✅ At this point the site is LIVE and you can start marketing the vercel.app link.
The "Request a Run" form will show a "call or text us" fallback until Step 5.

## Step 4 — Connect your domain
1. Project → **Settings → Domains** → type `chautauquacountycourier.com` → **Add**.
2. Vercel shows DNS records to add. Log in to wherever you bought the domain,
   open its **DNS settings**, and add the records Vercel lists (usually an
   **A record** for the root and a **CNAME** for `www`). Save.
3. Wait a few minutes; Vercel verifies and adds HTTPS automatically.

## Step 5 — Turn on the request-form email (when ready, free)
So run requests hit your inbox:
1. Make a free account at **https://resend.com** → **API Keys → Create**.
2. In Resend, **Domains → Add** `chautauquacountycourier.com` and add the DNS
   records it gives you (same DNS panel as Step 4).
3. Back in Vercel → **Settings → Environment Variables**, add:
   - `RESEND_API_KEY` = your Resend key
   - `REQUEST_INBOX_EMAIL` = the email where you want run requests
   - `RESEND_FROM` = `Chautauqua County Courier <dispatch@chautauquacountycourier.com>`
   - `NEXT_PUBLIC_SITE_URL` = `https://www.chautauquacountycourier.com`
4. **Deployments → Redeploy** so the new keys take effect.

## After it's live
- Every time I push an update to the branch, Vercel redeploys automatically.
- Cleaner-setup option: later we can move the courier into its own dedicated
  repo so it and FutureDeskAI are fully separate — ask me and I'll set it up.

Stuck on any step? Tell me exactly what the screen says and I'll get you through it.
