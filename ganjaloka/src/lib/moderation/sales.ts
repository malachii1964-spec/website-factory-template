// Sales-solicitation detector. GANJALOKA has no buying or selling of cannabis
// (App Store 1.4.3, Google Play marijuana policy). Talking about prices paid at
// a dispensary is fine; offering, pricing or arranging a sale is not.

const PRODUCT =
  "(?:weed|bud|buds|flower|gas|za|zaza|exotics?|carts?|cartridges?|pens?|vapes?|wax|dabs?|shatter|rosin|resin|hash|kief|edibles?|gummies|pre-?rolls?|thc|kush|ounces?|oz|grams?|qp|qps|lbs?|zips?|eighths?|8ths?|clones|seeds)";
const CONTACT =
  "(?:dm|dms|pm|inbox|text me|txt me|hmu|hit me up|hit my line|(?:link )?in (?:my )?bio|telegram|whatsapp|wickr|signal me|snap me)";
const PURCHASE =
  "(?:prices?|pricing|menu|orders?|buy|cop|purchase|deals?|delivery|deliver|shipping|ship|plug|re-?ups?|pick-?up)";
const PAYMENT = "(?:cash ?app|venmo|zelle|paypal|btc|bitcoin|crypto)";
const UNIT =
  "(?:g|grams?|eighths?|8ths?|quarters?|qps?|oz|ounces?|zips?|lbs?|pounds?|halves|half|carts?|pens?)";
// "$35 an eighth", "oz for $120", "eighths $35", "qp = 500"
const PRICE = `(?:\\$\\s?\\d+[^\\n]{0,15}\\b${UNIT}\\b|\\b${UNIT}\\b\\s?(?:for|=|@|-|:)?\\s?\\$\\s?\\d+|\\b${UNIT}\\b\\s?(?:for|=|@)\\s?\\d+)`;
const OFFER_CUE = `(?:${CONTACT}|available|in stock|restocked)`;

const PATTERNS: RegExp[] = [
  // "zaza for sale", "WTS carts", "now selling exotics" — and the reverse order.
  new RegExp(`\\b(?:for sale|wts|wtb|(?:i'?m|i am|we'?re|we are|now|still)\\s+selling)\\b.{0,40}\\b${PRODUCT}\\b`),
  new RegExp(`\\b${PRODUCT}\\b.{0,40}\\b(?:for sale|wts|wtb)\\b`),
  // "DM for prices", "menu in bio", "hmu to cop"
  new RegExp(`\\b${CONTACT}\\b.{0,30}\\b${PURCHASE}\\b`),
  new RegExp(`\\b${PURCHASE}\\b.{0,30}\\b${CONTACT}\\b`),
  // "we deliver", "delivery available", "discreet shipping"
  /\b(?:we|i)\s+(?:deliver|ship)\b/,
  /\b(?:delivery|shipping)\s+(?:available|worldwide|nationwide|same[\s-]?day|now open)\b/,
  /\bdiscre+te?\s+(?:shipping|delivery|packag\w*)\b/,
  // "cashapp only", "accepting zelle"
  new RegExp(`\\b${PAYMENT}\\s+(?:only|accepted|ok|payments?)\\b`),
  new RegExp(`\\b(?:accept|accepting|take|taking)\\s+${PAYMENT}\\b`),
  // "I'm your plug"
  /\b(?:i'?m|im|i am|your|ur|ya)\s+(?:new\s+|local\s+|trusted\s+)?plug\b/,
  // A unit price next to an offer cue: "oz for $120, hmu", "in stock: eighths $35"
  new RegExp(`${PRICE}[^\\n]{0,40}\\b${OFFER_CUE}\\b`),
  new RegExp(`\\b${OFFER_CUE}\\b[^\\n]{0,40}${PRICE}`),
];

export function normalizeForMatching(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ");
}

export function looksLikeSaleSolicitation(text: string): boolean {
  const normalized = normalizeForMatching(text);
  return PATTERNS.some((pattern) => pattern.test(normalized));
}
