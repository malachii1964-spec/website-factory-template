---
name: model-router
description: Choose the right model for a task instead of defaulting to the biggest one. Use when starting any substantial task, when cost or latency matters, when delegating to a subagent, or when the user asks which model to use. Triggers on "which model", "use opus", "too expensive", "too slow", or at the start of a multi-step build.
---

# Model routing

Right model for the task. Not the biggest one by reflex.

| Task | Model | Why |
|---|---|---|
| Architecture, planning, hard debugging | `claude-opus-5` | Decisions that propagate; worth the tokens |
| Implementation, content, research | `claude-sonnet-5` | Strong output, materially cheaper |
| Validation, schema checks, classification, extraction | `claude-haiku-4-5` | Fast and sufficient for gates |

## Route by consequence, not by difficulty

The question is not "is this hard." It is **"what does a wrong answer cost."**

- A wrong architecture decision propagates into every file after it → Opus
- A wrong line of implementation gets caught by tests → Sonnet
- A wrong schema validation gets caught immediately → Haiku

## Escalate on signal, not on vibe

Move up a tier when:
- The same task failed twice at the current tier
- The output is being used as input to many downstream steps
- The action is irreversible or high-risk
- Evidence conflicts and needs adjudication

Move down when:
- The task is extraction, classification, or format validation
- The output is immediately checked by a deterministic gate
- It runs in a loop over many items

## Do not

- Use Opus for everything because it is best. That is not routing — it is the absence of it.
- Assign models by reputation instead of measured fit.
- Add a second provider before the first one works. Two half-configured providers are worse
  than one working one.
