# Phase 2.5 review candidate — content/device gates open

Base master: `9427141546c9257d3cc3c213dcf89079425332b1` (merged Phase 2). Branch: `codex/phase-2.5-authenticity-hardening`. Draft PR #10. Phase 0–2 were extended, not rebuilt. Phase 3 is not started. No deployment or production DB writes.

## Architecture and data safety

Migration 006 introduces explicit CampusSubject UUIDs and mutually exclusive canonical/candidate subject identity plus property. Existing fact IDs, current pointers, statuses, versions, decisions and feedback survive. Legacy subject keys remain distinct. Extractors now require stable subjectKey/propertyKey; exact ambiguous names never fuzzy-merge. Official eligible name evidence can establish a canonical subject without verifying geometry. See ADR 011.

Catalogue: validated campus/category/subject filters, limits 1–100, deterministic UUID ordering and versioned scope-bound opaque cursor. Live reads exclude stale/held/candidate/rejected/missing-version records and private ingestion metadata. Phone/public-guide pagination, campus-scoped sitemap reads and world canonical-ID lookup avoid a global first-100 bottleneck.

Authority/status parsers and SQL constraints fail closed. Critical contacts/fees/deadlines require literal official authority. Unknown/institutional/community/reputable sources cannot publish critical information. Contact/emergency/fee/deadline property keys must use the critical category even on a building subject. Source uniqueness is campus+URL, with ephemeral raw retrieval and bounded excerpts/hashes.

Guest conflict: preserve cookie/guest/feedback, reserve conversion to the same owner and return `EXISTING_CHARACTER_CONFLICT`. UI offers saved journey or temporary guest exploration; guest mode cannot persist account world changes. First conversion/retry remains transactional. Account deletion revokes sessions immediately; worker claims bounded SKIP LOCKED requests and counts only actual idempotent completion. See ADR 012.

## Content and visual changes

FUTA discovery adds official hostel, school and physical-planning evidence targets. OAU adds residence/convocation targets. UNILAG adds campus facility/religious targets. These are not seed facts; normal robots/safe-fetch/grounding/publication must independently succeed. `docs/research/phase-2.5-discovery.md` lists URLs; executed research artifacts are linked in that document.

World/schema v2 binds canonical UUID/property. Exact original v1 manifests and hashed art remain served unchanged. Layout is compressed geography, never physical GPS. Manifest-configured roof/facade treatment, kerbs/crossings, ground variation, layered trees/palms, props and clearer avatars improve original local vector/procedural art. Nearby ambient groups remain fictional. Limits: 32 NPCs/manifest, six/zone, 16 rendered nearby; inactive NPCs skip movement. CW Pocket retains focus/Escape/reduced motion and gains clearer map identity/transport labels and guide pagination.

PWA: bounded static/hashed/immutable allowlist; no private APIs, navigation HTML, current facts or latest pointers. No mutation queue. Open world/map may continue offline; private resume on reload waits for reconnect via branded static fallback. Zone art is actually requested by visible zone, not a single conceptual campus bundle.

## Validation evidence

Local compilation, lint, 106 non-PostgreSQL tests and production game/marketing builds passed. Nine PostgreSQL cases were skipped locally because this environment has no PostgreSQL/Docker; they are not local passes.

Earlier remote checkpoint `760c0370e7b715b2b00d4dda613d632ce6cbbf48`, run `38037349385`: all 112 unit/API/PostgreSQL/migration tests passed with zero skips. Production build and budget checks passed. CodeQL successfully uploaded SARIF and reported success. Semgrep, verified-secret scan and containers/Trivy/SBOM passed. Browser checks: 15 passed/3 failed; failures were the stale map-copy assertion and the previous shared-demo-account expectation, corrected in the next checkpoint. Offline/throttled/failure-recovery browser cases passed. Dependency audit after the failed browser step was skipped in this first run; success is not claimed for that checkpoint.

Measured remote gzip: FUTA manifest 4,400 bytes; OAU 3,264; UNILAG 3,496. All per-campus zone art: 2,130 / 1,427 / 1,430 gzip bytes. All game static JS upper bound including lazy chunks: 541,761 gzip bytes. Local webpack upper bound: 639,773 bytes. Build-mode difference is reported, not hidden. Marketing has no Phaser runtime. These are compressed output measurements, not actual first-load/FPS/physical-device results.

