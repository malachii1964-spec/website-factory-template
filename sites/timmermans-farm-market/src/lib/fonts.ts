import { Fraunces, Work_Sans } from "next/font/google";

// Display voice: warm, characterful heritage serif — carries the personality.
// Only weight 600 is used anywhere in the codebase (font-semibold, normal +
// italic) — keep the font payload to exactly that per performance.md's
// "max 2 families / ~4 weights total" budget.
// Note: the `variable` name here is intentionally distinct from the
// `--font-display` theme key in globals.css (`@theme inline` maps
// --font-display to var(--font-fraunces)) — a CSS custom property can't
// reference itself by the same name.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

// Body/UI voice: clean humanist sans, quiet on purpose.
export const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-work-sans",
  display: "swap",
});
