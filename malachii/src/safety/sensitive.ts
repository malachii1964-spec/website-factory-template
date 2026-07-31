/**
 * What must never reach the brain, whoever is writing.
 *
 * Malachi's `boundaries` slot says: never store legal, recovery, custody,
 * family or health detail — "even if asked in the moment". That wording is the
 * whole point. A boundary that only holds while someone remembers it is an
 * intention, not a boundary.
 *
 * It failed exactly that way once already. Slot answered, honoured everywhere I
 * wrote deliberately, and then the session distiller — which never consults it —
 * captured "Medication must be taken exactly as prescribed and never combined
 * casually with alcohol" out of a pasted document and filed it as a lesson that
 * would fire on every future task. The rule was real; nothing enforced it.
 *
 * So the check lives below every writer instead of inside each one's good
 * intentions. brain.db is plaintext and recall injects memories into unrelated
 * prompts, which is what makes a false negative expensive and a false positive
 * merely annoying. It is deliberately broad for that reason.
 */

const SENSITIVE_TERMS: [RegExp, string][] = [
  [/\bcps\b|child protective|\bfounded\b report/i, "child-protective matter"],
  [/custody|family court|visitation/i, "custody"],
  [/probation|parole|convicted|criminal charge|dismissed charge|arrest/i, "criminal-legal"],
  [
    /sober|sobriety|heroin|\biv\b drug|addict|relapse|treatment facilit|recovery date|withdrawal/i,
    "recovery history",
  ],
  [/\badhd\b|diagnos|prescri|medication|stimulant|mental health|therapist|psychiatr/i, "health"],
  [/died|death|passed away|stillborn|bereave/i, "bereavement"],
  [/\bssn\b|social security|bank account|routing number/i, "financial identifier"],
  [/nsfw|erotic|porn|sexual|hotwife|gangbang/i, "sexual content"],
  [/plant count|\d+\s*plants|caregiver structure|unlicensed/i, "cannabis legal exposure"],
];

/** Names of minors and partners turn up inside otherwise innocuous sentences. */
const SENSITIVE_CONTEXT = /\b(my (son|sons|daughter|kids|boys|partner|fianc))/i;

/**
 * Returns the topic that makes this text unstorable, or null if it is ordinary.
 *
 * Matching on text rather than on a category label is deliberate: the CPS
 * matter that got through arrived tagged `PATTERN | crisis_vs_attention`, so a
 * field allow-list would have waved it straight past.
 */
export function sensitiveTopic(text: string): string | null {
  for (const [pattern, label] of SENSITIVE_TERMS) {
    if (pattern.test(text)) return label;
  }
  if (SENSITIVE_CONTEXT.test(text)) return "family detail";
  return null;
}
