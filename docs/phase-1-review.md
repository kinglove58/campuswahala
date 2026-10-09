# Phase 1 architectural review

9 October 2026. Local Phase 1 foundations and validation are complete for review. Phase 0/0.5 controls and guest-world behavior are preserved. No Phase 2 feature, real-money flow, rewards, grades, scoring, advertising, marketplace, unrestricted chat, Azure resource, paid service or tenant has been created. No commit or push is performed.

## 1. Exact files changed

The inventory below is generated from tracked modifications plus untracked nonignored files relative to the starting clean checkout. Build output, test logs, temporary database credentials, fetched raw text and scanner artifacts are excluded by existing ignore rules. The inventory includes this review and the implementation status.

Modified tracked files (43):

- `.env.example`
- `.github/workflows/ci.yml`
- `Dockerfile.api`
- `Dockerfile.web`
- `IMPLEMENTATION_STATUS.md`
- `README.md`
- `apps/admin/app/page.tsx`
- `apps/api/src/app.ts`
- `apps/api/src/main.ts`
- `apps/game/app/api/guest/route.ts`
- `apps/game/app/journey.tsx`
- `apps/game/app/world.tsx`
- `apps/marketing/app/sitemap.ts`
- `apps/marketing/app/universities/[campus]/page.tsx`
- `apps/marketing/app/universities/page.tsx`
- `apps/marketing/package.json`
- `apps/worker/package.json`
- `apps/worker/src/main.ts`
- `docs/architecture.md`
- `docs/campus-pack-format.md`
- `docs/decisions/006-explicit-academics-and-content.md`
- `docs/decisions/007-bounded-guest-retention.md`
- `docs/domain-model.md`
- `docs/infrastructure.md`
- `docs/observability.md`
- `docs/security-controls.md`
- `docs/security.md`
- `docs/seo.md`
- `docs/supply-chain.md`
- `docs/threat-model.md`
- `package.json`
- `packages/auth/package.json`
- `packages/auth/src/index.ts`
- `packages/auth/tsconfig.json`
- `packages/campus-content/src/index.ts`
- `packages/config/src/index.ts`
- `packages/database/prisma/schema.prisma`
- `packages/database/src/index.ts`
- `packages/domain/src/index.ts`
- `playwright.config.ts`
- `pnpm-lock.yaml`
- `tests/container-smoke.mjs`
- `tests/e2e/guest.spec.ts`

New files (34):

- `apps/api/src/accounts.ts`
- `apps/game/app/account-panel.tsx`
- `apps/game/app/api/account/[action]/route.ts`
- `apps/game/app/api/feedback/route.ts`
- `apps/game/app/api/forward.ts`
- `apps/game/app/api/guide/route.ts`
- `apps/marketing/app/guide/[campus]/page.tsx`
- `apps/marketing/app/published.ts`
- `apps/worker/src/deletion.ts`
- `apps/worker/src/intelligence.ts`
- `apps/worker/src/safe-fetch.ts`
- `docs/campus-intelligence.md`
- `docs/ci-triage-phase-1.md`
- `docs/decisions/008-private-identity-and-conversion.md`
- `docs/decisions/009-automatic-campus-publication.md`
- `docs/identity.md`
- `docs/initial-campus-research.md`
- `docs/phase-1-review.md`
- `docs/privacy.md`
- `docs/publication-policy.md`
- `docs/research/2026-10-09-initial-results.json`
- `packages/auth/src/identity.ts`
- `packages/campus-content/src/publication.ts`
- `packages/database/prisma/migrations/202610090003_phase_1/migration.sql`
- `packages/database/prisma/migrations/202610090004_fact_expiry_and_position_guards/migration.sql`
- `scripts/research.mjs`
- `tests/accounts-postgres.test.ts`
- `tests/e2e/account.spec.ts`
- `tests/identity.test.ts`
- `tests/ingestion-security.test.ts`
- `tests/intelligence-postgres.test.ts`
- `tests/migration-upgrade.test.ts`
- `tests/publication.test.ts`
- `tests/web-container-smoke.mjs`

## 2. Migrations added

