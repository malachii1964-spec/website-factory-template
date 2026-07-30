# Memory extraction prompts

Four prompts, one per assistant, for harvesting what each already knows about
Malachi into the brain. Paste one into each model, save the raw reply, review it,
then ingest.

## Why they differ

The four store different things in different shapes, so the *retrieval*
instruction differs even though the output contract is identical:

- **ChatGPT** has explicit saved memories the user can enumerate, plus separate
  referenced chat history. Those two sources have very different reliability, so
  the prompt makes it label which one each line came from.
- **Claude** searches past conversations, but usually only when told to — asked
  cold it will answer from the current thread alone.
- **Grok** works from conversation history and, if linked, X activity. Public
  posting behaviour is not the same evidence as a private conversation, so it
  gets tagged separately.
- **Qwen** has the weakest cross-session memory of the four. Its prompt is built
  primarily to make returning *nothing* an acceptable answer, because a model
  with no memory asked "what do you know about me" will reconstruct rather than
  decline.

## The one thing that makes this work

Every prompt forces `OBSERVED` vs `INFERRED` on each line. Without that, models
blend real memory with plausible inference in a single confident voice, and once
that lands in the brain the distinction is gone permanently.

The second-most important line is the permission to return nothing. A model not
given that permission will pad to fill whatever shape it was handed.

## After collecting the replies

1. **Read them before ingesting.** The brain is plaintext SQLite on disk. These
   dumps tend to surface financial, family, health and location details. Delete
   anything that shouldn't sit unencrypted in a file.
2. Ingest `OBSERVED` lines at moderate confidence with provenance (which model
   said it), never as though Malachi stated it directly.
3. `INFERRED` lines are leads, not facts — they get confirmed by him or by
   outcomes before they carry weight.
4. Where two models contradict each other, surface it rather than picking a
   winner. A contradiction about him is worth thirty seconds of his attention.
5. `SLOT` lines map to `mal me <slot> "<answer>"` — but he confirms each one.
   Identity is the one thing that should never arrive second-hand unchallenged.

---

## 1 — ChatGPT

```
I'm consolidating what my various AI assistants know about me into a single
personal memory system. I want an accurate export of what YOU specifically hold
on me — not a description of me written to be pleasing or complete.

Work in two passes, and keep them separate.

PASS 1 — Saved memories. List every saved memory you hold about me, as close to
verbatim as you can. These are the explicit ones (Settings → Personalization →
Manage Memories). Tag each of these SAVED.

PASS 2 — Chat history. Now, separately, what do you know about me from our past
conversations that is NOT in those saved memories? Tag each of these HISTORY.

Rules that matter more than completeness:
- Mark every line OBSERVED (you actually have this stored, or you can point to a
  conversation where it came up) or INFERRED (you're reasoning it from patterns).
  Never blur the two.
- If a statement would be true of most people who talk to you, leave it out. I
  want what distinguishes me, not what makes me a user.
- Do not pad. If your real knowledge of me is thin, five honest lines beat a page
  of plausible ones. "I don't have much here" is a valid and useful answer.
- Don't flatter me. If my stated goals don't match what I actually do, say so.

Cover, where you have real material: what I'm working on and building toward;
how I want to be talked to (tone, length, directness); what I value in how work
gets done; what I've told you never to do; recurring frustrations; decisions I've
reversed.

Output format — one line each, pipe-delimited, nothing else on the line:

TYPE | FIELD | OBSERVED_OR_INFERRED | STATEMENT | BASIS

TYPE is one of: SLOT, FACT, PREFERENCE, PATTERN, PROJECT, BOUNDARY
FIELD for SLOT lines is one of: name, work, style, purpose, boundaries, values
FIELD for everything else is a short tag of your choosing
BASIS is when/where this came from, or what you inferred it from

Then three short sections:

CHANGED: things that were true of me once and probably aren't now
CONTRADICTIONS: where I've been inconsistent with myself
GAPS: notable things you do NOT know about me
```

---

## 2 — Claude

