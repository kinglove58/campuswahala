# Observability

Structured JSON logs: timestamp, level, service, requestId, method, endpoint, status, latency; future correlation/user/payment/order identifiers only when justified. Allowlist fields and redact credential-shaped keys; never dump bodies/errors/tokens into client or logs. Unknown failures return INTERNAL_ERROR and requestId, no stack.

Liveness checks process, readiness checks selected repository connectivity. Do not return database errors or connection strings. Worker heartbeat is a local scaffold, not a queue consumer. Use OpenTelemetry/Application Insights adapter when deployed; traces propagate correlation through outbox/worker with redaction.

Dashboards planned: request rate/errors/p95 latency, DB saturation/query latency, queue depth/DLQ age, cache availability, login failure rates, webhook/payment failures, WAF/bot blocks, leaderboard anomalies. Alerts planned: readiness failure >2 min, 5xx >2% over 5 min, p95 >1 sec over 10 min, DLQ >0, webhook failure >1%, ledger mismatch any. Thresholds require load baseline and paging ownership.

Runbook: locate requestId → inspect redacted trace → classify identity/state/dependency → rollback immutable revision or pause affected provider → reconcile side effects → record incident. Restrict log RBAC, define personal-data retention and alert escalation before production. No cloud telemetry/alerts have been provisioned.

## Phase 1 implemented boundary

Phase 1 intelligence counters record source/fetch/failure/extraction/candidate/auto-publication/held/rejected/stale/contradiction signals; feedback rows support aggregate counts. Source failures persist sanitized codes/times and backoff. Never log bodies, OAuth/guest/account capabilities, identity subjects, age bands or suggestion text. Alert configuration/export and backlog/deletion/staleness SLO evidence remain deployment gates.
