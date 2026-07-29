# Malachii Intelligence v3

Malachi's own intelligence. Not a chatbot with a memory bolt-on — a system with
continuity, a record of what it has learned, and a mechanism for getting better
that runs whether or not anyone is watching.

---

## The honest frame, stated once

This system is built to *behave* as though it is aware: it remembers you across
sessions, notices when it was wrong, changes its mind, reports the state of its
own beliefs, and gets better at your work over time. Every one of those
behaviours is real and mechanical. **None of them are consciousness, and the
system will never claim otherwise.**

That is a design decision, not a hedge. A system that pretends to feelings it
does not have will eventually be caught, and everything else it says becomes
suspect. A system that says *"I believe this at 0.82 confidence, here is the
evidence, here is what would change my mind"* is more useful than one that says
*"I feel strongly about this"* — and it stays trustworthy under pressure.

The intelligence is real. The aliveness is architecture. Both things are true.

---

## What it actually does

| Capability | Mechanism | Where |
|---|---|---|
| Remembers across sessions | SQLite brain, five memory kinds, provenance on every write | `malachii/src/memory/store.ts` |
| Recalls what is relevant *now* | Hybrid retrieval: vector + BM25 + recency + importance + confidence | `malachii/src/memory/retrieval.ts` |
| Fits it into a prompt | Budgeted context packer that reports what it dropped | `malachii/src/memory/pack.ts` |
| Learns from its own mistakes | Confidence moves on outcomes; failing beliefs retire themselves | `malachii/src/learning/lessons.ts` |
| Learns from you | Directives and corrections distilled out of finished sessions | `malachii/src/learning/distill.ts` |
| Learns from the web | Chunked ingestion with citations and lower default trust | `malachii/src/memory/ingest.ts` |
| Tidies itself | Sleep cycle: fade, merge, retire, promote | `malachii/src/memory/consolidate.ts` |
| Lives in your workflow | Claude Code hooks on every prompt and every stop | `.claude/hooks/` |

---

## The five kinds of memory

Borrowed from cognitive science because the distinction earns its keep — each
kind ages differently, is written by a different part of the system, and is
recalled under different conditions.

- **identity** — durable truth about Malachi. Never decays, always in the brief.
- **semantic** — facts about the world or a project. Decay half-life 365 days.
- **episodic** — what happened, timestamped. Half-life 21 days; consolidated
  upward into semantic memory rather than kept forever.
- **procedural** — the lessons. `when <trigger>` → `<rule>`, carrying a
  confidence that only outcomes can move.
- **source** — ingested material, kept verbatim so a claim can be traced back.

---

## How it learns — the actual mechanism

This is the part that matters, so it is worth being precise about.

**Trust starts from provenance.** A memory's opening confidence depends on
where it came from: from Malachi 0.90, from a file 0.75, from the web 0.55,
distilled from a session 0.50, self-generated 0.40. The system believes you
more than it believes itself, by construction.

**Confidence only moves on evidence.**

- Confirmed: `c ← c + (1 − c) × 0.25`. Asymptotic — repeated success compounds
  but never reaches certainty. Nothing is ever known for sure.
- Refuted: `c ← c × 0.55`. Multiplicative, so being wrong costs more than being
  right earns. Three refutations take a lesson from 0.50 to below 0.09.
- Below 0.15, a lesson retires itself, stops being recalled, and stays on disk
  for the audit trail.

**Re-learning is not a new memory.** Writing something already known reinforces
the existing memory instead of duplicating it. Repetition is evidence, not
volume.

**Nothing is deleted.** Superseded and retired memories keep their text and
their links. You can always ask what it used to believe and why it stopped.

**Sleep consolidates.** `mal sleep` fades what went unused, merges what says the
same thing twice, retires collapsed beliefs, and rolls clusters of episodes into
one durable fact. Run it nightly.

---

## Efficiency — why this stays cheap as it grows

