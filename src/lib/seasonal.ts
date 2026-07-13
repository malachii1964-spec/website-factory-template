import { localParts } from "./hours";

export type Season = "spring" | "summer" | "fall" | "winter";

/** Meteorological-ish seasons keyed to the nursery's growing calendar (0=Jan). */
export function seasonForMonth(month: number): Season {
  if (month >= 2 && month <= 4) return "spring"; // Mar–May
  if (month >= 5 && month <= 7) return "summer"; // Jun–Aug
  if (month >= 8 && month <= 10) return "fall"; // Sep–Nov
  return "winter"; // Dec–Feb
}

export function currentSeason(now: Date = new Date()): Season {
  // Use business timezone month via a lightweight formatter.
  const month = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "numeric",
    }).format(now),
  ) - 1;
  return seasonForMonth(month);
}

type SeasonContent = {
  eyebrow: string;
  heading: string;
  blurb: string;
  /** Names of what's thriving / worth grabbing right now. */
  picks: string[];
};

export const seasonalContent: Record<Season, SeasonContent> = {
  spring: {
    eyebrow: "Thriving right now",
    heading: "Spring is planting season",
    blurb:
      "The greenhouses are packed. Cold-hardy veg starts, pansies, and the first hanging baskets are ready — and it's the ideal window to get trees and shrubs in the ground.",
    picks: ["Vegetable starts", "Pansies & violas", "Trees & shrubs", "Cool-season herbs"],
  },
  summer: {
    eyebrow: "Thriving right now",
    heading: "Peak-season color & harvest",
    blurb:
      "Tomatoes, peppers, and heat-loving annuals are going strong. Grab a fresh hanging basket for the porch, and keep the harvest coming with our grower nutrients.",
    picks: ["Tomato & pepper plants", "Hanging baskets", "Sun-loving annuals", "Grow nutrients"],
  },
  fall: {
    eyebrow: "Thriving right now",
    heading: "Fall is for planting & mums",
    blurb:
      "Hardy mums, ornamental kale, and pansies bring late-season color, and cool soil is perfect for planting trees, shrubs, and spring bulbs.",
    picks: ["Hardy mums", "Spring bulbs", "Trees & shrubs", "Ornamental kale"],
  },
  winter: {
    eyebrow: "Thriving right now",
    heading: "Grow through the cold",
    blurb:
      "The hydroponics room is where the action is — full-spectrum grow lights, nutrients, and everything you need to keep a harvest going indoors while the snow flies.",
    picks: ["Grow lights", "Hydroponic systems", "Houseplants", "Seed-starting supplies"],
  },
};

/** Convenience: the copy block for the current season. */
export function currentSeasonalContent(now: Date = new Date()): SeasonContent & { season: Season } {
  const season = currentSeason(now);
  return { season, ...seasonalContent[season] };
}

/** Small helper so a server component can note the time of day too, if wanted. */
export function isDaytime(now: Date = new Date()): boolean {
  const { minutesNow } = localParts(now);
  return minutesNow >= 6 * 60 && minutesNow < 19 * 60;
}
