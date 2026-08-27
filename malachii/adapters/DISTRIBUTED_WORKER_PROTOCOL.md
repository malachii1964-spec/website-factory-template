# Distributed Worker Protocol — RC1.6

RC1.6 adds a dependency-free worker-daemon protocol for portable multi-process execution beneath the MALACHII Control Plane.

## Endpoints

- `GET /v1/descriptor` — signed worker descriptor.
- `POST /v1/challenge` — nonce challenge used to upgrade a declared worker to **A3_OBSERVED** only after a live cryptographic response.
- `GET /v1/health` — signed health/capability-revocation snapshot.
- `POST /v1/execute` — signed, bounded execution envelope with request ID, nonce, issue/expiry times and a specific `ExecutionStep`.

Successful execution returns a signed `malachii.worker.receipt.v1` bound to the worker, request, step, action and capability. Replay nonces are rejected at the worker boundary. Remote capability revocation is propagated into the Control Plane on signed heartbeat refresh.

## Portable authentication truth boundary

The portable reference uses an HMAC shared secret so the ZIP remains dependency-free and can demonstrate authenticated process-to-process execution. This proves **observed identity**, not hardware/root-of-trust attestation. It MUST NOT be described as SPIFFE/SPIRE or A4-attested identity.

Production deployments should replace the HMAC bootstrap with workload identity such as mTLS/X.509-SVID or another attested mechanism appropriate to the deployment environment. Capability still does not equal authorization.

## Durable execution

Every remote dispatch is first placed into a durable queue and leased to the selected worker. Only the lease owner may complete/fail that job. Worker loss leaves an auditable failed lease/job and the Control Plane may reconcile the objective onto another eligible resource.
