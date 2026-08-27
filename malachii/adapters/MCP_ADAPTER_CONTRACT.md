# MCP Adapter Contract — RC1.5

Status: **2026-07-28 HTTP REFERENCE TRANSPORT IMPLEMENTED; REMOTE THIRD-PARTY INTEROP NOT YET VERIFIED**

MALACHII treats MCP-exposed tools/data as governed resources beneath the Control Plane. `runtime/src/protocolAdapters.ts` implements stateless MCP 2026-07-28 HTTP calls including protocol/routing headers and `tools/list` / `tools/call`.

Required behavior:
- discover tools/resources without converting discovery into authorization
- map capabilities/scopes into governed resources
- preserve tool-output provenance
- invoke only after MALACHII routing/policy approval
- return structured output plus evidence identifiers
- fail closed when capability, scope, identity or data policy no longer validates

The HTTP wire contract is exercised against a real local loopback server. RC1.5 does **not** claim successful interoperability with an external MCP deployment or production authorization infrastructure.