- `202610090003_phase_1`: additive transactional identity/profile/privacy/session/login/deletion/character/conversion schema; UUID catalogue, places, source observations, bounded evidence, facts/versions/feedback/decisions and reversible merge-history structure. Existing guests are untouched. Normalized demo structures/stages/semesters preserve every prior fixture choice, including sixth-stage engineering; they are marked fixture. No published fact is seeded.
- `202610090004_fact_expiry_and_position_guards`: transactional explicit fact/event expiry and source failure metadata; PostgreSQL triggers verify character campus, programme ancestry, structure/version, explicit stage/entry mode and optional semester consistency. No duration or level arithmetic.

The actual upgrade test deploys original migrations 001/002 into an owned isolated schema, inserts a Phase 0.5 guest, deploys 003/004 and verifies preservation and the absence of seeded published facts. Existing migration files are unchanged. No production schema push or destructive reset.

## 3. Identity architecture

[Identity](identity.md) and ADR 008 define the browser provider port. Default authentication is disabled. The opt-in local provider is visibly labelled and uses one server-selected demo subject only in local/test. Entra External ID uses authorization code/S256 PKCE, browser-bound single-use state, nonce, exact issuer/audience, RS256 JWKS signature, expiry/issued-at/authorized-party checks and a server-only confidential credential where configured. Provider+subject identifies users; email does not. Concurrent first linking is serialized. Third-party tokens are discarded after verification.

The private API remains behind the signed BFF path. Browser sessions are random opaque capabilities in HttpOnly, Secure outside local, SameSite Strict cookies; signed client cookie is Lax for external redirects. Only hashes are stored for session/state/client capabilities. Seven-day absolute expiry, login rotation, logout and immediate deletion revocation apply. No user ID, role or token is accepted from caller claims. Verified user identity adds an account-level quota alongside browser/network limits. No live Entra tenant was configured or exercised.

## 4. Guest conversion behavior

An active account and live guest capability are required. The transaction locks user and guest, resolves actual normalized programme/structure/stage relations, creates one durable private character, writes an owner-bound 24-hour receipt and consumes the guest after all writes succeed. Same-owner retries return the same character; cross-owner receipt reuse fails. An existing account character wins unchanged and the new guest is consumed with `existing_character_kept`. No overwrite, extra character or unsafe account merge.

Nickname/avatar/campus/programme/stage/duration preference persist; canonical academic position is UUID/version based. The browser clears the guest cookie only after success and returns to the same campus world. Same-tab cosmetic coordinates survive redirect/reload without credentials or authority. Guest feedback transfers to the account; an existing account report wins a duplicate fact. Conversion failures preserve the guest.

## 5. Catalogue model

Stable internal UUIDs and separate slugs/aliases cover University, Campus, Faculty, Department, Programme, ProgrammeStructure, ProgrammeStage, AcademicSemesterTemplate, Location, Building, Hostel, Route, TransportMode, CulturalFact and CampusBusinessReference. Explicit ordered stages, display labels, entry modes, activity tags, version/effective dates and semester definitions support future direct entry, transfer, repeat/deferment/interruption and programme change without progression rules.

ContentSource, SourceObservation, Evidence, CampusFact, FactVersion, FactVersionEvidence, PublicationDecision and FactFeedback retain provenance, bounded quotes, hashes, confidence, timestamps, contradictions and policy history. EntityMergeHistory prepares reversible exception merges; mutation is disabled. Academic demo records remain fixtures and cannot establish publication. Packs remain preview/export fixtures, not the verified production authority.

## 6. Campus Intelligence pipeline

[Pipeline](campus-intelligence.md): controlled discovery -> safe retrieval -> provider-independent extraction -> strict normalization/category validation -> exact unambiguous matching -> fact/version and evidence deduplication -> independent corroboration -> automatic policy -> published catalogue -> feedback/rechecks. Observations retain transition histories, failures use backoff, unchanged observations are idempotent and stale facts retain history.

HTTP(S)-only exact-domain retrieval validates all DNS answers, rejects private/local/metadata/reserved ranges and pins a validated address into the socket while preserving TLS verification. Every redirect is revalidated. Limits cover timeout, size, MIME, redirects, domain pacing and robots; no bypasses. Raw text is processing-only, not a page archive. Server-side quote/value grounding prevents unsupported extractor confidence from publishing a claim. Future LLM adapters remain candidates under this boundary.

