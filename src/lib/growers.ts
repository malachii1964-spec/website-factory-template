/**
 * "Grow Like the Greats" — educational profiles of well-known cultivators,
 * authors, and scientists, translating their publicly shared methods into
 * simple Lake Erie Cannabis grow paths. These are factual, respectful
 * summaries of public work; Lake Erie Cannabis is not affiliated with,
 * sponsored by, or endorsed by any of them. Each profile cross-links to the
 * guides on this site that put the method into practice.
 */

export type Grower = {
  slug: string;
  name: string;
  role: string;
  tagline: string;
  knownFor: string[];
  method: string;
  lessons: { t: string; d: string }[];
  steps: string[];
  guideSlugs: string[];
  external?: { label: string; href: string };
};

export const GROWERS: Grower[] = [
  {
    slug: "mr-canucks-grow",
    name: "Mr. Canucks Grow",
    role: "YouTube cultivator · Canada",
    tagline: "Dry amendments, plain water, a calendar. Matt Taylor's method has no bottles in it.",
    knownFor: [
      "Dry organic amendments, no bottled nutrients",
      "The three-week top-dress clock",
      "Plain pH'd water between feeds",
      "Patient, beginner-first tutorials",
    ],
    method:
      "Amend the soil with two dry organic fertilizers, dust the roots with mycorrhizae, then give nothing but plain pH'd water and a top-dress every three weeks. The only thing that changes across the grow is the ratio — nitrogen-forward early, bloom-forward late.",
    lessons: [
      { t: "Feed the soil, on a clock", d: "Dry amendment laid down three weeks early is broken down and waiting when the plant needs it." },
      { t: "Ratio beats quantity", d: "The dose barely changes all grow. Shifting nitrogen to bloom is what does the work." },
      { t: "Subtract, don't add", d: "Five ingredients, two of them fertilizer. If you can't say what a product is for, leave it out." },
      { t: "Water is a skill", d: "Plain pH'd water, a real soak, then wait for the dry-back. Most beginner problems are watering problems." },
    ],
    steps: [
      "Mix dry amendment through your base soil and dust the rootball with mycorrhizae",
      "Water plain, pH 6.2–6.8, and let the pot dry back between soaks",
      "Top-dress one tablespoon per gallon every three weeks",
      "Ramp the ratio from all-purpose toward bloom as you move into flower",
      "Stop amending at the end and finish on plain water alone",
    ],
    guideSlugs: [
      "living-soil-water-only",
      "soil-amendments-guide",
      "watering-ph-fundamentals",
      "when-to-harvest-trichomes",
    ],
    external: {
      label: "Mr. Canucks Grow on YouTube",
      href: "https://www.youtube.com/c/MrCanucksGrowGuide",
    },
  },
  {
    slug: "basementganja",
    name: "Basementganja",
    role: "YouTube craft grower",
    tagline: "Craft-tier indoor quality on a home-grower budget.",
    knownFor: [
      "High-quality craft indoor flower",
      "Dialed environments (temp/humidity/VPD)",
      "Living-soil hand-watering",
      "Phenotype hunting for the best smoke",
    ],
    method:
      "Obsess over the environment, grow in living soil, and hunt phenotypes. Quality over quantity — a perfectly dialed room and the right cut beat raw wattage every time.",
    lessons: [
      { t: "Environment is everything", d: "Nail your VPD and airflow and the plant rewards you with frost and terps." },
      { t: "Living soil rewards patience", d: "A biologically alive pot grows cleaner, tastier flower over time." },
      { t: "Hunt your phenos", d: "Run a few plants and keep the standout — genetics set the ceiling." },
      { t: "Slow it down at the end", d: "A slow dry and a long cure are where great weed is actually made." },
    ],
    steps: [
      "Dial your VPD for each stage (cooler, more humid in veg; drier in late flower)",
      "Grow living soil in fabric pots and hand-water with care",
      "Low-stress train for an even, well-lit canopy",
      "Run multiple phenotypes and select your keeper",
      "Dry slow (60/60) and cure for weeks in jars",
    ],
    guideSlugs: [
      "temperature-humidity-vpd",
      "low-stress-training-lst",
      "when-to-harvest-trichomes",
      "drying-and-curing",
    ],
  },
  {
    slug: "ed-rosenthal",
    name: "Ed Rosenthal",
    role: "Author & educator · since the 1970s",
    tagline: "The 'Guru of Ganja' — decades of cultivation authority.",
    knownFor: [
      "The 'Ask Ed' cultivation columns",
      "Marijuana Grower's Handbook",
      "Generations of home-grower education",
      "Cannabis advocacy & teaching",
    ],
    method:
      "Ground every decision in how the plant actually works. Understand the life cycle, give strong light, feed appropriately, and treat every problem as a solvable puzzle with a cause.",
    lessons: [
      { t: "Understand the plant", d: "Know what the plant needs at each stage and give exactly that." },
      { t: "Light drives yield", d: "Within limits, more usable light means more and denser flower." },
      { t: "Problems have causes", d: "Diagnose the why — deficiency, pH, pests, environment — then fix the root." },
      { t: "Never stop learning", d: "Cultivation is iterative; the best growers are lifelong students." },
    ],
    steps: [
      "Learn the full life cycle — germination through harvest",
      "Give strong, stage-appropriate light",
      "Feed to the plant's needs and keep pH in range",
      "Diagnose issues early with a deficiency/pest checklist",
      "Harvest at peak ripeness for the effect you want",
    ],
    guideSlugs: [
      "lighting-basics-ppfd",
      "nutrient-deficiency-chart",
      "flowering-week-by-week",
      "when-to-harvest-trichomes",
    ],
  },
  {
    slug: "kyle-kushman",
    name: "Kyle Kushman",
    role: "Cultivator, educator & breeder",
    tagline: "Veganic-growing pioneer and award-winning cultivator.",
    knownFor: [
      "Veganic cultivation (plant-based, no animal inputs)",
      "Strawberry Cough",
      "Multiple cultivation awards",
      "Decades of teaching growers",
    ],
    method:
      "Veganics: feed the soil's biology with plant-based amendments instead of synthetic salts or animal products, for cleaner, smoother, more flavorful flower. Technique and living soil over bottled shortcuts.",
    lessons: [
      { t: "Veganic = cleaner smoke", d: "Plant-based inputs and living biology can mean a smoother, tastier finish." },
      { t: "Soil biology first", d: "Feed the microbes; they feed the plant." },
      { t: "Genetics matter", d: "Great flower starts with a great cut — then technique brings it out." },
      { t: "Technique beats bottles", d: "Training, timing, and a clean cure outperform a shelf of nutrients." },
    ],
    steps: [
      "Build a living, veganic soil (plant-based amendments, compost, castings)",
      "Feed with plant-based teas/top-dresses, not synthetic salts",
      "Start from strong genetics",
      "Train the canopy for even light",
      "Finish with a slow dry and a long, careful cure",
    ],
    guideSlugs: [
      "setting-up-your-grow-space",
      "watering-ph-fundamentals",
      "low-stress-training-lst",
      "drying-and-curing",
    ],
  },
  {
    slug: "buildasoil",
    name: "BuildASoil",
    role: "Living-soil company & method · Jeremy Silva",
    tagline: "Water-only living soil and no-till, done right.",
    knownFor: [
      "No-till living soil",
      "Water-only growing",
      "Cover crops & mulch",
      "Compost, worm castings & quality inputs",
    ],
    method:
      "Build one complete, biologically complete living soil — then grow water-only, top-dress amendments, run cover crops, and reuse the same soil indefinitely (no-till). The soil gets better every cycle.",
    lessons: [
      { t: "Build the soil once", d: "A complete living soil front-loads everything the plant needs." },
      { t: "Water-only is real", d: "With a living soil and top-dresses, you can skip the bottle lineup." },
      { t: "Protect the web", d: "Cover crops and mulch keep the soil biology alive and thriving." },
      { t: "Reuse and improve", d: "No-till soil compounds — year two is better than year one." },
    ],
    steps: [
      "Mix a complete living soil and let it cook",
      "Plant directly into it — no bottled feeding schedule",
      "Grow water-only, watching the plant for cues",
      "Top-dress amendments between/within cycles",
      "Plant a cover crop, mulch, and reuse the soil no-till",
    ],
    guideSlugs: [
      "setting-up-your-grow-space",
      "watering-ph-fundamentals",
      "nutrient-deficiency-chart",
    ],
    external: { label: "buildasoil.com", href: "https://buildasoil.com/" },
  },
  {
    slug: "bruce-bugbee",
    name: "Dr. Bruce Bugbee",
    role: "Plant physiologist · Utah State / Apogee",
    tagline: "The science of light, VPD, and plant physiology.",
    knownFor: [
      "Photobiology research (PPFD / PAR)",
      "VPD and transpiration science",
      "CO2 and environmental control",
      "Widely shared university lectures",
    ],
    method:
      "Measure, don't guess. Optimize the environment with data — light intensity and spectrum, VPD, and CO2 — and match every input to what the plant can actually use at that moment.",
    lessons: [
      { t: "Measure your PPFD", d: "A light meter (or PAR app) turns guesswork into a dialed canopy." },
      { t: "Balance the inputs", d: "More light only helps if water, nutrients, and CO2 keep up." },
      { t: "VPD drives transpiration", d: "The temp/humidity relationship controls how the plant drinks and grows." },
      { t: "Spectrum is nuanced", d: "Full, efficient white light beats chasing miracle 'purple' spectra." },
    ],
    steps: [
      "Measure PPFD across your canopy",
      "Match light intensity to the growth stage",
      "Control VPD with temp and humidity together",
      "Add CO2 only when your light level can use it",
      "Verify changes with data, not vibes",
    ],
    guideSlugs: ["lighting-basics-ppfd", "temperature-humidity-vpd"],
  },
];

export function getGrower(slug: string): Grower | undefined {
  return GROWERS.find((g) => g.slug === slug);
}
