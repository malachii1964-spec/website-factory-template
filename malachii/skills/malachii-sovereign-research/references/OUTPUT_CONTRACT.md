# Research Packet Output Contract

Required top-level fields:

- `schema_version`
- `skill`
- `objective`
- `research_mode`
- `generated_at`
- `sources`
- `claims`
- `contradictions`
- `limitations`
- `deliverable`
- `quality`

## Objective

Must contain:

- `raw`
- `normalized`
- `freshness_required`
- `success_criteria[]`

## Sources

Each source must have a unique `id`, `title`, `source_class`, `authority`, and `accessed_at`.

Optional: `url`, `publisher`, `published_at`, `notes`, `lineage_id`.

## Claims

Each claim must include:

- unique `id`
- `claim`
- `importance`
- `status`
- `evidence[]` containing source IDs
- `rationale`

## Contradictions

Each contradiction names a `claim_id`, the conflicting `source_ids`, `resolution`, and `explanation`.

## Quality

All seven MALACHII dimensions are required. `floor` must equal their minimum.

`ship_decision = ship` is valid only when:

- floor >= 9
- no critical claim is unverified
- no unresolved critical contradiction is hidden
- if `freshness_required = true`, `research_mode` is `live_research`
