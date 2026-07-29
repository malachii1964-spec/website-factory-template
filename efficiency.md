# Efficiency Law

# Getting the most out of the model, and out of the machine. Applies to every build.
# design.md governs how it looks. performance.md governs how fast it loads.
# This governs how well the intelligence itself runs.

The premise: capability is not the scarce resource any more — attention,
tokens, and time are. Two systems with the same model can differ by an order
of magnitude in what they actually deliver, and the difference is entirely in
how they are driven.

---

## Part 1 — Driving the model

### Effort is the biggest single lever
`output_config.effort` accepts `low` / `medium` / `high` / `xhigh` / `max`, and
defaults to `high`. It controls reasoning depth *and* how much work gets done
per turn.

- `xhigh` — coding and agentic work. This is the setting for real building.
- `high` — the default; anything intelligence-sensitive.
- `medium` — a genuine cost saver on well-specified work. Test it before
  assuming you need more.
- `low` — extraction, classification, triage, subagents, anything mechanical.
  Distillation runs here.
- `max` — reserve for genuinely hard, latency-insensitive problems. It can
  overthink simpler ones and shows diminishing returns.

**Never downgrade the model to save money — tune effort instead.** A weaker
model on a hard problem produces work you have to redo, which costs more than
it saved. Effort is the dial; the model is not.

**Effort does not reliably shorten prose.** If output is too long, say so in
the prompt. Lowering effort changes how much it thinks, not how much it writes.

### Caching is where the real money is
Prompt caching is a **prefix match**: any byte change anywhere in the prefix
invalidates everything after it. Cache reads cost roughly a tenth of full
price; writes cost about 1.25×.

- Order every prompt **stable content first, volatile content last**. Frozen
  system prompt, then deterministic tool list, then the changing question.
- Never interpolate a timestamp, a UUID, or a session id into a system prompt.
  One `Date.now()` at the top makes the entire prompt uncacheable, silently.
- Minimum cacheable prefix on Claude Opus 5 is **512 tokens** — half what it
  was on 4.8, so prompts previously too short to cache now qualify.
- Verify rather than assume: if `usage.cache_read_input_tokens` is zero across
  repeated calls, something is invalidating the prefix. Find it.

**This applies directly to Malachii.** The injected brief is a large, mostly
stable block on every single prompt. Identity memories change almost never;
query-specific recall changes every time. The identity half belongs *before*
the cache breakpoint and the recall half *after* it.

### Spend tokens where they compound, not where they evaporate
- **One well-specified turn beats five vague ones.** Long-horizon work is
  better *and* cheaper when the full task, intent, and constraints arrive up
  front. Drip-feeding across turns costs more and produces worse results.
- **Batch anything not latency-sensitive.** The Batch API is 50% off and
  returns within the hour. Nightly consolidation and distillation are exactly
  this shape — there is no user waiting.
- **Structured outputs instead of parse-and-retry.** Constrain the response
  with a JSON schema (`output_config.format`) and the reply is valid by
  construction. Retry loops are pure waste.
- **Return parallel tool results in a single message.** Splitting them across
  messages trains the model out of parallel calls, and everything serialises.
- **Count tokens, don't estimate them.** Use the `count_tokens` endpoint.
  `tiktoken` is a different tokenizer and undercounts Claude by 15–20%.

### Manage context before it manages you
- **Context editing** clears stale tool results from a long loop.
- **Compaction** summarises history server-side as it approaches the window.
- **Task budgets** tell the model its ceiling for a whole agentic loop so it
  paces itself and lands the plane, instead of being cut off mid-thought.

### Behavioural facts about Claude Opus 5 worth exploiting
- Thinking is **on by default**. `max_tokens` caps thinking *plus* output — a
  budget sized for the answer alone will truncate.
- It **verifies its own work unprompted**. Instructions telling it to
  double-check cause redundant work; delete them.
- It **delegates to subagents readily**. Cap it. Each subagent re-establishes
  context, re-explores, reports back, and then gets re-read — the overhead is
  real and multiplies fast.
- It **writes long by default**, in chat and in files. Ask for concision
  explicitly if you want it.

---

## Part 2 — Driving the machine

- **Do the cheap filter first.** Two indexed SQL passes to bound a candidate
  set, then expensive scoring on the survivors. Never score everything.
- **Bound every query.** A `LIMIT` on every list, a cap on every scan, a
  ceiling on every fan-out. Unbounded is a bug that only shows up once it
  matters.
- **Keep quadratic work inside a bucket.** O(n²) is fine over 40 rows in one
  partition and fatal over 40,000 across the table.
- **Reach for zero-infrastructure first.** A SQLite file beat a vector
  database here on cost, latency, and operations, and lost nothing that
  mattered. Infrastructure is a permanent tax; justify each piece out loud.
- **Degrade, never fail.** Every enhancement — embeddings, model calls,
  network — must have a path where it is absent and the system still works.
- **Measure before optimising, and write the number down.** The near-duplicate
  threshold in this codebase is 0.85 because it was measured, not guessed.

---

## Verification

An efficiency claim without a number is an opinion. Before claiming something
is faster, cheaper, or lighter, state what you measured and what it was
before. "Reduced the candidate scan from every row to a bounded 300" is a
result; "optimised recall" is not.
