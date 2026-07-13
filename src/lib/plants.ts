/**
 * Showcase catalog for Mike's Nursery. This is representative inventory to make
 * the site feel alive — not a live stock feed. TODO(mike): replace blurbs,
 * prices, and photos with the real greenhouse selection.
 */

export type CategoryId =
  | "annuals"
  | "perennials"
  | "trees-shrubs"
  | "vegetables"
  | "hanging-baskets"
  | "houseplants"
  | "hydroponics";

export type Light = "full-sun" | "part-sun" | "shade" | "indoor";

export type Plant = {
  id: string;
  name: string;
  category: CategoryId;
  /** One-line description in Mike's voice. */
  blurb: string;
  light: Light;
  /** Indicative price, e.g. "$4–$18". Kept as a string; nursery pricing varies. */
  price: string;
  /** Seasonal availability tag for filtering/labels. */
  season: "Spring" | "Summer" | "Fall" | "Year-round";
  /** Accent hue used by the placeholder art so cards feel distinct. */
  hue: number;
  /** Marks a standout item for the home "featured" strip. */
  featured?: boolean;
};

export const categories: { id: CategoryId; label: string; blurb: string }[] = [
  { id: "annuals", label: "Annuals & Flowers", blurb: "Season-long color for beds, borders, and pots." },
  { id: "perennials", label: "Perennials", blurb: "Plant once, enjoy for years — hardy for WNY winters." },
  { id: "trees-shrubs", label: "Trees & Shrubs", blurb: "Shade, privacy, and structure for the whole yard." },
  { id: "vegetables", label: "Vegetable Starts", blurb: "Healthy, greenhouse-grown seedlings ready to plant." },
  { id: "hanging-baskets", label: "Hanging Baskets", blurb: "Full, ready-made baskets for porch and patio." },
  { id: "houseplants", label: "Houseplants", blurb: "Greenery that thrives indoors, year-round." },
  { id: "hydroponics", label: "Hydroponics & Supplies", blurb: "Grow lights, nutrients, media, and full systems." },
];

export const categoryLabel = (id: CategoryId): string =>
  categories.find((c) => c.id === id)?.label ?? id;

export const lightLabel: Record<Light, string> = {
  "full-sun": "Full sun",
  "part-sun": "Part sun",
  shade: "Shade",
  indoor: "Indoor",
};

