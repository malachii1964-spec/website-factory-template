# Web Security Standard

## Verification baseline

Use OWASP ASVS 5.0.0 as the verification-oriented baseline, scaled to the application's risk and features.

Primary source: https://owasp.org/www-project-application-security-verification-standard/

OWASP itself recommends ASVS when a verifiable application-security standard is needed; the OWASP Top 10 is an awareness document and should not be presented as comprehensive coverage.

Current awareness baseline: OWASP Top 10:2025
https://owasp.org/Top10/

## Minimum engineering concerns where applicable

- access control enforced server-side
- secure defaults/configuration
- dependency and supply-chain integrity
- modern cryptography and secure secret storage
- context-appropriate encoding and injection resistance
- robust authentication/session management
- input validation and safe file handling
- integrity of code/data/update paths
- security logging/alerting appropriate to risk
- safe exceptional/failure handling
- TLS for sensitive/public authenticated traffic
- security headers appropriate to the architecture (for example CSP, HSTS, frame protections as relevant)
- least privilege for services and credentials

## Claim boundary

A generated code review or static scanner result cannot establish full ASVS conformance. Production security certification requires test evidence appropriate to the relevant ASVS requirements and deployed architecture.