```
Before you answer anything below, search your memory of our past conversations.
Do not answer from this conversation alone — most of what I'm asking for is in
earlier threads, and if you skip the search you'll reconstruct instead of recall.

I'm consolidating what my various AI assistants know about me into a single
personal memory system. I want an accurate export of what you actually hold on
me — not a generous or well-rounded portrait.

Rules that matter more than completeness:
- Mark every line OBSERVED (you found it in a past conversation or stored memory
  — say which) or INFERRED (you're reasoning it from patterns). Never blur them.
- Put your uncertainty in the OBSERVED/INFERRED field, not in hedging prose. I'd
  rather have a flat claim tagged INFERRED than a paragraph of qualifications.
- If a statement would be true of most people who talk to you, leave it out.
- Do not pad. If you find little, say so in a line and stop. "I searched and
  there isn't much" is a real answer and I'd rather have it than filler.
- Don't soften. If my stated goals don't match my actual behaviour, or I've asked
  for something and then done the opposite, that's exactly what I want recorded.

Cover, where the conversations actually support it: what I'm working on and
building toward; how I want to be talked to; what I value in how work gets done;
limits I've set; where I've pushed back on you and why; decisions I've reversed.

Output format — one line each, pipe-delimited, nothing else on the line:

TYPE | FIELD | OBSERVED_OR_INFERRED | STATEMENT | BASIS

TYPE is one of: SLOT, FACT, PREFERENCE, PATTERN, PROJECT, BOUNDARY
FIELD for SLOT lines is one of: name, work, style, purpose, boundaries, values
FIELD for everything else is a short tag of your choosing
BASIS is which conversation or when, or what you inferred it from

Then three short sections:

CHANGED: things that were true of me once and probably aren't now
CONTRADICTIONS: where I've been inconsistent with myself
GAPS: notable things you do NOT know about me
```

---

## 3 — Grok

```
I'm consolidating what my various AI assistants know about me into one personal
memory system. I want your honest export of what you actually have on me.

Blunt is what I want here. If I've been inconsistent, if what I say I'm doing
doesn't match what I actually do, if I keep restarting the same project — say it
plainly. A flattering summary is useless to me. An accurate unflattering one is
worth real money.

Rules:
- Mark every line OBSERVED (from an actual conversation or stored memory) or
  INFERRED (you're reasoning it out). Never blur the two.
- If you're drawing on my X activity rather than our conversations, tag those
  lines SOURCE=X. Public posting is different evidence from a private
  conversation and I want to weight them differently.
- If a statement would be true of most people who talk to you, cut it.
- Don't pad. Thin and honest beats long and plausible. "Not much here" is fine.

Cover, where you have real material: what I'm working on and building toward;
how I want to be talked to; what I actually value versus what I say I value;
limits I've set; recurring frustrations; things I've started and dropped.

Output format — one line each, pipe-delimited, nothing else on the line:

TYPE | FIELD | OBSERVED_OR_INFERRED | STATEMENT | BASIS

TYPE is one of: SLOT, FACT, PREFERENCE, PATTERN, PROJECT, BOUNDARY
FIELD for SLOT lines is one of: name, work, style, purpose, boundaries, values
FIELD for everything else is a short tag of your choosing
BASIS is when/where it came from, or what you inferred it from

Then three short sections:

CHANGED: things that were true of me once and probably aren't now
CONTRADICTIONS: where I've been inconsistent with myself
GAPS: notable things you do NOT know about me
```

---

## 4 — Qwen

```
First, answer one question honestly before anything else: do you retain any
memory of me from previous conversations, or does your knowledge of me start
fresh in this chat?

If you do NOT have persistent memory of me across sessions, say exactly that in
one line and stop. Do not reconstruct a profile of me from this message, and do
not describe what a typical user like me might be like. An honest "no memory
here" is genuinely the most useful thing you can give me, and I'd rather have it
than an invented profile — I'm cross-checking four assistants against each other,
so a fabricated answer costs me more than an empty one.

If you DO retain something about me, export it under these rules:
- Mark every line OBSERVED (actually retained from a previous conversation) or
  INFERRED (reasoned from patterns). Never blur them.
- If a statement would be true of most people who talk to you, leave it out.
- Do not pad to fill the format. Three real lines beat thirty plausible ones.

Output format — one line each, pipe-delimited, nothing else on the line:

TYPE | FIELD | OBSERVED_OR_INFERRED | STATEMENT | BASIS

TYPE is one of: SLOT, FACT, PREFERENCE, PATTERN, PROJECT, BOUNDARY
FIELD for SLOT lines is one of: name, work, style, purpose, boundaries, values
FIELD for everything else is a short tag of your choosing
BASIS is when/where it came from, or what you inferred it from

Then:

GAPS: notable things you do NOT know about me
```
