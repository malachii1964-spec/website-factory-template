# MALACHII Command Center — Product Blueprint

## Primary experience

Simple Mode presents one core control:

> What do you want to accomplish?

The system then shows only consequential status: execution mode, trust/runtime health, approvals, quality result, and final output.

Command Center Mode exposes:

- Objective / Objective Lock
- Runtime capability matrix with evidence and freshness
- Intelligence pool and registry scores
- Council graph and worker states
- Tool/API permissions and approval gates
- Evidence ledger
- Quality matrix / hard gates
- Cost, latency, token/tool use
- Execution trace and checkpoints
- Portable export

## Council states

`queued → working → completed | disagreement | failed | retry | escalated`

## UX invariant

The UI must not display aspirational quality values as fact. Every score, capability, model assignment, and approval state must be backed by current runtime state/evidence.
