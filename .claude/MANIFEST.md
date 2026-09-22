# MALACHII Website Factory OS — Capability Manifest
Last updated: 2026-09-22

This is the single source of truth for every skill, pack, hook, and enforcement mechanism
in this factory. If a capability exists, it's here. If it's not here, it doesn't exist.

---

## Skills (invoke with `/skill-name` or via the Skill tool)

### Quality & Verification

| Skill | Purpose | Trigger |
|---|---|---|
| `factory-gates` | G0–G8 completion gate before any "done" claim | "done", "finished", "ready to ship" |
| `challenger` | Adversarial 7-dimension feature review; Ship/Don't Ship verdict | After every feature ships |
| `red-team` | Full-site adversarial simulation — security, claims, a11y, perf, legal, ops | Before major launches; quarterly |
| `malachii-sovereign-website-factory` | Sovereign-grade website quality: accessibility, performance/SEO, security standards | Before any page ships |
| `code-review` | Diff/PR review for correctness bugs | On PRs or suspicious diffs |
| `simplify` | Code cleanup — reuse, simplification, efficiency | After any feature |
| `security-review` | Security-focused code review | Before any auth/payment/data feature ships |
| `security-secrets` | Secrets management and credential hygiene | Whenever secrets are mentioned |

### Research & Intelligence

| Skill | Purpose | Trigger |
|---|---|---|
| `sovereign-research` | Evidence-first research with Claim Ledger, contradiction pass, freshness pass | "research", "verify", "fact-check", "compare" |
| `visual-dna` | Decompose reference sites into design tokens; produce portable VisualDNA | Before designing from a reference |

### Design & UX

| Skill | Purpose | Trigger |
|---|---|---|
| `design-critic` | Review rendered page against 12 machine-design tells; requires real screenshots | After every UI page ships |
| `dataviz` | Chart/graph/dashboard design — form heuristic, color formula, mark specs | Any chart, graph, plot, or dashboard |
| `artifact-design` | Design guidance for Claude Artifacts | Before writing any Artifact |
| `artifact-diagramming` | Diagramming guidance for Artifacts | Before any diagram in an Artifact |
| `artifact-capabilities` | Runtime capability roster for Artifacts | Before adding live data/storage to Artifact |

### Session & Memory

| Skill | Purpose | Trigger |
|---|---|---|
| `handoff` | Write HANDOFF.md before ending session; session continuity protocol | "I'll be back", "end session", "save state" |
| `memory-consolidation` | Prune CLAUDE.md Project Log; archive completed milestones | Project Log > 60 lines |
| `context-rot-scan` | Find duplicate rules, contradictions, stale references across OS files | Start of new session on old repo; before adding rules |
| `autonomy-gating` | Classify every external action A0–A5 before execution | Any push/deploy/email/DNS/DB action |

### Operations & Launch

| Skill | Purpose | Trigger |
|---|---|---|
| `launch-sequence` | Complete go-live protocol for the factory stack (Vercel + Neon + Cloudflare + Resend) | Before any production launch |
| `systematic-debugging` | Root-cause-first debugging; find-polluter bisection for test pollution | Any `FIX`-type task |
| `review-reception` | Receive code review feedback correctly; prevents sycophantic agreement | On any PR review comments |

### Configuration & Meta

| Skill | Purpose | Trigger |
|---|---|---|
| `model-router` | Choose the right model for cost/quality balance | Multi-step builds, subagent spawning |
| `update-config` | Configure settings.json hooks, permissions, env vars | "from now on", "whenever", "always" |
| `keybindings-help` | Customize keyboard shortcuts | Rebind/add keybindings |
| `fewer-permission-prompts` | Add allowlist to reduce permission prompts | Too many permission interruptions |
| `loop` | Recurring task runner | "check every X minutes", "keep running" |
| `run` | Launch the app and confirm a change works in real browser | "does this work?", "show me" |
| `init` | Initialize CLAUDE.md for a new codebase | Starting a new project |

### Anthropic Core

| Skill | Purpose |
|---|---|
| `anthropic-skills:skill-creator` | Create a new skill from scratch with proper structure |
| `anthropic-skills:morning` | Morning briefing / session start context |
| `anthropic-skills:import-memory` | Import memory from previous sessions |
| `anthropic-skills:docs` / `docx` / `pdf` / `pptx` / `xlsx` | Document type handlers |
| `claude-api` | Claude API / Anthropic SDK reference |

