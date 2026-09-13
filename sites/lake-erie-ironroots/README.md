# Lake Erie IronRoots — the website

Organic fruit and vegetables, Chautauqua County, New York.
Built on purpose. Rooted in strength.

---

## START HERE — the only two things that matter right now

Everything else in this file can wait. These two cannot.

### 1. The site does not have your real details yet

I do not know your address, your phone number, or your hours, so the site is
running on placeholders. It is built so this is **one file, one time**.

Open **`src/lib/farm.ts`**. Every line that needs you is marked `NEEDS OWNER`.
There are eight values:

| What | Looks like now |
|---|---|
| Street address | `0000 Route 20` |
| Town | `Westfield` |
| Zip | `14787` |
| Phone | `+1-716-000-0000` |
| Email | `hello@lakeerieironroots.com` |
| Map coordinates | `42.3223, -79.5784` |
| Stand hours | Thu/Fri 10–6, Sat 9–5, Sun 10–3 |
| Open season | June through November |

Until the address and phone are real, the Visit page **deliberately hides the
map** and shows a note instead. That is on purpose — a pin on the wrong road
sends a customer to a stranger's driveway. Fill them in and the map turns
itself on.

### 2. Your logo is not on the site yet

I did **not** draw your emblem. That ring-and-roots mark is yours, and a
half-remembered copy of someone's logo is worse than no logo. Right now the
header and hero use a typographic version of the name in your brand's own
letterspacing.

**Send me the logo as a PNG with a transparent background** (or drop it at
`public/brand/logo.png`) and I will wire it into the header, the hero, the
share card and the favicon.

---

## One thing I need you to settle

Your artwork says **ESTD 2024**. You told me **Established 9/1/26**.

The site currently says 9/1/26 because that is what you told me. One of the
two is wrong and I did not want to guess. Tell me which and I will change the
one place it lives.

---

## Running it on your computer

You need Node 22 or newer. On Linux Mint:

```bash
sudo apt install nodejs npm
```

Then, from this folder:

```bash
npm install     # once, the first time
npm run dev     # every time you want to see the site
```

Open **http://localhost:3000** in your browser. Leave the terminal running.
Press `Ctrl+C` in the terminal to stop it.

Change a file, save it, and the browser updates by itself.

---

## Before you ever put a change live

Run these four. All four have to pass. If one fails, the change is not done.

```bash
npm run typecheck   # 1. no type errors
npm run lint        # 2. no lint errors
npm test            # 3. all tests pass
npm run build       # 4. it actually builds
```

Then look at it in the browser — including on your phone — before you ship it.

---

## What is actually on the site

**Home (`/`)**

- The name, the tagline, and the one live fact: how many days to first frost
- **Ready at the stand this week** — computed from the real calendar, not typed
  in by hand. It changes by itself as the season moves.
- **The Season Rule** — every crop's harvest window drawn to scale against this
  county's real frost dates, with today marked. Whatever the line crosses is
  what is on the table.
- **What we stand on** — your five pillars
- **The ground itself** — the Chautauqua soil series, in its real Munsell colours
- Hours and the stand, in daylight

**Visit (`/visit`)** — hours, phone, address, map, and what is ready today

**404 (`/nope`, or any wrong address)** — a designed page, not a browser error

### The thing that makes it yours

A single gold root grows down the left edge of the page as you scroll,
branching once for each of your five pillars and spreading into a root network
at the bottom. It is your own mark, drawn as you read.

It ships **zero JavaScript** — it is done with a new CSS feature that runs on
the graphics chip instead of the browser's main thread. That is why the site
feels cinematic and still loads fast on a bad phone signal.

---

## How to change what you grow

Open **`src/lib/season.ts`**. Each crop is one line:

```ts
{ id: "tomatoes", name: "Tomatoes", kind: "fruit",
  from: { month: 7, day: 20 }, to: { month: 10, day: 1 },
  note: "Picked ripe. They do not travel, so they do not have to." },
```

- `from` / `to` are the first and last day you normally pick it
- `note` is the one honest line shown under the name
- Delete a line for anything you do not grow; copy a line to add one

**The frost dates at the top of that file drive the whole drawing.** They are
set to the Chautauqua lake plain — last frost around 15 May, first frost around
7 October. If your ground runs different, change them there and everything
redraws.

Run `npm test` after editing. The tests will tell you if you typed a date that
does not exist, like 31 September.

---

## Putting it on the internet

The site is four static pages, so hosting is free and fast.

1. Make a GitHub account if you do not have one
2. Make a new **empty private repository** called `lake-erie-ironroots`
3. From this folder, push it up (GitHub shows you the exact commands on the
   new empty repo page)
4. Go to **vercel.com**, sign in with GitHub, click **Add New → Project**, pick
   the repo, and click **Deploy**
5. It gives you a live address in about a minute
6. When you own `lakeerieironroots.com`, add it under **Settings → Domains**

There is nothing to configure. No database, no API keys, no environment
variables — this site does not need any.

**After it is live**, change `BASE_URL` in `src/app/sitemap.ts` and
`metadataBase` in `src/app/layout.tsx` to your real domain.

---

## What this site deliberately does NOT do

Every one of these was a decision, not an oversight. Say the word on any of
them and I will build it.

- **No online payments.** You said "later on." Nothing here takes money.
- **No contact form.** A farm stand is a phone call. I would rather ship a
  tap-to-call button that works than an email form I could not test end to end.
- **No photographs.** I will not put stock photos of somebody else's farm on
  your site. Real pictures of your ground, your hands, and your fog coming off
  the lake will do more for this page than anything else on this list.
- **No blog, no newsletter, no accounts.**

---

## Where the design decisions are written down

`docs/design-plan.md` — the palette, the type, the signature, and an honest
list of what I nearly defaulted to and cut. Read it if you ever want to know
why something looks the way it does.
