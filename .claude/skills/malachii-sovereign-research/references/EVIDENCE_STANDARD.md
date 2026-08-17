# Evidence Standard

## Claim statuses

- `verified`: strong evidence satisfies the claim's required assurance.
- `supported`: credible evidence supports the claim but assurance is below `verified`.
- `disputed`: credible evidence materially conflicts and resolution is incomplete.
- `inference`: conclusion follows from evidence but is not directly stated by sources.
- `unverified`: insufficient evidence.

## Default verification rule

A claim may be `verified` when at least one of these is true:

1. A directly relevant authoritative primary source establishes it and the claim is within that source's authority; or
2. At least two independent credible non-user sources converge, with no unresolved stronger contradiction.

For consequential contested claims, prefer both primary evidence and independent corroboration.

## Critical claims

A `critical` claim can change the final decision. Critical claims may not remain `unverified` in a release-qualified packet.

A critical `disputed` claim may only ship if the dispute itself is central to the answer, explicitly surfaced, and the recommendation is robust to the unresolved uncertainty.

## Inference rule

Inference requires:

- cited supporting evidence
- explicit `inference` status
- explanation of the reasoning bridge
- no wording that falsely attributes the inference to a source

## Negative evidence

Absence of evidence is not evidence of absence unless the search space/source makes that inference justified. State the limitation.

## Confidence

Confidence is derived from evidence quality, coverage, agreement, freshness, and scope match. It is not user-editable historical truth. An execution override may change what MALACHII does next, but not rewrite derived confidence.
