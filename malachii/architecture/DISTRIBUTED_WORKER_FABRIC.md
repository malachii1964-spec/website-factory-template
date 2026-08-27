# MALACHII RC1.6 — Distributed Worker Fabric

RC1.6 is the first executable step from a single-process/single-node control fabric toward the target Distributed Multi-Agent Control Plane (DMACP) architecture.

## Architectural position

```text
Sovereign Constitutional Layer
        |
Distributed Multi-Agent Control Plane
        |
Adaptive Cognitive Mesh
        |
DISTRIBUTED WORKER FABRIC (RC1.6)
 discovery | identity observation | durable leases | remote receipts | health/failover
        |
Live Control Fabric (RC1.5)
        |
Autonomous Execution Plane (RC1.3)
        |
worker processes / remote adapters / tools
```

## New executable behavior

1. **Remote worker daemon** with signed descriptor, challenge, health and execution endpoints.
2. **Observed worker identity**: a remote worker is not executable merely because it advertises a capability. MALACHII performs a nonce challenge and only then registers the overlapping challenged capability set as `A3_OBSERVED`.
3. **Signed execution receipts** bound to worker/request/step/action/capability plus a content hash.
4. **Replay defense** through expiring nonces on worker execution requests.
5. **Durable queued dispatch**: remote work is enqueued, leased to the selected worker, then completed/failed only by that lease owner.
6. **Dynamic routing snapshots per reconciliation round**. Health changes are re-read before each round rather than freezing the first routing registry for the entire objective.
7. **Circuit failover**: a worker failure can open its circuit and a repair round can route the same capability to the next eligible worker.
8. **Signed heartbeat capability drift**: revoked remote capabilities are removed from the persisted Control-Plane resource descriptor before future routing.
9. **Multi-process proof**: the reference demo launches two independent Node worker processes, observes both over authenticated loopback HTTP, terminates the preferred worker, records the failed durable job, refreshes routing, and converges through the surviving worker.

## What RC1.6 proves

RC1.6 proves portable **multi-process worker-dispatch and failover semantics** under a single Control-Plane process. It demonstrates that worker loss does not equal objective failure when an eligible alternate worker exists, and that the Control Plane does not mark completion until reconciliation converges.

## What RC1.6 does NOT prove

- multi-host/high-availability deployment
- distributed consensus or a replicated state backend
- Internet-scale networking
- SPIFFE/SPIRE attestation or mTLS deployment
- external credentialed OpenAI/Anthropic/Gemini worker execution
- external A2A/MCP interoperability certification
- production browser worker
- production egress proxy/SSRF enforcement
- Agent Foundry or autonomous privilege creation

Those remain explicit future integration/benchmark targets.

## Architectural invariant

**Adaptive below. Constitutional above.** Workers may disappear, fail, be replaced or have capabilities revoked. None of those events permits a worker to expand its own authority, weaken release gates or rewrite the constitutional layer.
