import { Fraunces, Work_Sans, Caveat } from "next/font/google";

// Display voice: warm, characterful heritage serif — carries the personality.
// Note: the `variable` name here is intentionally distinct from the
// `--font-display` theme key in globals.css (`@theme inline` maps
// --font-display to var(--font-fraunces)) — a CSS custom property can't
// reference itself by the same name.
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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

// Accent only — used in small doses for season tags, echoing the stand's
// own hand-marker signage. Never for body copy or headlines.
export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-caveat",
  display: "swap",
});