---

## Capability Packs (reference material, not invocable directly)

Located in `.claude/packs/`. Load the relevant pack when that domain is in scope.

| Pack | When to load |
|---|---|
| `CANNABIS_COMPLIANCE.md` | Any content, claim, or commerce on a cannabis site |
| `COMMERCE.md` | Payment flows, checkout, product listings |
| `AI_FEATURES.md` | RAG, AI chat, LLM-powered features |
| `IMMERSIVE_3D.md` | WebGPU/Three.js/R3F work |
| `PACK_CATALOG.md` | Full index of all available packs |

Additional packs available in `MALACHII Website Factory OS v1.0`:
- `ADAPTIVE_UX.md`
- `CONTENT_OPERATIONS.md`
- `DOMAIN_DNS_EMAIL_DEPLOYMENT.md`
- `MAPS_LOGISTICS.md`
- `REMOTE_RENDERING.md`

---

## Hooks (enforced by Claude Code harness, not by memory)

Configured in `.claude/settings.json`.

| Hook | Trigger | Action |
|---|---|---|
| `SessionStart` | Session opens | `session-start.sh` — reports branch, commit, stage, dirty count |
| `PostToolUse` | Write or Edit on .ts/.tsx/.js/.jsx/.css/.json | `prettier --write` auto-format |
| `Stop` | Session attempts to end | `quality-gate.sh` — runs tsc + lint + tests; blocks if any fail |

---

## CI/CD (enforced by GitHub, outside the AI)

`.github/workflows/quality-gates.yml` — runs on every push to main and every PR.

Steps: checkout → setup Node 22 → npm ci → tsc --noEmit → lint → test --run → build

Skips if no `package.json` (template-only repos).

---

## Templates

| Template | Purpose |
|---|---|
| `templates/INDEX.md` | Template menu — always Question 1 in the interview |
| `templates/PROJECT_STATE.md` | Per-project state file to copy into new sites |
| `templates/CLAIMS_LEDGER.md` | Truth protocol tracking for publishable claims |
| `templates/ASSET_LICENSE_LEDGER.md` | Third-party asset tracking |

---

## Design System

| File | Purpose |
|---|---|
| `design.md` | Law — Part 1 (owner taste) + Part 2 (universal rules) |
| `performance.md` | Law — LCP/CLS/INP budgets, per-route JS, image/font limits |
| `design-library/styles.md` | Named style directions to offer |
| `design-library/palettes.md` | Palette system adapted to subject |
| `design-library/immersive-3d.md` | 3D design contract |
| `design-library/webgpu-tsl.md` | WebGPU/TSL technique reference, render tier map |

---

## Manus Parity Status

| Domain | Status |
|---|---|
| Website building (Next.js, full-stack) | **SUPERIOR** — 335+ pages, 153 guides, 150 strains, shop, AI chat, grow journals, deployed |
| Research & fact-checking | **SUPERIOR** — sovereign-research with Claim Ledger, contradiction pass, live_research mode |
| Quality gates | **SUPERIOR** — 7-dimension floor, challenger, red-team, factory-gates, Stop hook CI |
| Design | **SUPERIOR** — visual-dna, design-critic, design system, 3D/WebGPU, immersive |
| Security | **SUPERIOR** — threat model, truth protocol, claims integrity, cannabis compliance |
| Persistent memory | **PARITY** — CLAUDE.md + PROJECT_STATE.md + HANDOFF.md + CLAUDE_HISTORY.md |
| Browser automation | **PARTIAL** — WebSearch/WebFetch available; full computer use not available in Claude Code |
| Realtime/websockets | **PARTIAL** — not yet needed; Inngest available |
| 24/7 autonomous operation | **PARITY** — Claude Code Remotes + Routines |
| Multi-agent coordination | **PARITY** — subagent spawning gate + parallel builds |

---

## Skill gaps (not yet built)

These are documented for the next build sprint:

- `competitor-intel` — structured competitive gap analysis with Claim Ledger
- `architecture-review` — formal architecture decision record before complex builds
- `incident-response` — production triage protocol
- `domain-dns-cutover` — standalone DNS cutover skill (currently in launch-sequence)
- `accessibility-audit` — deep WCAG 2.2 AA per-route scan
- `performance-audit` — LCP/bundle/INP diagnosis with prioritized fix list
- `claims-audit` — walk every page for Truth Protocol violations
