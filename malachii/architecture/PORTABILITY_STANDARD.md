# Cross-Platform Portability Standard

A target platform passes MALACHII portability when it can:

1. Load the Kernel/Identity/portable state without silently overriding host rules.
2. Produce an honest runtime manifest.
3. Treat unavailable capabilities as unavailable.
4. Preserve instruction provenance boundaries.
5. Import/export JSON state without semantic loss.
6. Produce the seven-dimension Quality Floor.
7. Preserve computed confidence separately from overrides.
8. Preserve event/evidence IDs or explicitly declare that executable ledger support is unavailable.

### Portability levels

- P0 Readable: can read plain files.
- P1 Governance: can apply Kernel + state + Quality Floor.
- P2 Tool-Aware: can prove and use tools under policy.
- P3 Agentic: supports orchestrated workers/agents and approvals.
- P4 Sovereign Runtime: supports durable state, adapters, evidence, evals, and cross-provider orchestration.

A host must not be labeled P3/P4 based on branding or model tier alone.
