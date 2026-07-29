/**
 * Embeddings.
 *
 * The default embedder is local, deterministic, and free: a signed random
 * projection of a word/bigram bag. It is not as good as a trained model at
 * abstract paraphrase, but it is good at what retrieval actually leans on
 * here — topical overlap and near-duplicate detection — and it costs nothing
 * and needs no network. When `VOYAGE_API_KEY` is set the brain upgrades to a
 * real embedding model and records which model produced each vector, so
 * vectors from different models are never compared to each other.
 */

export interface Embedder {
  /** Recorded alongside every vector. Vectors are only compared within a model. */
  readonly id: string;
  readonly dim: number;
  /**
   * Cosine above which this model considers two texts to be the same thing.
   * Every embedding space has its own scale, so the threshold belongs to the
   * model rather than to the caller — a value tuned for a trained model is
   * far too strict for a hashed one and would silently disable de-duplication.
   */
  readonly nearDuplicate: number;
  embed(texts: string[]): Promise<Float32Array[]>;
}

const STOP = new Set([
  "the", "a", "an", "and", "or", "but", "if", "then", "of", "to", "in", "on",
  "for", "with", "is", "are", "was", "were", "be", "been", "it", "this", "that",
  "as", "at", "by", "from", "you", "your", "i", "we", "he", "she", "they",
]);

/** Light suffix stripping — enough to collapse plurals and gerunds, not a real stemmer. */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith("ing")) return word.slice(0, -3);
  if (word.length > 4 && word.endsWith("ed")) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

export function tokenize(text: string): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
    .split(/[\s_-]+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map(stem);

  const grams = [...words];
  for (let i = 0; i + 1 < words.length; i++) grams.push(`${words[i]!}~${words[i + 1]!}`);
  return grams;
}

function fnv1a(text: string, seed = 0x811c9dc5): number {
  let hash = seed;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

/**
 * Hashed random-projection embedder. Same text always yields the same vector,
 * on any machine, with no model file to ship.
 */
export class LocalEmbedder implements Embedder {
  readonly id: string;
  readonly dim: number;
  /**
   * Measured on this embedder: text differing only in punctuation and a word
   * of title scores ~0.88, a genuine paraphrase ~0.67, unrelated text ~0.15.
   * 0.85 sits in the gap — it catches restatements without collapsing two
   * memories that merely share a subject.
   */
  readonly nearDuplicate = 0.85;

  constructor(dim = 256) {
    this.dim = dim;
    this.id = `local-hash-v1-${dim}`;
  }

  embedOne(text: string): Float32Array {
    const vec = new Float32Array(this.dim);
    const grams = tokenize(text);
    if (grams.length === 0) return vec;

    // Sub-linear term weighting: a word repeated ten times is not ten times the signal.
    const counts = new Map<string, number>();
    for (const g of grams) counts.set(g, (counts.get(g) ?? 0) + 1);

    for (const [gram, count] of counts) {
      const h = fnv1a(gram);
      const index = h % this.dim;
      const sign = (fnv1a(gram, 0x9e3779b1) & 1) === 0 ? 1 : -1;
      // Bigrams carry more meaning than isolated words.
      const specificity = gram.includes("~") ? 1.35 : 1;
      vec[index]! += sign * specificity * (1 + Math.log(count));
    }

    let norm = 0;
    for (let i = 0; i < this.dim; i++) norm += vec[i]! * vec[i]!;
    norm = Math.sqrt(norm);
    if (norm > 0) for (let i = 0; i < this.dim; i++) vec[i]! /= norm;
    return vec;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    return texts.map((t) => this.embedOne(t));
  }
}

/** Voyage AI embeddings — used automatically when `VOYAGE_API_KEY` is present. */
export class VoyageEmbedder implements Embedder {
  readonly id: string;
  readonly dim = 1024;
  /** Trained embedding spaces are far tighter; near-duplicates sit above 0.93. */
  readonly nearDuplicate = 0.93;
  readonly #apiKey: string;
  readonly #model: string;

  // voyage-4 is the current generation and carries a 200M-token free
  // allocation per account; the legacy voyage-3.x line lost its free tier.
  // Override with VOYAGE_MODEL. The stored vector length comes from the
  // response itself, so a model with different dimensions still records
  // correctly — `dim` here is only what we advertise up front.
  constructor(apiKey: string, model = "voyage-4") {
    this.#apiKey = apiKey;
    this.#model = model;
    this.id = `voyage:${model}`;
  }

  async embed(texts: string[]): Promise<Float32Array[]> {
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${this.#apiKey}`,
      },
      body: JSON.stringify({ input: texts, model: this.#model, input_type: "document" }),
    });
    if (!response.ok) {
      throw new Error(`Voyage embeddings failed: ${response.status} ${await response.text()}`);
    }
    const json = (await response.json()) as { data?: { embedding?: number[] }[] };
    const data = json.data ?? [];
    if (data.length !== texts.length) {
      throw new Error(`Voyage returned ${data.length} embeddings for ${texts.length} inputs`);
    }
    return data.map((d) => Float32Array.from(d.embedding ?? []));
  }
}

export function defaultEmbedder(): Embedder {
  const key = process.env["VOYAGE_API_KEY"];
  if (key) return new VoyageEmbedder(key, process.env["VOYAGE_MODEL"] ?? "voyage-4");
  return new LocalEmbedder();
}

/** Both vectors are stored L2-normalised, so this is a plain dot product. */
export function cosine(a: Float32Array, b: Float32Array): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i]! * b[i]!;
  return dot;
}

export function toBlob(vec: Float32Array): Uint8Array {
  return new Uint8Array(vec.buffer.slice(vec.byteOffset, vec.byteOffset + vec.byteLength));
}

export function fromBlob(blob: Uint8Array): Float32Array {
  // Copy rather than alias: SQLite's buffer is not guaranteed 4-byte aligned.
  const copy = new Uint8Array(blob.byteLength);
  copy.set(blob);
  return new Float32Array(copy.buffer);
}
