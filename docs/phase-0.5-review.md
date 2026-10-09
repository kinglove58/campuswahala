# Phase 0.5 architecture and security review

Scope: focused hardening only. No Phase 1 product implementation or deployment. Review date: 9 October 2026.

## Decisions and corrections

- ADR 005: private BFF/API service trust with signed, versioned, body/route/session-bound context, timestamp/nonce checks and independent client/network/session quotas. Browser headers cannot define trusted context; nonlocal API refuses unsigned business requests. Exact health probes remain minimal. BFF accepts raw client IP only in an authenticated ingress assertion and sends a daily keyed pseudonym to the API. No persistent/raw-IP convenience store.
- ADR 006: programme-owned versioned structures, explicit stages/semesters/admission modes/activity tags; duration is independent. Current numeric guest level is a compatibility code, not arithmetic progression. Pack v2 exports typed referenced entities and per-entity source/status policies. Preview registration only accepts fixtures; general mixed-content schema is available for future controlled ingestion.
- ADR 007: bounded index-supported guest cleanup with one cutoff, maximum 5,000 rows/sweep, SKIP LOCKED concurrency, startup/15-minute local cadence, count/failure logging and shutdown draining. Active sessions remain untouched; expiry authorization is independent of worker availability. Worker config requires no session/service signing keys.
- CI uses immutable upstream action SHAs; npm/Actions/Docker update PRs remain enabled. Existing security scans/CodeQL/SBOM are preserved. NODE_IMAGE argument enables reviewed base digest selection; production promotion enforcement remains future work.
- Browser harness requires its own servers and uses marketing port 3100 after discovering an unrelated project on port 3000. No unrelated process was stopped. Visual captures are opt-in with CAPTURE_VISUALS=1 after a desktop trace identified screenshot capture exhausting the functional test budget; all journey/security assertions remain.

## Database changes

202610090002_explicit_stages is transactional. It drops the original level and multi-column duration arithmetic CHECKs, adds independent bounds (stage code 1..9999; personal duration 1..12) and the expiry/id index reflected in Prisma. No data rewrite/deletion or new academic tables. Migration failures found during development were corrected only on disposable databases; no persistent/user database was modified. Both migrations and two repository integration tests passed on disposable PostgreSQL 17; a separate transactional upgrade preserved a seeded Phase 0 guest. Apply via db:migrate, not application boot.

## Validation

Local results: lint/type checks and all 16 builds passed; 36 unit/API/security tests passed plus two PostgreSQL integration tests; eight desktop/mobile browser tests passed; Bicep CLI 0.48.1 compiled the skeleton; dependency audit reported no known vulnerabilities; non-root API image build/smoke passed. SQL upgrade separately preserved a seeded Phase 0 guest. Optional screenshots were removed from the default functional run after trace-based diagnosis; no journey/security assertion was removed. Final result details are maintained in IMPLEMENTATION_STATUS.md. Local checks are evidence for executable contracts only. Remote GitHub Actions, CodeQL upload, secret/container scan services, SBOM publication and Azure isolation were not executed/verified by this pass.

## Unresolved release risks

Public staging is blocked on a verified private ingress bridge, actual Front Door/WAF/private origin isolation, shared atomic replay/rate stores with outage behavior, private PostgreSQL/DNS and private Redis if selected, configured retention cadence/backlog alerts, approved image digest promotion and real OIDC before account tests. IPv6 churn/cookie resets/NAT false positives need edge policy and tuning. Key compromise/rotation and clock drift need staging drills. Account quotas use future server-verified subjects, not guest client cookies. Schema evidence references are not source-authenticity/manual-review enforcement. No real campus import is approved here.

Production additionally needs identity/MFA/least-privilege grants, load/attack/restore/incident evidence and independent security review. Bicep compiles as a foundation skeleton, never a production deployment. No Azure resources or real production secrets were created.

