> **RC1.4 note:** This document records the RC1.3 execution-plane benchmark basis. RC1.4 now places that execution plane beneath the Sovereign Control-Plane Kernel; see `SOVEREIGN_CONTROL_PLANE_KERNEL.md`.

# MALACHII vs Manus — Parity and Beyond Research Brief

Research date: 2026-08-15
Scope: official Manus product/blog/help/documentation only.

## Verified Manus execution primitives

Current official Manus materials describe an autonomous general agent operating with a complete sandbox / virtual computer, internet access, persistent files, software installation and custom-tool creation. Additional current product primitives include:

- Cloud Browser / Browser Operator for navigation, clicking, authenticated workflows and multi-step web actions.
- Temporary sandbox plus persistent Cloud Computer for always-on applications, bots, scripts, installed tools and files.
- Desktop / My Computer for authorized local folders, CLI tools, applications and local hardware.
- Wide Research: parallel processing using many independent, general-purpose Manus instances.
- Branch: isolated parallel sessions inheriting a common context lineage.
- Plan Mode: explicit pre-execution feasibility/approach review and plan-as-source-of-truth.
- Projects + Project Skills: project-scoped context and curated/locked reusable capabilities.
- Project learning: propose durable instruction/file/skill updates from completed tasks, applied after approval.
- Connectors/integrations to external services.
- Website/app generation, deployment, slides/design and other finished artifacts.
- Auto-Publish: optionally deploy each successful accepted build.

## Primary official sources

- https://manus.im/docs/introduction/welcome
- https://manus.im/docs/features/cloud-browser
- https://manus.im/docs/features/browser-operator
- https://help.manus.im/en/articles/15392111-what-is-the-cloud-computer
- https://manus.im/docs/features/desktop
- https://manus.im/docs/features/wide-research
- https://manus.im/blog/manus-plan-mode
- https://manus.im/blog/manus-branch
- https://manus.im/blog/manus-project-skills
- https://manus.im/blog/manus-projects-self-updating
- https://manus.im/blog/manus-auto-publish

## What MALACHII should copy conceptually

Do not copy the product surface. Preserve the useful architectural pattern:

1. User states an objective, not a sequence of clicks.
2. Agent expands the objective into a plan.
3. Runtime supplies real compute/browser/files/tools.
4. Independent work can branch and run in parallel.
5. Durable project context and reusable skills reduce repeated setup.
6. The system produces finished artifacts rather than instructions alone.
7. External deployment and recurring operation can be first-class execution paths.

## What MALACHII must do differently

### 1. Capability truth before execution
Manus product capability is known inside its own environment. MALACHII is portable, so every host capability must be evidenced by Runtime Manifest assurance. A model, prompt, environment variable or tool description alone cannot silently grant execution rights.

### 2. Capability != authorization
A browser, shell, connector, deployment target or payment action may exist without being authorized for a requested scope. MALACHII performs policy checks and action-time revalidation.

### 3. Consequence-aware planning
Manus Plan Mode is manual. MALACHII's target is a consequence-aware Plan Gate: reversible/read-only tasks may auto-proceed; consequential external or high-uncertainty work requires review/approval.

### 4. Heterogeneous collective intelligence
Manus Wide Research uses parallel Manus instances. MALACHII's north star is provider-neutral: OpenAI, Anthropic, Gemini, local models, remote A2A agents and deterministic tools may be routed according to measured suitability and verified availability.

### 5. Evidence and adversarial verification
Parallel generation is not sufficient. MALACHII adds independent-first candidates, contradiction search, critic/verifier/arbiter roles, evidence packets and minimum-dimension Quality Floor gates.

### 6. Provenance and reality/trust
Instructions from tools, webpages, retrieved content and other agents remain typed by provenance and cannot self-elevate into policy. Capability evidence expires and can be revoked.

### 7. Confidence is evidence-derived
User preference may override execution strategy but must not rewrite historical epistemic confidence.

### 8. Ledgered execution
Execution decisions, capability evidence, approvals, actions, verification and release decisions should be recordable in the MALACHII event ledger with checkpoint anchoring.

### 9. Release gate stronger than build success
A successful build is not equivalent to a shippable artifact. External auto-publish requires the applicable quality threshold, hard gates, explicit publish authorization and a successful build.

### 10. Learning cannot expand authority
Project learning may accumulate reversible working memory automatically. Durable instructions, executable skills, policy or constitutional changes require stronger review. Learning never grants itself new authority.

## Parity matrix

| Manus primitive | MALACHII target primitive | Current RC1.3 reference status |
|---|---|---|
| Sandbox / VM | Execution Adapter + capability manifest | Contract implemented; real host adapter still required |
| Cloud Browser | Browser execution adapter | Contract target; host adapter required |
| My Computer | Local-computer adapter | Contract target; host-specific authorization required |
| Cloud Computer | Persistent workspace adapter | Contract target; backend required |
| Wide Research | Parallel execution waves + Council | Reference execution implemented; provider workers still adapters |
| Branch | Context Branch Graph | Reference implementation included |
| Plan Mode | Consequence-Aware Plan Gate | Reference implementation included |
| Project Skills | MALACHII Skills registry/trust | Already present |
| Project learning | Governed Learning Disposition | Reference implementation included |
| Connectors | MCP/native connector adapters | Host adapters required |
| Auto-Publish | Sovereign Release Gate + deploy adapter | Gate implemented; deploy adapter required |
| Schedules | Scheduler adapter | Host adapter required |
| Website/app/slides | Skills/artifact adapters | Skill 002 present; additional builders depend on host capability |

## Truth boundary

RC1.3 does **not** claim to contain a Manus-equivalent cloud VM, local browser extension, persistent cloud-compute service, or a fleet of provider-backed agents. It adds the portable execution-plane contracts and tested governance required to use such capabilities safely when a host exposes them.

The next real parity milestone is not another prompt. It is the first live Execution Adapter bundle: browser/search + filesystem/sandbox + deploy/workspace, followed by measured end-to-end objective execution.
