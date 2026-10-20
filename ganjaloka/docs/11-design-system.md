# 11 — Design System: "Night Tent"

Built with the `design.md` process: subject → plan → self-critique → build to plan.

## 1. Subject
- **One subject:** the cannabis world, as its own community lives it.
- **Audience:** adults 21+, mostly on phones, often at night.
- **The feed's single job:** read fast, post fast.
- **Materials from the subject's own world:** trichomes (the resin heads growers
  check with a loupe; they turn **clear → milky → amber** as the plant ripens),
  curing jars and harvest labels, grow-tent darkness, and the warm amber of resin.

## 2. Plan
### Palette (CSS tokens in `src/app/globals.css`)
| Token | Hex | Name | Role |
|---|---|---|---|
| `--background` | `#110E14` | Night Tent | Page ground (plum-black, not neutral black) |
| `--surface` | `#1C1821` | Cure Jar | Cards, composer, menus |
| `--border` | `#2B2631` | Smoke | Hairlines that separate posts (structure, not decoration) |
| `--foreground` | `#EDE8E0` | Ash Paper | Primary text |
| `--muted` | `#9C93A3` | Stem | Secondary text, timestamps |
| `--accent` | `#F2A93B` | Resin Amber | **The one accent:** primary buttons, active nav, ripe trichomes |
| `--trichome-clear` | `#A9C9CF` | Clear | Ripeness scale only |
| `--trichome-milky` | `#E6DFD0` | Milky | Ripeness scale only |
| `--danger` | `#EF5D5D` | — | Errors and destructive confirmations only |

Contrast (computed with the WCAG 2 formula): Ash Paper on Night Tent 15.7:1,
Stem on Night Tent 6.5:1 (5.9:1 on Cure Jar), Night Tent on Resin Amber 9.6:1
(button text), and Danger on Night Tent 5.8:1. All pass WCAG AA for body text.

### Type (two families via `next/font`, self-hosted)
- **Big Shoulders Display 800** is the display face, used with restraint: the
  wordmark, page titles and profile names. It's condensed and stencil-adjacent,
  like harvest tags and jar labels.
- **Atkinson Hyperlegible Next 400/600** is the body and UI face. It was designed
  by the Braille Institute for maximum character distinction, which suits a feed
  read on small screens, in the dark.

### Layout
- **Desktop (≥1024 px):** left nav rail (220 px), center feed column (600 px max),
  right rail (300 px: community rules + newest members).
- **Mobile (375 px first):** top bar with the wordmark and a bottom tab bar
  (Home · Explore · Post · Profile), the same shape as the future native app.
- Posts are separated by Smoke hairlines, with no card boxes inside the feed
  (density, like the subject's native apps). Cards are reserved for dialogs and
  the composer.

### THE SIGNATURE: the Ripeness Trichome
Every post's like control is a trichome glyph (stalk + round head, inline SVG).
Its head color **ripens with appreciation**:
- 0 likes → **clear** (`--trichome-clear`)
- 1–24 likes → **milky** (`--trichome-milky`)
- 25+ likes → **amber** (`--accent`)

When *you* like a post, the head fills from the stalk up (one 380 ms
transform/opacity move; instant under `prefers-reduced-motion`). An outline means
you haven't liked it, a filled head means you have. This is the one bold element.
Everything around it stays quiet.

## 3. Self-critique (did we pick defaults?)
| Risk | Verdict | Revision |
|---|---|---|
| "Near-black + one acid accent" (banned) | Ground is plum-black and the accent is warm resin amber, not acid green or vermilion | Keep. **Green is deliberately absent:** every cannabis site defaults to green |
| Dark + gold reads as generic "luxury" | Real risk | Amber is used flat (no gradients, no metallic sheen) and only for action and ripeness |
| Condensed display font everywhere = shouty | Real risk | Display face is limited to the wordmark, page titles and profile names. Never for body or buttons |
| Ripeness metaphor too cute? | It's literally how growers judge harvest, so the community reads it instantly | Keep, with an accessible label: "Like · 12 likes" |

## 4. Components and states (quality floor)
- **Focus:** a 2 px Resin Amber outline with a 2 px offset on every interactive element.
- **Loading:** feed skeleton rows (avatar circle + 2 text bars), no spinners on first paint.
- **Empty:** the home feed with no follows says "Your feed grows with who you
  follow" and links to Explore and the newest members.
- **Error:** inline under the field, saying what went wrong and how to fix it
  ("That username is taken — try adding a number").
- **Destructive actions** (delete post, block, delete account) use a confirmation
  dialog that names the consequence.

## 5. Copy voice
Plain, warm, adult. Buttons say what they do: "Post", "Reply", "Follow",
"Following", "Block @name", "Report post", "Delete my account".
No emoji as design elements, no stock illustration, no lorem ipsum.
