# Lake Erie Cannabis

One page, one job: collect an email from a grower who wants to know when there
are cuttings. No prices, no product, no cart — the New York licensing position
is unresolved, and the page says so in its own words.

## Deploying (Vercel)

1. **Root Directory must be `sites/lake-erie`.** Vercel defaults to the repo
   root, which is a different site (FutureDeskAI) and will deploy the wrong one.
2. Set both env vars below, or signups are refused with a 503. That refusal is
   deliberate: a serverless filesystem is ephemeral, so the local-file fallback
   in production would accept every address and lose it silently.

| Variable | What it is |
| --- | --- |
| `RESEND_API_KEY` | resend.com → API Keys. No verified domain needed to *store* contacts. |
| `RESEND_AUDIENCE_ID` | resend.com → Audiences → the audience's ID. |

## Locally

`pnpm dev` from this directory. With no keys set, addresses append to
`.data/subscribers.csv` (gitignored) so the form is testable offline.

## After the first deploy

Submit a real address on the live page and confirm it appears in the Resend
audience. The Resend path has not been exercised against the live API — it was
written without a key available, so that first submission is the test.
