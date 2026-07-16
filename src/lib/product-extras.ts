import type { ProductCategory } from "@/lib/products";

/**
 * "Show the goods" — real sample excerpts pulled from the actual product
 * files, so buyers can see the quality before paying. Rolling out flagship +
 * top sellers first; add more slugs over time.
 */
export interface Sample {
  kind: "prompt" | "list" | "excerpt";
  title: string;
  body: string;
}

export const productSamples: Record<string, Sample[]> = {
  "business-email-prompt-pack": [
    {
      kind: "prompt",
      title: "Cold outreach — first contact",
      body: `Write a cold outreach email to [PROSPECT NAME], [TITLE] at [COMPANY]. I offer [YOUR SERVICE] and noticed [SPECIFIC OBSERVATION about their business].

My goal is to book a 15-minute call. Keep it under 150 words. Don't be salesy. Lead with the value I can provide based on my observation. End with a specific question, not a generic "let me know if you're interested."`,
    },
    {
      kind: "list",
      title: "Tone modifiers — drop into any prompt",
      body: `FORMAL — corporate tone suitable for C-suite executives
EMPATHETIC — write with empathy and understanding
URGENT — appropriate urgency without being aggressive
CONCISE — under 100 words, direct and to the point`,
    },
  ],
  "midjourney-prompt-mastery": [
    {
      kind: "excerpt",
      title: "The Midjourney prompt formula",
      body: `[SUBJECT] + [STYLE] + [LIGHTING] + [COMPOSITION] + [MOOD] + [PARAMETERS]

Example → A weathered lighthouse on a cliff at sunset, oil painting style, golden hour lighting, dramatic low angle, melancholic atmosphere --ar 16:9 --v 6 --style raw --q 2`,
    },
    {
      kind: "prompt",
      title: "Corporate executive headshot",
      body: `Professional headshot of a [gender] executive in their [age]s, wearing a tailored [navy/charcoal] suit, confident smile, studio lighting with soft key light, shallow depth of field, neutral gray background, Canon EOS R5, 85mm f/1.4 --ar 3:4 --v 6 --style raw`,
    },
  ],
  "prompt-engineering-masterclass-ebook": [
    {
      kind: "list",
      title: "After reading this book, you will —",
      body: `Understand WHY certain prompts work and others fail
Master frameworks that produce consistent, high-quality results
Build reusable prompt libraries that save hours daily
Develop prompts that generate income (sell them or use for clients)`,
    },
    {
      kind: "excerpt",
      title: "Inside — the CRAFT framework",
      body: `Ch.3 · The CRAFT Framework — Context, Role, Action, Format, Tone. The five-part structure that turns a vague request into a precise instruction the model can't misread.`,
    },
  ],
};

/** Category → what you actually get + a realistic time-ROI (buy-back-your-time framing). */
export const categorySpec: Record<
  ProductCategory,
  { format: string; delivery: string; hoursBack: string }
> = {
  templates: { format: "Ready-to-use template", delivery: "Instant download + duplicate link", hoursBack: "~5 hrs/week" },
  prompts: { format: "Copy-paste prompt pack (PDF)", delivery: "Instant download", hoursBack: "~4 hrs/week" },
  ebooks: { format: "PDF e-book", delivery: "Instant download", hoursBack: "One-time skill, used forever" },
  automation: { format: "Industry automation kit", delivery: "Instant download + setup guide", hoursBack: "~15 hrs/week" },
  assets: { format: "Design asset pack", delivery: "Instant download · commercial license", hoursBack: "~6 hrs/week" },
  courses: { format: "Video course + resources", delivery: "Instant lifetime access", hoursBack: "Compounds over time" },
};

export const productFaqs: { q: string; a: string }[] = [
  { q: "How do I get it after buying?", a: "Instantly. The moment your payment clears you get a download link on-screen and by email — no waiting, no shipping." },
  { q: "Do I need any tech skills?", a: "No. Everything is plain-English and copy-paste. If you can open a PDF and paste text into ChatGPT, you're ready." },
  { q: "Which AI tools does it work with?", a: "All of the major ones — ChatGPT, Claude, Gemini, and more. The prompts and systems are written to be tool-agnostic." },
  { q: "Can I use it for my business or clients?", a: "Yes. Use it for your own business, and for client work. Asset packs include a commercial license." },
  { q: "Do I get updates?", a: "Yes — free lifetime updates. When a product improves, you get the new version at no extra cost." },
  { q: "Is it a subscription?", a: "No. It's a one-time payment and it's yours forever. (Only the Inner Circle membership is recurring, and clearly marked.)" },
];

export const whyUs: { title: string; desc: string }[] = [
  { title: "Curated, not a data dump", desc: "Competitors bury you in 100,000 unsorted prompts. Every tool here is hand-built for one real job — so you use it, not sift through it." },
  { title: "Built to buy back your time", desc: "Each product is aimed at the draining, repetitive work you shouldn't be doing — quoting, follow-ups, admin — so you get hours back every week." },
  { title: "Plain English, zero jargon", desc: "Written for real people and busy operators, not prompt engineers. If you can copy and paste, you can get results today." },
  { title: "Made by an operator, backed by a human", desc: "Created by someone who needed these to work — with real support you can actually reach, not a ticket void." },
];