Five permitted official discovery URLs cover FUTA/OAU/UNILAG. [Actual initial research](initial-campus-research.md) yielded two literal official names through bounded public metadata (OAU and UNILAG); FUTA robots denial and oversized homepages were respected. Broader category extraction/research remains pending. No missing content was fabricated, and no fixture pack was promoted.

## 7. Publication rules

[PublicationPolicyService](publication-policy.md), independent of schema parsing, returns ALLOW/HOLD/REJECT/STALE with reasons and a version. Threshold is 0.85 grounded evidence confidence. Generated evidence, future timestamps, stale evidence, duplicates and strong contradictions cannot establish publication. Editorial groups and identical page hashes collapse copies.

Cultural facts require two independent non-generated groups. Locations/buildings/hostels/routes/transport/businesses/events require official authority or independent reputable corroboration. University/faculty/department/programme/academic structure and critical contacts/deadlines/fees require fresh official/institutional evidence; crowd consensus cannot override them. TTL varies from one day for events to 365 days for university names; explicit event expiry applies. No routine human approval, including critical data. Strong authoritative contradictions hold conservatively with history.

Public readers require published status, current version and unexpired staleAt; stale facts disappear immediately even if cleanup is delayed. Feedback requires a verified account or live guest, bounded inputs, one actor/fact report, low guest weight, private account-age/campus/history signals and rate limits. It schedules source rechecks and cannot rewrite canonical data or supply official authority. Significant weighted reports may hold categories without an official-only requirement; academic/critical facts cannot be suppressed by crowd weight. Admin inspection/exception operations remain locked.

## 8. Privacy and age

[Privacy](privacy.md): profiles, character/academic position, preferences and age band are private and undiscoverable, enforced by database and endpoints. No public player pages/search, age labels or indexing. Analytics defaults off; under_18/unknown cannot enable it. Self-declared classification collects no birth date or age proof and is not future KYC/age assurance.

Deletion revokes all sessions immediately and marks pending. The minute worker actually removes user, identities, profile/privacy, sessions, character, receipts and linked feedback, including converted guest reports. A completion record remains with user reference nulled. Anonymous guest reports expire at 24 hours. No financial retention exception. Deployed backup/restore erasure is unconfigured and remains a release gate.

## 9. Test results

| Check                                       | Actual local result                                                                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Lint                                        | Passed, zero warnings; final BFF edit also linted                                                                                    |
| Typecheck                                   | Passed for apps/packages and tests/config                                                                                            |
| Unit/API/security/policy and database tests | 82 passed in 11 files, no skipped tests in this run; includes seven PostgreSQL/upgrade cases                                         |
| PostgreSQL migrations                       | All four migrations applied; actual Phase 0.5 -> Phase 1 migrate-deploy upgrade passed with seeded guest preserved                   |
| Production builds                           | All five applications and eleven packages passed                                                                                     |
| Playwright Chromium desktop/mobile          | 10/10 passed against owned production-output servers, including original eight guest regressions and two account flows               |
| Dependency audit                            | No known vulnerabilities reported                                                                                                    |
| Bicep                                       | Existing skeleton compiled locally with CLI 0.48.1; no deployment                                                                    |
| Runtime containers                          | Both builds/non-root smoke passed; Alpine API also passed real PostgreSQL guest/account conversion/privacy/deletion-revocation smoke |
| Trivy 0.75.0                                | Both final images: zero HIGH/CRITICAL findings, including unfixed findings; both scans exited 0                                      |
| Semgrep Community 1.180.0                   | Strict OSS-only scan passed: 74 rules, 53 files, zero findings and parse errors                                                      |
| API SBOM                                    | CycloneDX 1.7 generated successfully, 164 components                                                                                 |

Earlier browser failures were diagnosed as an incorrect test selector/navigation wait and cold Phaser startup under concurrent heavy builds. The final suite ran sequentially without competing builds. Async Phaser readiness has a 15-second assertion budget; ownership/cookie/noindex/origin/privacy assertions are unchanged. The final passed run is `artifacts/phase1-browser-final.log`, not the earlier failed attempts. Final unit/build evidence is `artifacts/phase1-final-check.log`; scanner and container logs are ignored development artifacts.

