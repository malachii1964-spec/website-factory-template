# Provider / Runtime Adapters — RC1.5

The core intentionally contains no provider credentials or mandatory SDK dependency.

## Implemented reference adapters

- governed HTTP GET/HEAD/POST
- rooted local filesystem read/list/stat/hash/write/mkdir
- allowlisted argv command/code execution (`shell:false`)
- local-only Chromium HTML snapshot boundary
- MCP 2026-07-28 HTTP (`tools/list`, `tools/call`)
- A2A 1.0 HTTP/JSON Agent Card discovery + `message:send`
- OpenAI Responses HTTP
- Anthropic Messages HTTP
- Gemini `generateContent` HTTP

Provider secrets are resolved at runtime through a `SecretProvider`; adapter outputs/evidence do not intentionally persist them.

## Assurance rule

A provider/Agent Card/tool catalog may declare capability, but a declaration does not become executable assurance. MALACHII requires observed or attested evidence for execution routing and still applies objective scope, data scope, budget, identity and action-time authorization.

## Current verification scope

HTTP/protocol/provider wire behavior is exercised against real local loopback servers. External credentialed services were not reachable/verified in this host. Chromium integration also remains unverified in this host.

A production adapter should additionally provide:
1. authenticated discovery
2. capability probes
3. model/tool enumeration only where actually exposed
4. usage/cost/latency telemetry
5. session/checkpoint support when available
6. provenance mapping
7. explicit data residency/sensitivity controls
8. revocation/health signals
