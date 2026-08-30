export type ProductCategory =
  | "leafy-greens"
  | "roots-alliums"
  | "tomatoes-peppers"
  | "herbs"
  | "seasonal-boxes"
  | "seedlings-starts";

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  category: ProductCategory;
  price: number;
  unit: string;
  /** 1 = January ... 12 = December. Greenhouse/hydro crops run all 12. */
  inSeasonMonths: number[];
  tag?: string;
  growMethod: "Hydroponic greenhouse" | "High tunnel" | "Field grown";
  icon: string;
}

const ALL_YEAR = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export const products: Product[] = [
  // === LEAFY GREENS (hydroponic — this is the year-round backbone) ===
  {
    id: "g1",
    slug: "butterhead-lettuce",
    title: "Butterhead Lettuce",
    description: "Tender, sweet heads grown hydroponically — cut the same morning it ships.",
    longDescription:
      "Our butterhead lettuce grows in a climate-controlled hydroponic greenhouse a half mile from the shore, so it never sees a frost or a drought. Heads are cut, rooted end included to keep it fresh, and in your hands within 24 hours. No dirt to wash out, no wilted outer leaves.",
    category: "leafy-greens",
    price: 4,
    unit: "per head",
    inSeasonMonths: ALL_YEAR,
    tag: "Year-Round",
    growMethod: "Hydroponic greenhouse",
    icon: "leaf",
  },
  {
    id: "g2",
    slug: "baby-spinach",
    title: "Baby Spinach",
    description: "Mild, dark-green leaves harvested young for salads and quick sautés.",
    longDescription:
      "Harvested at the baby-leaf stage for a sweeter, more tender bite than mature spinach. Triple-washed at the farm and bagged the same day. Grown in rotating hydroponic beds so a fresh flat is always a few days from ready.",
    category: "leafy-greens",
    price: 5,
    unit: "5 oz bag",
    inSeasonMonths: ALL_YEAR,
    tag: "Year-Round",
    growMethod: "Hydroponic greenhouse",
    icon: "leaf",
  },
  {
    id: "g3",
    slug: "rainbow-chard",
    title: "Rainbow Chard",
    description: "Earthy, colorful stalks that hold up in a pan the way delicate greens can't.",
    longDescription:
      "A high-tunnel crop grown for its color as much as its flavor — ruby, gold, and white stalks in every bunch. Chard tolerates our lake-effect winters better than most greens, so it's on the shelf nearly year-round with a short pause during the coldest weeks.",
    category: "leafy-greens",
    price: 4,
    unit: "per bunch",
    inSeasonMonths: [1, 2, 3, 4, 5, 6, 9, 10, 11, 12],
    growMethod: "High tunnel",
    icon: "leaf",
  },
  {
    id: "g4",
    slug: "arugula",
    title: "Arugula",
    description: "Peppery, quick-growing greens for salads that need a little bite.",
    longDescription:
      "A fast hydroponic crop we reseed weekly, so arugula is never more than a few days old when it reaches you. Sharp and peppery — the way arugula is supposed to taste before it bolts.",
    category: "leafy-greens",
    price: 4,
    unit: "4 oz bag",
    inSeasonMonths: ALL_YEAR,
    growMethod: "Hydroponic greenhouse",
    icon: "leaf",
  },
  {
    id: "g5",
    slug: "kale-lacinato",
    title: "Lacinato Kale",
    description: "Dark, crinkled leaves that get sweeter after the first cold snap.",
    longDescription:
      "Also called dinosaur kale — sturdy enough for massaged salads, chips, or braising. Field-grown in the warmer months and high-tunnel grown through fall and early winter, when a light frost actually improves the flavor.",
    category: "leafy-greens",
    price: 4,
    unit: "per bunch",
    inSeasonMonths: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
    growMethod: "High tunnel",
    icon: "leaf",
  },

  // === ROOTS & ALLIUMS ===
  {
    id: "r1",
    slug: "rainbow-carrots",
    title: "Rainbow Carrots",
    description: "Orange, purple, and gold carrots pulled from loose, sandy loam.",
    longDescription:
      "Grown in the sandy soil our stretch of the lake is known for, which lets roots grow long and straight instead of forked. We store the fall harvest in a cold cellar so carrots stay on the shelf well past the growing season.",
    category: "roots-alliums",
    price: 5,
    unit: "1 lb bunch",
    inSeasonMonths: [1, 2, 6, 7, 8, 9, 10, 11, 12],
    growMethod: "Field grown",
    icon: "carrot",
  },
  {
    id: "r2",
    slug: "yellow-potatoes",
    title: "Yellow Potatoes",
    description: "Buttery, thin-skinned potatoes cured for storage and sold by the pound.",
    longDescription:
      "Cured for two weeks after harvest to toughen the skin and sweeten the starch, then kept in a dark, cool cellar so we can sell fresh potatoes through the winter without shipping them in from somewhere else.",
    category: "roots-alliums",
    price: 3,
    unit: "per lb",
    inSeasonMonths: ALL_YEAR,
    growMethod: "Field grown",
    icon: "wheat",
  },
  {
    id: "r3",
    slug: "sweet-onions",
    title: "Sweet Onions",
    description: "Mild enough to eat raw, grown for storage so they're never far away.",
    longDescription:
      "A long-storage variety chosen specifically so the county isn't buying onions trucked in from three states over in February. Cured and stored on-site.",
    category: "roots-alliums",
    price: 3,
    unit: "per lb",
    inSeasonMonths: ALL_YEAR,
    growMethod: "Field grown",
    icon: "circle",
  },
  {
    id: "r4",
    slug: "garlic-hardneck",
    title: "Hardneck Garlic",
    description: "Full-flavored bulbs, cured and braided, planted the fall before.",
    longDescription:
      "Hardneck garlic planted in October, mulched through the lake-effect snow, and pulled the following July. What you're buying is last summer's harvest, cured properly so it keeps its punch all year.",
    category: "roots-alliums",
    price: 2,
    unit: "per bulb",
    inSeasonMonths: ALL_YEAR,
    growMethod: "Field grown",
    icon: "circle",
  },
  {
    id: "r5",
    slug: "winter-squash",
    title: "Winter Squash",
    description: "Butternut and acorn squash, cured hard-shelled for months of storage.",
    longDescription:
      "Butternut and acorn squash, hand-selected for hard, blemish-free skin and cured in the sun for ten days before storage — the step most farms skip that determines whether a squash lasts to spring.",
    category: "roots-alliums",
    price: 3,
    unit: "per lb",
    inSeasonMonths: [1, 2, 3, 9, 10, 11, 12],
    tag: "Storage Crop",
    growMethod: "Field grown",
    icon: "wheat",
  },

  // === TOMATOES & PEPPERS (greenhouse-extended) ===
  {
    id: "t1",
    slug: "heirloom-tomatoes",
    title: "Heirloom Tomatoes",
    description: "Field-grown in summer, greenhouse-extended into the shoulder seasons.",
    longDescription:
      "Brandywine, Cherokee Purple, and Green Zebra grown in open field through summer, then in an unheated greenhouse through the shoulder seasons to stretch real tomato flavor as far into the calendar as Lake Erie will allow.",
    category: "tomatoes-peppers",
    price: 5,
    unit: "per lb",
    inSeasonMonths: [6, 7, 8, 9, 10],
    tag: "Peak Summer",
    growMethod: "Field grown",
    icon: "apple",
  },
  {
    id: "t2",
    slug: "greenhouse-cherry-tomatoes",
    title: "Greenhouse Cherry Tomatoes",
    description: "Sweet, snack-sized tomatoes grown hydroponically through the off-season.",
    longDescription:
      "While field tomatoes rest, our hydroponic house keeps a steady supply of cherry tomatoes running — trellised, hand-picked ripe, and on the shelf within a day of picking, even in January.",
    category: "tomatoes-peppers",
    price: 5,
    unit: "1 pint",
    inSeasonMonths: ALL_YEAR,
    tag: "Year-Round",
    growMethod: "Hydroponic greenhouse",
    icon: "apple",
  },
  {
    id: "t3",
    slug: "bell-peppers",
    title: "Bell Peppers",
    description: "Red, yellow, and green peppers, sweet and thick-walled.",
    longDescription:
      "Grown alongside our tomatoes in the same rotation — field in summer, greenhouse-extended through fall — so peppers stay sweet and crisp well past when most local peppers disappear.",
    category: "tomatoes-peppers",
    price: 4,
    unit: "per lb",
    inSeasonMonths: [6, 7, 8, 9, 10, 11],
    growMethod: "Field grown",
    icon: "apple",
  },
  {
    id: "t4",
    slug: "jalapeno-peppers",
    title: "Jalapeño Peppers",
    description: "Medium heat, thick flesh, good for pickling or roasting.",
    longDescription:
      "A steady, reliable heat that doesn't spike unpredictably. Grown in the same beds as our bell peppers and picked at the same green-to-red window customers ask for most.",
    category: "tomatoes-peppers",
    price: 4,
    unit: "per lb",
    inSeasonMonths: [6, 7, 8, 9, 10],
    growMethod: "Field grown",
    icon: "apple",
  },

  // === HERBS (hydroponic, year-round) ===
  {
    id: "h1",
    slug: "genovese-basil",
    title: "Genovese Basil",
    description: "Bright, aromatic basil grown hydroponically — never refrigerated, never bruised.",
    longDescription:
      "Basil bruises and blackens in cold storage, so ours never sees a fridge — it goes from the greenhouse to your bag on the same trip. Grown hydroponically year-round, which is the only way real basil exists in a Lake Erie winter.",
    category: "herbs",
    price: 3,
    unit: "per bunch",
    inSeasonMonths: ALL_YEAR,
    tag: "Year-Round",
    growMethod: "Hydroponic greenhouse",
    icon: "sprout",
  },
  {
    id: "h2",
    slug: "curly-parsley",
    title: "Curly Parsley",
    description: "A kitchen staple, grown continuously in rotating hydroponic trays.",
    longDescription:
      "Not the flash-frozen or wilted parsley from three states away — cut to order from trays we reseed every week, so it's always fresh, never woody.",
    category: "herbs",
    price: 3,
    unit: "per bunch",
    inSeasonMonths: ALL_YEAR,
    growMethod: "Hydroponic greenhouse",
    icon: "sprout",
  },
  {
    id: "h3",
    slug: "mint",
    title: "Mint",
    description: "Spearmint grown hydroponically, cut fresh for tea and cocktails alike.",
    longDescription:
      "Spearmint grown in its own isolated hydroponic bed, since mint spreads and dominates anything it's planted near. Cut to order, never dried.",
    category: "herbs",
    price: 3,
    unit: "per bunch",
    inSeasonMonths: ALL_YEAR,
    growMethod: "Hydroponic greenhouse",
    icon: "sprout",
  },

  // === SEASONAL / CSA BOXES ===
  {
    id: "b1",
    slug: "weekly-harvest-box-small",
    title: "Weekly Harvest Box — Small",
    description: "A hand-packed mix of 6-8 items, sized for 1-2 people, changing with the season.",
    longDescription:
      "The easiest way to eat what's actually in season on our farm this week. We pack it Thursday night from whatever came off the greenhouse and field beds, so no two weeks look exactly alike. Sized for one or two people cooking most nights.",
    category: "seasonal-boxes",
    price: 28,
    unit: "per week",
    inSeasonMonths: ALL_YEAR,
    tag: "Most Popular",
    growMethod: "Field grown",
    icon: "package",
  },
  {
    id: "b2",
    slug: "weekly-harvest-box-family",
    title: "Weekly Harvest Box — Family",
    description: "10-14 items, sized for a household of 3-5, changing with the season.",
    longDescription:
      "Everything in the Small box, scaled up, plus one or two extra items when they're at peak — sweet corn in July, winter squash in October. Built for a household that cooks most of its meals at home.",
    category: "seasonal-boxes",
    price: 45,
    unit: "per week",
    inSeasonMonths: ALL_YEAR,
    growMethod: "Field grown",
    icon: "package",
  },

  // === SEEDLINGS & STARTS (grow your own) ===
  {
    id: "s1",
    slug: "tomato-seedling-4pack",
    title: "Tomato Seedlings (4-pack)",
    description: "Started in our greenhouse, hardened off and ready to transplant into your own garden or a bucket.",
    longDescription:
      "The same heirloom varieties we grow ourselves, started from seed in our greenhouse and hardened off so they're ready to go straight into a garden bed, a raised bed, or a 5-gallon bucket on a porch. If you've never grown your own food before, a tomato is the most forgiving place to start.",
    category: "seedlings-starts",
    price: 6,
    unit: "4-pack",
    inSeasonMonths: [4, 5, 6],
    tag: "Grow Your Own",
    growMethod: "Hydroponic greenhouse",
    icon: "sprout",
  },
  {
    id: "s2",
    slug: "pepper-seedling-4pack",
    title: "Pepper Seedlings (4-pack)",
    description: "Bell and jalapeño starts, greenhouse-hardened and ready for a sunny spot.",
    longDescription:
      "A mix of bell and jalapeño starts, grown from the same seed stock as our field crop. Peppers want heat and sun — give them both and a 4-pack can feed a family all summer.",
    category: "seedlings-starts",
    price: 6,
    unit: "4-pack",
    inSeasonMonths: [4, 5, 6],
    tag: "Grow Your Own",
    growMethod: "Hydroponic greenhouse",
    icon: "sprout",
  },
  {
    id: "s3",
    slug: "herb-seedling-3pack",
    title: "Herb Starts (3-pack)",
    description: "Basil, parsley, and mint starts — enough for a windowsill with no yard required.",
    longDescription:
      "Basil, parsley, and mint starts sized for a single pot each. No yard, no raised bed, no problem — a sunny windowsill is enough to grow real, fresh herbs.",
    category: "seedlings-starts",
    price: 5,
    unit: "3-pack",
    inSeasonMonths: [4, 5, 6, 7, 8, 9],
    tag: "Grow Your Own",
    growMethod: "Hydroponic greenhouse",
    icon: "sprout",
  },
  {
    id: "s4",
    slug: "beginner-garden-starter-kit",
    title: "Beginner Garden Starter Kit",
    description: "Everything for a first vegetable garden: seedlings, seed-starting soil, and a plain-English guide.",
    longDescription:
      "Built for someone who has never grown a vegetable before: 6 mixed seedlings (tomato, pepper, and leafy green), a bag of seed-starting soil, and a printed copy of our beginner growing guide. Nothing to figure out on your own.",
    category: "seedlings-starts",
    price: 18,
    unit: "kit",
    inSeasonMonths: [4, 5, 6],
    tag: "Best for First-Timers",
    growMethod: "Hydroponic greenhouse",
    icon: "package",
  },
];

export const categories: {
  id: ProductCategory;
  label: string;
  description: string;
}[] = [
  { id: "leafy-greens", label: "Leafy Greens", description: "Hydroponic lettuce, spinach, chard, and more — cut this week" },
  { id: "roots-alliums", label: "Roots & Alliums", description: "Carrots, potatoes, onions, garlic — grown for flavor and storage" },
  { id: "tomatoes-peppers", label: "Tomatoes & Peppers", description: "Field-grown in summer, greenhouse-extended beyond it" },
  { id: "herbs", label: "Herbs", description: "Basil, parsley, mint — cut fresh, never refrigerated" },
  { id: "seasonal-boxes", label: "Harvest Boxes", description: "A hand-packed mix of what's in season this week" },
  { id: "seedlings-starts", label: "Seedlings & Starts", description: "Grow your own — greenhouse-started plants ready to transplant" },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(category: ProductCategory): Product[] {
  return products.filter((p) => p.category === category);
}

export function isInSeason(product: Product, month: number): boolean {
  return product.inSeasonMonths.includes(month);
}
