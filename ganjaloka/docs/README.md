# GANJALOKA — Spec Package

The complete build spec for GANJALOKA, the 21+ social world for cannabis
culture. It works as the blueprint for this codebase and as the hand-off package
for any engineer or coding model.

| # | Doc | Answers |
|---|---|---|
| 01 | [Product](01-product.md) | What it is, who it's for, the 3 things members do, what's out of scope |
| 02 | [Architecture](02-architecture.md) | Topology, stack and versions, request lifecycles, security model, scale path, costs |
| 03 | [Data model](03-data-model.md) | Tables, triggers, RLS, RPCs, indexes, error codes |
| 04 | [API contracts](04-api-contracts.md) | Every write action, its input and its errors; pagination |
| 05 | [Screens & flows](05-screens-and-flows.md) | Route map, states, post anatomy, user flows |
| 06 | [Trust, safety & compliance](06-trust-safety-compliance.md) | App Store / Play rules, 21+ gate, CSAM, DMCA, privacy, moderation SOP |
| 07 | [Video pipeline](07-video-pipeline.md) | Phase 2: Mux upload → webhook → HLS, data model, limits |
| 08 | [Mobile apps](08-mobile-app.md) | Phase 4: Expo stack, `/api/v1`, store checklist |
| 09 | [Roadmap](09-roadmap.md) | Phases with acceptance criteria |
| 10 | [Hand-off prompt](10-handoff-prompt.md) | Copy-paste prompt for ChatGPT or any coding model |
| 11 | [Design system](11-design-system.md) | "Night Tent" palette, type, the ripeness-trichome signature |

**Status (2026-10-19):** Phase 1 (the social core on web) is built and tested in
this repo. Phases 2–5 are specified.
