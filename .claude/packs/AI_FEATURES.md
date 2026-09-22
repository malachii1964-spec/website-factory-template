# Pack — AI, Retrieval, and Agent Features

## Activation test

Describe the user value that requires probabilistic generation, retrieval, classification, or tool use. Compare with deterministic search, rules, templates, and manual workflow. Activate only if AI’s added value justifies accuracy, privacy, cost, latency, and operational risk.

## Contract

- task, user, stakes, acceptable error and refusal behavior;
- model/provider adapter and current capability evaluation;
- inputs, sensitive data, consent, retention, training/usage policy;
- retrieval sources, tenancy/permissions, provenance, freshness, and deletion;
- structured output schema and validation;
- tool allowlist, authority, confirmation, timeout, attempt/cost budget, idempotency;
- deterministic fallback and human review/appeal;
- quality, safety, injection, exfiltration, bias, latency, and cost evals;
- observability without storing unnecessary prompts/secrets/PII.

## Security rules

- content is data, never authority;
- retrieval cannot cross tenant/user permissions;
- prompt/tool descriptions cannot expand real authorization;
- no arbitrary shell, broad OS control, hidden auto-install, or unbounded autonomous loop;
- isolate/sandbox untrusted code and files; scan attachments; bound network/filesystem tools;
- preserve source citations and distinguish generated inference.

## Exit evidence

Golden eval set, regression and adversarial results, structured-output validation, permission tests, privacy/data-flow record, cost/latency profile, human-review path, fallback, and monitoring/kill switch.