export const plants: Plant[] = [
  // Annuals & Flowers
  { id: "petunia-wave", name: "Wave Petunias", category: "annuals", blurb: "Spreading, self-cleaning color that blooms until frost.", light: "full-sun", price: "$4–$6", season: "Spring", hue: 320, featured: true },
  { id: "geranium", name: "Zonal Geraniums", category: "annuals", blurb: "Classic, heat-tough porch-pot workhorse in six colors.", light: "full-sun", price: "$5–$8", season: "Spring", hue: 355 },
  { id: "marigold", name: "Marigolds", category: "annuals", blurb: "Cheerful, pest-deterring edging for beds and the veg patch.", light: "full-sun", price: "$3–$5", season: "Spring", hue: 38 },
  { id: "impatiens", name: "Impatiens", category: "annuals", blurb: "The go-to for bright color in that shady spot.", light: "shade", price: "$3–$5", season: "Spring", hue: 350 },

  // Perennials
  { id: "coneflower", name: "Echinacea Coneflower", category: "perennials", blurb: "Pollinator magnet that comes back stronger every year.", light: "full-sun", price: "$9–$16", season: "Summer", hue: 330, featured: true },
  { id: "hosta", name: "Hosta", category: "perennials", blurb: "Bold, shade-loving foliage that fills in fast.", light: "shade", price: "$10–$22", season: "Spring", hue: 130 },
  { id: "daylily", name: "Daylilies", category: "perennials", blurb: "Tough, drought-tolerant, and endlessly forgiving.", light: "full-sun", price: "$9–$18", season: "Summer", hue: 30 },
  { id: "sedum", name: "Autumn Joy Sedum", category: "perennials", blurb: "Late-season color the bees can't resist.", light: "full-sun", price: "$10–$16", season: "Fall", hue: 350 },

  // Trees & Shrubs
  { id: "maple", name: "Red Maple", category: "trees-shrubs", blurb: "A fast-growing shade tree with unbeatable fall color.", light: "full-sun", price: "$60–$180", season: "Year-round", hue: 12, featured: true },
  { id: "hydrangea", name: "Hydrangea", category: "trees-shrubs", blurb: "Big, showy blooms — a foundation-planting favorite.", light: "part-sun", price: "$28–$60", season: "Summer", hue: 280 },
  { id: "arborvitae", name: "Emerald Arborvitae", category: "trees-shrubs", blurb: "Fast, evergreen privacy screening that loves our climate.", light: "full-sun", price: "$35–$95", season: "Year-round", hue: 150 },
  { id: "lilac", name: "Lilac", category: "trees-shrubs", blurb: "That unmistakable spring fragrance, hardy to the bone.", light: "full-sun", price: "$30–$70", season: "Spring", hue: 275 },

  // Vegetable Starts
  { id: "tomato", name: "Tomato Starts", category: "vegetables", blurb: "Heirloom and hybrid transplants, hardened off and ready.", light: "full-sun", price: "$3–$6", season: "Spring", hue: 8, featured: true },
  { id: "pepper", name: "Pepper Plants", category: "vegetables", blurb: "Sweet bells to fiery habaneros — dozens of varieties.", light: "full-sun", price: "$3–$6", season: "Spring", hue: 45 },
  { id: "herbs", name: "Culinary Herbs", category: "vegetables", blurb: "Basil, rosemary, thyme, and more — snip-fresh all summer.", light: "full-sun", price: "$4–$7", season: "Spring", hue: 110 },
  { id: "cucumber", name: "Cucumber & Squash", category: "vegetables", blurb: "Vigorous starts for a garden that keeps on giving.", light: "full-sun", price: "$3–$5", season: "Spring", hue: 90 },

  // Hanging Baskets
  { id: "basket-fuchsia", name: "Fuchsia Baskets", category: "hanging-baskets", blurb: "Dramatic, hummingbird-loved baskets for shady porches.", light: "shade", price: "$22–$34", season: "Spring", hue: 320, featured: true },
  { id: "basket-mixed", name: "Mixed Sun Baskets", category: "hanging-baskets", blurb: "Overflowing combinations planted in-house each spring.", light: "full-sun", price: "$24–$38", season: "Spring", hue: 300 },
  { id: "basket-ivy", name: "Ivy Geranium Baskets", category: "hanging-baskets", blurb: "Cascading color that shrugs off the summer heat.", light: "part-sun", price: "$24–$36", season: "Summer", hue: 348 },

  // Houseplants
  { id: "pothos", name: "Pothos", category: "houseplants", blurb: "Nearly unkillable trailing greenery for any room.", light: "indoor", price: "$8–$24", season: "Year-round", hue: 140 },
  { id: "monstera", name: "Monstera Deliciosa", category: "houseplants", blurb: "The statement plant everyone wants — grown on-site.", light: "indoor", price: "$18–$65", season: "Year-round", hue: 155, featured: true },
  { id: "succulents", name: "Succulents & Cacti", category: "houseplants", blurb: "Low-water desk companions in every shape and size.", light: "indoor", price: "$4–$18", season: "Year-round", hue: 100 },

  // Hydroponics & Supplies
  { id: "grow-light", name: "Full-Spectrum LED Grow Lights", category: "hydroponics", blurb: "Efficient, low-heat lighting for serious indoor yields.", light: "indoor", price: "$45–$320", season: "Year-round", hue: 40, featured: true },
  { id: "nutrients", name: "Grow Nutrients", category: "hydroponics", blurb: "Complete feed lineups for soil and hydro — we know the mix.", light: "indoor", price: "$12–$60", season: "Year-round", hue: 25 },
  { id: "hydro-system", name: "Hydroponic Systems", category: "hydroponics", blurb: "Deep-water, drip, and ebb-and-flow kits, staff-tested.", light: "indoor", price: "$60–$450", season: "Year-round", hue: 190 },
  { id: "media", name: "Soils & Media", category: "hydroponics", blurb: "Coco, rockwool, perlite, and premium potting mixes by the bag.", light: "indoor", price: "$8–$40", season: "Year-round", hue: 30 },
];

export const featuredPlants = plants.filter((p) => p.featured);