Deterministic tests cover signed-token failure cases, private user/guest capability authorization, concurrent conversion/idempotency, database academic guards, strict minor privacy, rotation/revocation/actual deletion, quote grounding, source duplication, private-IP/IPv6/metadata/rebinding/redirect/size/MIME/timeout/robots boundaries, publication categories/copy groups/contradictions/expiry and actual migration upgrade. Browser tests retain the original eight guest-world cases and add account conversion/privacy/revocation on desktop and mobile. PostgreSQL tests explicitly skip unless TEST_DATABASE_URL points to a disposable migrated database.

## 10. CI and security-scan status

The observed remote run [37969277957](https://github.com/kinglove58/campuswahala/actions/runs/37969277957) predates these working-tree changes. Verification and verified-secret scan succeeded. CodeQL completed extraction/query/SARIF but failed on workflow-run API access; missing `actions: read` is corrected. The same run warned that repository code scanning is not enabled; enable that setting and verify applicable entitlement. No specific account-plan denial or source finding was established; new remote upload is still unverified. CodeQL is retained.

Remote web Trivy found HIGH vulnerabilities in unused npm components, with zero reported HIGH/CRITICAL application/OS findings and no Node finding. API scan/SBOM were skipped, not passed. Runtime npm/Yarn payloads and package-manager launchers are removed rather than vulnerabilities suppressed; both scans now include unfixed findings and API scan/SBOM run despite web failure. Trivy is explicitly v0.75.0. No CVE ignore list exists. See [exact triage](ci-triage-phase-1.md) and [supply chain](supply-chain.md).

Final local scans **passed**: web and API Trivy 0.75.0 both returned zero HIGH/CRITICAL findings with unfixed findings included. Initial API Debian scanning exposed 60 OS findings across 21 CVEs; the recipe now uses the supported Alpine build/runtime and matching generated Prisma engine, validated against actual PostgreSQL. No CVE allowlist or ignore-unfixed relaxation. The full historical CVE/component/fix/control/tracking record and exact scanner/image/database metadata are in [CI triage](ci-triage-phase-1.md). API CycloneDX 1.7 SBOM has 164 components.

Complementary Semgrep Community is preserved as an independent CI job with a pinned 1.180.0 image digest, OSS-only execution, metrics off and strict findings/errors. Local scan passed 74 rules/53 files with zero findings/parse errors; its engine lacks CodeQL-equivalent inter-file coverage and does not replace it. The code snapshot matches current source after newline normalization. No source is uploaded to a hosted scanner. Maintained registry rule packs are external inputs and must be reviewed with updates. New remote execution remains pending.

## 11. Unresolved risks and limits

- Public ingress bridge/private networking and shared atomic rate/replay stores are not deployed. Local counters, pacing and jobs are single-process foundations; distributed brigading/multi-worker leases, backlog monitoring and least-privilege database roles remain required.
- Live Entra tenant metadata, redirect registration, credentials and end-to-end federation are unverified. Current endpoints must share issuer hostname. The local shared demo identity is unsuitable for untrusted users. Admin MFA/permissions/audit and privileged exception operations remain disabled.
- In-process SSRF defenses are tested; independently restricted worker egress denying internal/Azure metadata networks is not deployed. No raw-page retention, but backup/restore erasure, retention monitoring and independent security review require operational evidence.
- Extraction currently researches observed official names only. Other categories have normalized tables and policy/test coverage, but broader adapters/research are pending. Two names do not verify programmes, previews, cultural claims or emergency advice. Automatic conservative contradiction holding has no authoritative auto-resolution strategy yet.
- A new remote CI run must confirm corrected CodeQL permissions/upload, entitlement and both container scans. Development base tags are not promotion digests. Future release images require immutable approved bases, fresh scans and retained provenance. Secret scan scope is verified-secret detection, not proof of all-secret absence.
- Production load/attack/restore evidence, WAF/network controls, alerts and deployed cleanup are absent. Bicep is a compiled skeleton, not achieved infrastructure or SLA.

## 12. Is Phase 2 local development safe?

Yes, for isolated local development after architectural review accepts these contracts and outstanding limits. Preserve private identity boundaries, explicit academic-position authority, fixture/publication separation and automated source policy. This does not authorize public staging or real-money/reward/social systems; public release remains blocked by the gates above. Phase 2 has not started. Stop here for architectural review.
