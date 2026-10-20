import { Atkinson_Hyperlegible_Next, Big_Shoulders } from "next/font/google";

// Display: harvest-tag / jar-label voice. Variable with an optical-size axis,
// so headline sizes get the condensed Display cut. Used with restraint.
export const display = Big_Shoulders({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display-face",
  display: "swap",
});

// Body + UI: designed by the Braille Institute for character distinction.
export const body = Atkinson_Hyperlegible_Next({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-body-face",
  display: "swap",
});