## Acceptance scope

Implemented: subject/property migration, >100 catalogue pagination, strict authority/status policy, critical property enforcement, owner-bound guest conflict, bounded concurrent cleanup, campus+URL source design, controlled research, canonical world v2 with immutable v1, manifest art direction, visible-zone bundles, bounded nearby ambience, phone/map polish, public-only offline cache, desktop/mobile functional/visual tests and realistic compressed budget checks.

Content: FUTA has six compressed zones/nine venues and richer art/discovery coverage, but zero new published research facts because permitted retrieval has not succeeded. OAU has four zones/five venues with library identity evidenced. UNILAG has four zones/eight venues with canonical library, hall, clinic, chapel and mosque bindings. Eight UNILAG current facts passed isolated publication; identity labels still require live configured ingestion. All geometry, schedules, NPCs and unbound venues remain fictional/approximate. Do not import these disposable research databases as production canonical data.

CW Pocket retains map/waypoint, guide/feedback with page loading, character/profile, privacy/logout/deletion, placeholder academic Portal, explicitly demo schedule/inventory, notifications and settings. No grades, economy, ads, commerce, multiplayer or chat were added.

Offline scope: open exploration and map continue; a cold/offline private session cannot be restored from cache. Missing optional zone art uses procedural fallback until reload. Private writes are neither cached nor queued. Browser emulation is a reproducible diagnostic; a 60-second bounded movement soak is not the physical 20-minute gate.

## Constrained browser measurements

Earlier diagnostic checkpoint `79a7383`, run `38038643785`, saved JSON in browser-measurements artifacts: at 360×800, 4× CPU slowdown, 180 ms latency and 500,000 bytes/s download, world-ready was 3,322 ms (desktop project) / 3,269 ms (mobile project). Recorded first-boot encoded network bytes were 194,280; session transfer 201,656. Manifest resource duration was 185.6 / 183.2 ms. After a 60-second movement soak, renderer cumulative frame interval was 66.2 / 55.8 ms; heap warning false and asset failures zero.

Those frame intervals are below the intended 30-FPS experience under this emulation. They do not establish physical FPS or a device pass, and can include browser scheduling/loading pauses. The byte readings cover the page's CDP network events, exclude APIRequest fixture setup and are not a guaranteed empty-disk-cache device cold load. Budget output and network transfer are separate measurements. Review/device optimization remains open; no numbers are manipulated into a passing FPS claim.

## Remaining review gates

