# Website Build Packet Contract

The machine-readable artifact is `website-build-packet.json`.

Required semantic sections:

- `objective`
- `executionState`
- `releaseStage`
- `site`
- `research`
- `artifacts`
- `verification`
- `quality`
- `limitations`

## Release-stage semantics

### BUILD_ARTIFACT
Source/build artifacts exist and deterministic structural validation passes. No deployed, field, complete accessibility, penetration-test, or conversion claims are implied.

### LAUNCH_CANDIDATE
Production build/preview and applicable local/browser tests pass. Remaining production/runtime checks are explicitly listed.

### PRODUCTION_VERIFIED
The deployed endpoint and all material claims have the runtime/field/manual/security evidence required by the objective. This state must not be emitted from source inspection alone.

### NOT_RELEASE_QUALIFIED
At least one hard gate fails or evidence is insufficient for the claimed stage.

## Quality gate

`quality.floor` must equal the minimum of the seven dimension scores. A promoted release requires every dimension >= 9.
