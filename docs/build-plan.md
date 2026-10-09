# Build plan

Phase 0 ships documents, five applications, shared boundaries, local API/health, environment validation, optional PostgreSQL repository and one executable guest journey. No real accounts, financial actions or reward mechanics. Security impact: new guest session/data boundary; migration impact: initial GuestPlayer table only. Tests: validation, expiry/ownership, HTTP contracts/abuse, database roundtrip when available, desktop/mobile guest flow and marketing isolation.

Next Phase 1: verify catalogue/provenance; normalize university/programme/level; real OIDC identity and guest conversion; durable character/profile/state; duration overrides/direct entry; privacy/age settings; data deletion; migration/ownership integration tests. Do not treat guest presets as production account onboarding.

Phases 2–10 follow brief: world/phone; academics; life/Wahala; social/viral; signing-out/memories; real-money; commerce; ads; scaling/hardening. Each ships a deployable vertical slice with schema migrations, loading/error states, security evidence and updated status. Real payments have explicit security/compliance gates.

Before changing code: inspect repository/docs, name bounded context, tests, security and migration impact. Major architecture changes need ADR. Done requires implementation, types/lint/tests, authorization/error/loading/mobile verification and updated docs. Financial work additionally requires duplicate webhook/idempotency/failure/audit tests. Status never marks future schema diagrams as implemented features.