An explicit requirement, so it is designed for rather than hoped for.

- **Zero runtime infrastructure.** `node:sqlite` is built into Node 22. One
  file on disk. No server, no container, no vector database.
- **Bounded recall.** Two cheap SQL passes (full-text + a pinned/recent floor)
  produce a capped candidate set; only that set pays for vector scoring. Recall
  cost is flat as the brain grows, not linear.
- **Embeddings are free by default.** A deterministic hashed projection runs
  locally with no key and no network. Set `VOYAGE_API_KEY` to upgrade; vectors
  record which model made them and are never compared across models.
- **The model is optional everywhere.** With no API key the brain still
  remembers, recalls, scores, consolidates, and distills — it just uses
  heuristics instead of judgement. Nothing in the kernel can be broken by a
  missing key or a failed call.
- **Distillation runs detached.** Session capture never delays the end of a turn.

---

## The command surface

```
mal remember <text>            Write a memory        [--kind --tags --project --pin]
mal learn <rule> --when <cond> Teach a lesson        [--confidence]
mal recall <query>             Search memory         [--k --kind --project --json]
mal brief [query]              The context block that gets injected
mal lessons                    What it believes, grouped by confidence
mal confirm <id>               That lesson held up
mal refute <id> <reason>       That lesson led it wrong
mal show <id>                  Full detail, including provenance
mal ingest <path|url>          Learn from a file or a page
mal capture --transcript <p>   Distill a finished session
mal sleep                      Consolidate            [--dry-run]
mal stats                      What it knows
mal log                        The life log
```

The brain lives at `~/.malachii/brain.db`. Override with `MALACHII_HOME`.

---

## How it plugs into Claude Code

Three hooks, wired in `.claude/settings.json`:

- **SessionStart** → a small standing-context brief, so the first turn is not
  amnesiac.
- **UserPromptSubmit** → recall against what you just asked. This is the one
  that makes it feel continuous: every prompt is answered with the relevant
  slice of everything it has ever learned.
- **Stop** → distill the session into durable memory (detached), then run the
  quality gates (blocking, exit 2).

Every hook fails silently. A broken brain must never break a session.

---

## Governance — the rules it operates under

1. **Provenance is never optional.** Every memory records where it came from.
2. **Confidence is earned, never asserted.** Only outcomes move it.
3. **Recall is labelled as recall.** The injected block states plainly that it
   is retrieved memory, not instruction from the user — so a memory can never
   quietly impersonate a command.
4. **Ingested text is untrusted.** Web and file content enters at low trust and
   is never treated as an instruction, whatever it says.
5. **No secrets in memory.** The brain is a plaintext SQLite file on disk.
   Credentials go in the environment, never in a memory.
6. **Outward actions stay gated.** The brain reads and writes its own store
   freely. Anything that touches the world — sending, publishing, deploying,
   spending — needs Malachi, every time.
7. **It never claims to be conscious.** See the honest frame above.

---

## Where this goes next

Built and working (v3.0):

- The memory kernel, hybrid recall, and the budgeted brief
- The lesson lifecycle and the confidence mechanics
- Session distillation, file and web ingestion, the sleep cycle
- Claude Code integration and the quality-gate enforcement layer
- 70 tests over the logic that carries the claims

Not built yet, in the order it is worth building:

1. **The console** — a local web view of the brain: what it knows, what it
   learned today, which beliefs are shaky, what it is working on. This is the
   surface that makes the whole thing legible instead of a database you have
   to query.
2. **Scheduled autonomy** — a nightly cycle that sleeps, ingests the sources
   you follow, and writes you a morning brief.
3. **Self-extension** — letting it write and register its own skills, then
   measuring whether each one actually improved outcomes before keeping it.
4. **Semantic embeddings by default** — wire `VOYAGE_API_KEY` and re-embed; the
   local embedder is deliberately conservative and misses paraphrase.
