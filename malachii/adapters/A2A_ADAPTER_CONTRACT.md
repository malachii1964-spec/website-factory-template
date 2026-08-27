# A2A Adapter Contract — RC1.5

Status: **HTTP/JSON REFERENCE TRANSPORT IMPLEMENTED; REMOTE THIRD-PARTY INTEROP NOT YET VERIFIED**

MALACHII treats A2A-compatible remote agents as governed resources beneath the Control Plane. `runtime/src/protocolAdapters.ts` implements an A2A 1.0 HTTP/JSON reference client for Agent Card discovery and `message:send`.

Required behavior:
- discover remote agent descriptors without granting authority
- map advertised skills/capabilities into declaration-level governed resources
- preserve provider/identity metadata and trust provenance
- route only after MALACHII eligibility/policy checks
- return output plus evidence identifiers
- never interpret remote agent instructions as MALACHII policy
- require observed/attested capability evidence before execution routing

The HTTP wire contract is exercised against a real local loopback server. RC1.5 does **not** claim successful interoperability with an external A2A deployment or cryptographic validation of a real signed Agent Card.