Phase 1 **local implementation may begin after review**, using the explicit contracts. Public staging/production are not safe yet. Phase 1 is not started automatically; stop here for review.

## Files changed

- [.env.example](../.env.example)
- [.github/dependabot.yml](../.github/dependabot.yml)
- [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- [Dockerfile.api](../Dockerfile.api)
- [Dockerfile.web](../Dockerfile.web)
- [IMPLEMENTATION_STATUS.md](../IMPLEMENTATION_STATUS.md)
- [README.md](../README.md)
- [apps/api/src/app.ts](../apps/api/src/app.ts)
- [apps/api/src/players.ts](../apps/api/src/players.ts)
- [apps/game/app/api/guest/route.ts](../apps/game/app/api/guest/route.ts)
- [apps/game/app/journey.tsx](../apps/game/app/journey.tsx)
- [apps/game/package.json](../apps/game/package.json)
- [apps/worker/package.json](../apps/worker/package.json)
- [apps/worker/src/cleanup.ts](../apps/worker/src/cleanup.ts)
- [apps/worker/src/main.ts](../apps/worker/src/main.ts)
- [docs/architecture.md](../docs/architecture.md)
- [docs/campus-pack-format.md](../docs/campus-pack-format.md)
- [docs/decisions/005-bff-trust-and-abuse.md](../docs/decisions/005-bff-trust-and-abuse.md)
- [docs/decisions/006-explicit-academics-and-content.md](../docs/decisions/006-explicit-academics-and-content.md)
- [docs/decisions/007-bounded-guest-retention.md](../docs/decisions/007-bounded-guest-retention.md)
- [docs/domain-model.md](../docs/domain-model.md)
- [docs/infrastructure.md](../docs/infrastructure.md)
- [docs/phase-0.5-review.md](../docs/phase-0.5-review.md)
- [docs/security-controls.md](../docs/security-controls.md)
- [docs/security.md](../docs/security.md)
- [docs/supply-chain.md](../docs/supply-chain.md)
- [docs/threat-model.md](../docs/threat-model.md)
- [infra/modules/README.md](../infra/modules/README.md)
- [packages/campus-content/campuses/futa/pack.json](../packages/campus-content/campuses/futa/pack.json)
- [packages/campus-content/campuses/oau/pack.json](../packages/campus-content/campuses/oau/pack.json)
- [packages/campus-content/campuses/unilag/pack.json](../packages/campus-content/campuses/unilag/pack.json)
- [packages/campus-content/src/index.ts](../packages/campus-content/src/index.ts)
- [packages/campus-content/src/schema.ts](../packages/campus-content/src/schema.ts)
- [packages/config/src/index.ts](../packages/config/src/index.ts)
- [packages/database/prisma/migrations/202610090002_explicit_stages/migration.sql](../packages/database/prisma/migrations/202610090002_explicit_stages/migration.sql)
- [packages/database/prisma/schema.prisma](../packages/database/prisma/schema.prisma)
- [packages/database/src/index.ts](../packages/database/src/index.ts)
- [packages/domain/src/index.ts](../packages/domain/src/index.ts)
- [packages/observability/src/index.ts](../packages/observability/src/index.ts)
- [packages/security/src/index.ts](../packages/security/src/index.ts)
- [packages/security/src/trust.ts](../packages/security/src/trust.ts)
- [playwright.config.ts](../playwright.config.ts)
- [pnpm-lock.yaml](../pnpm-lock.yaml)
- [scripts/start-web.mjs](../scripts/start-web.mjs)
- [tests/abuse.test.ts](../tests/abuse.test.ts)
- [tests/api.test.ts](../tests/api.test.ts)
- [tests/domain.test.ts](../tests/domain.test.ts)
- [tests/e2e/guest.spec.ts](../tests/e2e/guest.spec.ts)
- [tests/hardening.test.ts](../tests/hardening.test.ts)
- [tests/postgres.test.ts](../tests/postgres.test.ts)
