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
Five are confirmed and live. **Two are still guesses** — your real opening
days and hours are the last thing the site needs from you.

| What | Status |
|---|---|
| Street address | **154 North Portage St — live** |
| Town, Zip | **Westfield NY 14787 — live** |
| Phone | **(716) 753-0404 — live, tap-to-call everywhere** |
| Email | **malachii1964@gmail.com — live** |
| Established | **2024 — live** |
| Map coordinates | Not needed. The map reads your street address. |
| **Stand hours** | **Still a guess: Thu/Fri 10–6, Sat 9–5, Sun 10–3** |
| **Open season** | **Still a guess: May through November** |

Each fact publishes the moment it is real, one at a time. Your address, phone
and email are all live now — in the footer, on the Visit page, on the printable
sign, and in the structured data Google reads. There is a tap-to-call button in
the header of every page.

**One thing worth knowing about the email.** `malachii1964@gmail.com` is a
personal inbox and it is now on a public page, where address-harvesting bots
will find it. That is a normal trade for a small farm and it is your call — but
if the spam ever gets tiresome, set up `stand@lakeerieironroots.com` to forward
to it, change one line in `src/lib/farm.ts`, and nothing else has to move. That is on purpose. A pin on the wrong road sends a
customer to a stranger's driveway, and a search result claiming you trade at
an address you do not occupy outlives the mistake. Fill them in and every one
of those turns itself on; that switch-on has been tested end to end.

### 2. Your two brand files are not on the site yet

The wiring is already built and tested. **You do not need me for this step** —
drop two files into `public/brand/` and the site upgrades itself:

| File | What it is |
|---|---|
| `emblem.png` | Your ring-and-roots mark, transparent background, square, 1024px+ |
| `hero.jpg` | The breakwall and lighthouse at sunset, landscape, 2000px+ wide |

The emblem appears above the name in the hero and beside it in the header. The
photograph becomes the full-bleed hero background, under a scrim that keeps the
headline readable and leaves the sunset showing on the right.

Until they arrive the hero uses a gradient standing in for that light, and the
name stands alone. **No stock photo of somebody else's farm will ever be put
there**, and I will not draw an approximation of your mark.

Full instructions are in `public/brand/README.md`.

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
npm test            # 3. all tests pass (52 of them)
npm run build       # 4. it actually builds
```

Then the fifth one, which checks the things tests cannot see — that the season
chart's "today" line is where it claims to be, that nothing overflows a phone
screen, and that none of the placeholder details leaked onto the page:

```bash
npm run build && npx next start -p 3000   # in one terminal
npm run verify:rendered                   # in another
```

And the one that proves it is fast on a cheap phone, not just on your laptop
(simulated Pixel 5, four-times-slower processor, slow 4G, cache off):

```bash
npm run verify:performance
```

Last measured: home page loads its biggest element in **2.1 seconds**, Visit in
**0.8**, nothing jumps around as it loads (layout shift 0.000), taps respond in
**32ms**, and the whole page needs **134.6KB** of compressed JavaScript against
a 150KB budget. Almost all of that is React itself — this site adds barely any.

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

**The stand sign (`/sign`)** — the one page that is for *you*, not for
customers. Open it in the morning, press Ctrl+P, and you get a one-page sign
for the table listing exactly what is picked today, in your own branding, dated.
It is built from the same list as the website, so the paper on your table can
never disagree with the page on someone's phone. Black on white to save ink,
and the crop names are set big enough to read from the far side of a trestle
table. There is a link to it in the footer. Search engines are told to ignore
it.

### The thing that makes it yours

A single gold root runs the whole height of the page. It is thicker where it
enters at the top and thins as it goes down, the way a real root does. Each
section grows its own branch off it as you scroll to that section, and each
branch ends in a small lit node level with that section's heading — so the
left edge of the page doubles as a place marker. At the bottom the root fans
out into the network from your logo.

It ships **zero JavaScript**. It is done with a new CSS feature that runs on
the graphics chip instead of the browser's main thread, which is why the site
can feel cinematic and still load fast on a bad phone signal.

If someone has motion turned off in their system settings, or their browser is
too old for the effect, the whole root simply renders already-drawn. It never
degrades to an empty margin. That is checked automatically, not assumed.

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

**One honest caveat about freshness.** The page rebuilds itself five minutes
after someone visits, which keeps hosting free. But the rebuild is triggered
*by* a visit and serves the *next* one — so on a quiet night, the first person
to open the site in the morning may briefly see yesterday's produce list before
it catches up. If that ever bothers you, tell me and I will add a scheduled
5am ping that keeps it a day ahead. It is a ten-line change.

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
