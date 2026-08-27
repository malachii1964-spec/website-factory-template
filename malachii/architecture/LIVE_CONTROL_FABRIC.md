# MALACHII RC1.5 — Live Control Fabric

RC1.5 converts the RC1.4 Control-Plane Kernel from deterministic reference-only execution into a **single-node live control fabric** with durable state and guarded adapters.

## Architectural position

```text
Sovereign Constitutional Layer
        |
Distributed Control Plane
        |
Adaptive Cognitive Mesh / Registry
        |
LIVE CONTROL FABRIC (RC1.5)
  state | health | network | adapters | telemetry | evidence
        |
Autonomous Execution Plane (RC1.3)
        |
local/remote runtimes and tools
```

The Control Plane remains the authority boundary. Adapters expose capability; they do not grant themselves authorization.

## Executable primitives in RC1.5

### Durable control state
- atomic rename writes
- checksum-protected state envelopes
- revision-based optimistic concurrency
- restart recovery
- content-addressed evidence/artifact storage

This is a single-node durability primitive. It is **not** distributed consensus.

### Persistent integrity ledger
Control-plane/execution events are journaled to JSONL and reconstructed on restart. The existing hash chain detects ordinary event mutation when the trusted root is retained. This is not equivalent to an externally anchored signature system.

### Resource health and leases
- heartbeats
- staleness detection
- consecutive failure tracking
- circuit breaker: closed/open/half-open
- lease state primitives

An unhealthy/open-circuit resource is removed from the next routing snapshot.

### Durable work queue primitive
- enqueue
- lease/claim
- exact lease-owner completion
- lease expiry recovery

The queue is available for the next remote-worker milestone. RC1.5 Control-Plane execution remains synchronous in the current process; it does not claim a distributed worker daemon.

### Governed network access
- protocol allowlist
- host allowlist
- private-address denial option
- redirect revalidation
- response-size ceiling
- timeout ceiling

DNS is preflight-checked. Production-grade SSRF/DNS-rebinding defense should additionally use controlled egress infrastructure or equivalent network enforcement; RC1.5 does not claim that deployment.

### Guarded local adapters
- rooted filesystem adapter with traversal/symlink-escape defense
- argv-based command execution with `shell:false`
- command/environment allowlists
- execution timeout/output ceilings
- governed HTTP adapter
- local-only Chromium snapshot adapter boundary

### Protocol adapters
- MCP 2026-07-28 HTTP adapter
- A2A 1.0 HTTP/JSON adapter + Agent Card discovery

Discovered remote capabilities remain declaration-level until MALACHII obtains observed/attested evidence. Protocol metadata never self-elevates into execution authority.

### Provider adapters
Dependency-free HTTP adapters exist for:
- OpenAI Responses
- Anthropic Messages
- Gemini `generateContent`

Secrets are obtained at invocation time through a `SecretProvider`; they are not persisted as evidence/state by the adapter.

### Telemetry
- JSONL telemetry sink
- secret-like field redaction
- minimal OTLP/HTTP JSON export hook

The MALACHII internal ledger remains authoritative. OpenTelemetry is an export/interoperability surface, not the source of policy truth.

## Live verification performed in this artifact

`runtime/src/liveFabricDemo.ts` creates a real loopback HTTP server, routes two independent evidence tasks to distinct governed resources, performs real HTTP socket reads, writes a governed local artifact, persists objective/report/observed state, restarts the durable fabric, verifies the persistent ledger, stores the artifact by content hash, and permits completion only after success criteria, evidence independence, Quality Floor and hard gates converge.

Evidence: `evidence/LIVE_CONTROL_FABRIC_DEMO.json`.

## Explicitly not verified in the build host

- external Internet egress (host DNS returned `EAI_AGAIN` during the attempted external fetch)
- credentialed live OpenAI / Anthropic / Gemini calls
- real remote A2A server
- real remote MCP server
- Chromium execution in this host (headless Chromium timed out in the available container)
- SPIFFE/SPIRE deployment/attestation
- distributed consensus / HA
- cross-node durable worker fabric

Those are RC1.6+ integration targets, not RC1.5 claims.