Current automated commit/run evidence is maintained in [draft PR #10](https://github.com/kinglove58/campuswahala/pull/10) and its required CI checks; read the latest head rather than treating an earlier checkpoint as a final pass. Full-history verified-secret scanning and CodeQL uploads have succeeded on Phase 2.5 checkpoints. Additional all-campus/rain/venue/Pocket captures and isolated research outputs have been retrieved and inspected. Physical low-end/mid-range Android performance/usability/thermal/long-session acceptance is **NOT TESTED** and requires the human procedure in `docs/mobile-device-acceptance.md`. No physical results are fabricated.

Existing Phase 1 public-release gates remain: private ingress/egress, shared atomic abuse/replay controls, configured live identity/MFA, least-privilege DB roles and operational/security review. Public repo visibility does not provide these controls.

Do not merge as a production-ready release. Stop for Phase 2.5 review; no Phase 3 sign-off yet.

## Exact changed-file inventory

Paths below are the branch diff against the inspected merged Phase 2 base. Generated Next route declarations are included; original v1 manifest snapshots are retained intentionally.

- `.github/workflows/ci.yml`
- `.github/workflows/research.yml`
- `IMPLEMENTATION_STATUS.md`
- `README.md`
- `apps/api/src/accounts.ts`
- `apps/api/src/app.ts`
- `apps/api/src/catalogue.ts`
- `apps/game/app/account-panel.tsx`
- `apps/game/app/api/forward.ts`
- `apps/game/app/api/guide/route.ts`
- `apps/game/app/api/world/[campus]/[...resource]/route.ts`
- `apps/game/app/campus-experience.tsx`
- `apps/game/app/journey.tsx`
- `apps/game/app/layout.tsx`
- `apps/game/app/offline.tsx`
- `apps/game/app/style.css`
- `apps/game/app/world.tsx`
- `apps/game/next-env.d.ts`
- `apps/game/next.config.ts`
- `apps/game/public/manifest.webmanifest`
- `apps/game/public/offline.html`
- `apps/game/public/pocket-icon.svg`
- `apps/game/public/sw.js`
- `apps/game/public/world-assets/zones/futa-zone-0.d6b2c3937984.svg`
- `apps/game/public/world-assets/zones/futa-zone-1.0f78d95709a6.svg`
- `apps/game/public/world-assets/zones/futa-zone-2.1248e30d2d65.svg`
- `apps/game/public/world-assets/zones/futa-zone-3.20ef94915272.svg`
- `apps/game/public/world-assets/zones/futa-zone-4.4edd42894dc0.svg`
- `apps/game/public/world-assets/zones/futa-zone-5.c8ae781f483f.svg`
- `apps/game/public/world-assets/zones/oau-zone-0.9cde4d1d974c.svg`
- `apps/game/public/world-assets/zones/oau-zone-1.ff9bb67b8f82.svg`
- `apps/game/public/world-assets/zones/oau-zone-2.d91570043d86.svg`
- `apps/game/public/world-assets/zones/oau-zone-3.5593bc2dce46.svg`
- `apps/game/public/world-assets/zones/unilag-zone-0.3854fc50f8cc.svg`
- `apps/game/public/world-assets/zones/unilag-zone-1.f9f131d873e0.svg`
- `apps/game/public/world-assets/zones/unilag-zone-2.b470a2993fc1.svg`
- `apps/game/public/world-assets/zones/unilag-zone-3.b73343138e5b.svg`
- `apps/marketing/app/guide/[campus]/page.tsx`
- `apps/marketing/app/published.ts`
- `apps/marketing/app/sitemap.ts`
- `apps/marketing/app/universities/[campus]/page.tsx`
- `apps/marketing/next-env.d.ts`
- `apps/worker/src/adapters.ts`
- `apps/worker/src/deletion.ts`
- `apps/worker/src/intelligence.ts`
- `apps/worker/src/landmarks.ts`
- `docs/campus-intelligence.md`
- `docs/decisions/006-explicit-academics-and-content.md`
- `docs/decisions/008-private-identity-and-conversion.md`
- `docs/decisions/009-automatic-campus-publication.md`
- `docs/decisions/011-subject-facts-and-campus-sources.md`
- `docs/decisions/012-safe-offline-and-guest-conflicts.md`
- `docs/identity.md`
- `docs/mobile-device-acceptance.md`
- `docs/phase-2-review.md`
- `docs/phase-2.5-review.md`
- `docs/publication-policy.md`
- `docs/research/phase-2.5-discovery.md`
- `docs/world-engine.md`
- `eslint.config.mjs`
- `packages/campus-content/src/catalogue.ts`
- `packages/campus-content/src/index.ts`
- `packages/campus-content/src/publication.ts`
- `packages/database/prisma/migrations/202610100006_subject_identity/migration.sql`
- `packages/database/prisma/schema.prisma`
- `packages/game-engine/src/assets.ts`
- `packages/game-engine/src/campuses.ts`
- `packages/game-engine/src/revisions.ts`
- `packages/game-engine/src/revisions/futa.v1.json`
- `packages/game-engine/src/revisions/oau.v1.json`
- `packages/game-engine/src/revisions/unilag.v1.json`
- `packages/game-engine/src/world.ts`
- `scripts/check-world-budgets.mjs`
- `scripts/research.mjs`
- `tests/accounts-postgres.test.ts`
- `tests/adapters.test.ts`
- `tests/catalogue-postgres.test.ts`
- `tests/e2e/account.spec.ts`
- `tests/e2e/guest.spec.ts`
- `tests/e2e/low-bandwidth.spec.ts`
- `tests/e2e/world.spec.ts`
- `tests/ingestion-security.test.ts`
- `tests/intelligence-postgres.test.ts`
- `tests/migration-upgrade.test.ts`
- `tests/publication.test.ts`
- `tests/pwa.test.ts`
- `tests/world-api.test.ts`
- `tests/world.test.ts`
- `vitest.config.ts`
