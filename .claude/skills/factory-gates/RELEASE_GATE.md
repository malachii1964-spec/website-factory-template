# Release Gate

## Required decision record

| Area | Evidence | Result | Owner / exception |
|---|---|---|---|
| Contract and critical journeys |  |  |  |
| Build/type/lint/tests |  |  |  |
| Database/migrations/authz |  |  |  |
| Accessibility |  |  |  |
| Performance and optional tiers |  |  |  |
| Security/privacy/dependencies |  |  |  |
| Claims/content/assets |  |  |  |
| SEO/metadata/links |  |  |  |
| Preview/staging smoke |  |  |  |
| Backup/restore/rollback |  |  |  |
| Monitoring/alerts/support |  |  |  |
| Production authority |  |  |  |

## Severity rule

- **Blocker/Critical:** cannot release.
- **High:** release only with explicit risk owner, time-bounded exception, compensating control, and no impact on essential safety/data/access.
- **Medium/Low:** record owner and target; confirm no combined critical path.

## Go/no-go

```yaml
revision:
target:
decision: GO | NO_GO | CONDITIONAL
authority_evidence:
open_risks:
exceptions:
rollback:
monitoring_window:
decision_owner:
date:
```

## Post-release

Verify exact revision/target, critical journey smoke, migrations/data, errors, field performance instrumentation, analytics consent, and high-risk external integration. If rollback criteria trigger, execute the approved recovery rather than improvising.

