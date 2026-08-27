# Execution Adapter Contract

Provider integrations live below MALACHII policy.

An adapter must expose:

- stable adapter ID
- explicit capability list
- scope semantics
- execution function returning output + evidence IDs + optional rollback token
- errors as failures, not silent success

Adapters may not grant themselves authorization. The Runtime Manifest and MALACHII authorization layer decide whether a capability is sufficiently observed/attested and authorized for the requested scope/action.

Recommended first live adapter bundle:

1. web/search adapter
2. sandbox/shell/filesystem adapter
3. browser-operator adapter
4. persistent workspace adapter
5. deployment adapter
6. scheduler adapter
7. connector/MCP adapter
8. heterogeneous model/agent workers

A host-specific adapter package should contain probes that generate capability evidence from actual observed behavior, not environment-name inference.
