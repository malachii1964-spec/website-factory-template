# Drop your two brand files here

Nothing in this folder is invented. The site checks whether these files exist
and upgrades itself when they do — no code change, no configuration.

## 1. `emblem.png`

Your ring-and-roots mark, **transparent background**, square, 1024px or larger.

When it lands it appears above the name in the hero and beside the name in the
header and footer. Until then the site shows the typographic lockup alone,
because a half-remembered copy of your logo is worse than no logo.

`logo.png`, `emblem.webp` and `logo.webp` are also recognised, so whatever your
file is already called probably works.

## 2. `hero.jpg`

The breakwall-and-lighthouse photograph at sunset — the one the whole colour
palette was taken from. **Landscape, at least 2000px wide.**

When it lands it becomes the full-bleed background of the hero, under a scrim
that keeps the headline readable and leaves the sunset visible on the right.
Until then the hero uses a gradient standing in for the same light. A stock
photograph of somebody else's farm will never be substituted here.

`hero.jpeg`, `hero.webp` and `hero.png` are also recognised.

## After you add them

```bash
npm run build && npx next start -p 3000   # one terminal
npm run verify:rendered                   # another
npm run verify:performance
```

The hero image is the largest thing the page loads, so check that
`verify:performance` still reports LCP under 2.5s. If it does not, the file is
too big — export it again at around 2400px wide and 80% quality. Next resizes
and converts it automatically, but it cannot fix a 12MB original.
