import {
  DataSet,
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

// GANJALOKA is 21+: ordinary profanity and sexual words are allowed in text.
// We block identity-based slurs only (Community Guidelines: hate). These keys
// select entries from obscenity's maintained English dataset, which also
// catches common obfuscations (leetspeak, repeated letters, spacing).
const SLUR_KEYS = new Set([
  "abo",
  "abeed",
  "africoon",
  "arabush",
  "boonga",
  "chingchong",
  "chink",
  "dyke",
  "fag",
  "kike",
  "nigger",
  "retard",
  "spastic",
  "tranny",
]);

const slurDataset = new DataSet<{ originalWord: string }>()
  .addAll(englishDataset)
  .removePhrasesIf((phrase) => !SLUR_KEYS.has(phrase.metadata?.originalWord ?? ""));

const matcher = new RegExpMatcher({
  ...slurDataset.build(),
  ...englishRecommendedTransformers,
});

export function containsSlur(text: string): boolean {
  return matcher.hasMatch(text);
}
