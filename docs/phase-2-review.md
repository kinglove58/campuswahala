# CampusWahala Phase 2 review

Date: 10 October 2026. Repository: `kinglove58/campuswahala`. Base: `32c1c08710519f36e855931f077ae54a0e881f66`. Draft [PR #9](https://github.com/kinglove58/campuswahala/pull/9), branch `codex/phase-2-world-engine`. Nothing merged, deployed or started for Phase 3.

The shared virtual-world foundation is implemented and reviewable. **Full Phase 2 acceptance is still open:** richer verified FUTA/OAU landmark content and physical mobile/network performance evidence are missing. Existing security/release gates remain. This report does not call fixture geometry verified or claim a production-quality release has been proved.

## 1. Exact files changed

The inventory below is relative to the pinned Phase 1 base; generated build/scanner/browser output is ignored and excluded. No Phase 1 migration or security job was removed.

- `.github/workflows/ci.yml`
- `IMPLEMENTATION_STATUS.md`
- `README.md`
- `apps/api/package.json`
- `apps/api/src/accounts.ts`
- `apps/api/src/app.ts`
- `apps/game/app/account-panel.tsx`
- `apps/game/app/api/account/[action]/route.ts`
- `apps/game/app/api/forward.ts`
- `apps/game/app/api/world/[campus]/[...resource]/route.ts`
- `apps/game/app/avatar-editor.tsx`
- `apps/game/app/campus-experience.tsx`
- `apps/game/app/journey.tsx`
- `apps/game/app/play/page.tsx`
- `apps/game/app/sound.ts`
- `apps/game/app/style.css`
- `apps/game/app/world.tsx`
- `apps/game/public/world-assets/environment/futa.ab343b0ae925.svg`
- `apps/game/public/world-assets/environment/oau.87836f8f0a08.svg`
- `apps/game/public/world-assets/environment/unilag.187a3169935d.svg`
- `apps/worker/src/intelligence.ts`
- `apps/worker/src/landmarks.ts`
- `docs/decisions/010-versioned-virtual-world.md`
- `docs/phase-2-review.md`
- `docs/research/phase-2-remote-research.json`
- `docs/research/phase-2-source-checks.json`
- `docs/world-engine.md`
- `package.json`
- `packages/database/prisma/migrations/202610090005_world_state/migration.sql`
- `packages/database/prisma/schema.prisma`
- `packages/game-engine/src/assets.ts`
- `packages/game-engine/src/campuses.ts`
- `packages/game-engine/src/engine.ts`
- `packages/game-engine/src/index.ts`
- `packages/game-engine/src/world.ts`
- `pnpm-lock.yaml`
- `scripts/check-world-budgets.mjs`
- `scripts/compile-worlds.mjs`
- `scripts/research-world.ts`
- `scripts/research.mjs`
- `tests/accounts-postgres.test.ts`
- `tests/e2e/account.spec.ts`
- `tests/e2e/guest.spec.ts`
- `tests/e2e/world.spec.ts`
- `tests/migration-upgrade.test.ts`
- `tests/world-api.test.ts`
- `tests/world.test.ts`

## 2. World-engine architecture

`packages/game-engine` provides a shared renderer-independent `WorldEngine`, typed event bus, bounded pathfinder, collision/movement, cosmetic clock/battery/NPC interfaces, content compiler and validator. University-specific differences are data in `campuses.ts` and `assets.ts`. There is one Phaser renderer, not three campus engines.

React owns onboarding, accessible controls and CW Pocket; it receives world snapshots at approximately 300ms intervals rather than every frame. Phaser is loaded dynamically only inside the game. Camera following, bounds, zoom limits and viewport resize replace the fixed whole-campus preview. Keyboard WASD/arrows and pointer destinations work; paths avoid buildings and boundaries. Semantic destination and interaction buttons accompany the canvas.

Visible zones render/unload object containers with a margin. Versioned campus art loads lazily and has a primitive fallback. Static geometry is compiled/validated at build and API boot. The live published-catalogue projection is compiled per information request, never queried per frame. See [engine documentation](world-engine.md) and [ADR 010](decisions/010-versioned-virtual-world.md).

## 3. World-manifest format

Initial schema version 1 / world version 1 includes campus ID, geometry source revision, compressed-geography marker, bounds, default spawn, palette, zones, roads, paths, buildings/entrances, venues, safe spawns, transport destinations, interaction points, decorations, NPCs and local asset bundles.

The validator rejects duplicate/invalid IDs, missing zone/building/venue/NPC/bundle/spawn references, out-of-bounds or colliding safe points, invalid transport targets, bad source bindings, invalid versions, unknown interaction commands, invalid NPC hours, non-finite road widths, remote asset paths and budget violations. Broken manifests fail the build. The format supports an internal editor later; no graphical editor was built.

Identity bindings reference a fact key/category for a campus. Only a matching live published, non-stale catalogue record supplies a verified identity. All game positions/artwork remain approximate. Missing/stale/rejected information falls back to fictional labels. Fixture descriptions and map warnings remain visible. Geometry is **compressed campus geography**, not survey data or real-world turn-by-turn navigation.

Geometry endpoints have immutable version caches/ETags; latest pointers cache for 60 seconds. Information and account state remain no-store. Only unreleased v1 is supplied; before releasing changed geometry, increment its version and retain the old immutable resource. Removed persisted spawn IDs fall back safely to the default.

## 4. FUTA content implemented

3072×2304 world; six zones, nine venues, eight roads, eighteen paths, fifteen safe spawns, six NPCs, six shuttle nodes and ninety environmental objects. Warm clay/bungalow styling and green vegetation. Zones: Arrival grove, Learning quarter, Civic court, Residence gardens, The commons and Recreation field.

Fictional fallback venues: Welcome lodge, Study house, Lecture hall, Student support, Hostel lounge, Food corner, Courtyard club, Sports pavilion and Care lodge. Library/lecture/hostel venues have illustrated mini-interior panels; food/support/clinic/sports/social venues have contextual panels. Boards show game announcements and link to the published guide. Transport jumps safely between configured zone spawns without charging money.

Library, student-affairs and health-centre identity bindings are ready for eligible published facts. **No FUTA landmark was successfully published in this pass.** Both local protected research and isolated remote research were attempted. Remote robots checks rejected the FUTA sources, including the official news discovery URL; they were not bypassed. Schools/support discovery hints remain candidates until the ordinary pipeline succeeds. Gates, hostel names, religious venues, food areas and real routes were not fabricated. No religious identity is inferred.

## 5. OAU content implemented

2560×2048 world; four zones, five venues, six roads, eleven paths, nine safe spawns, four NPCs, four shuttle nodes and sixty-six environmental objects. Sand/olive palette and columned hall silhouettes differ from FUTA.

Fictional fallback venues: Arrival pavilion, Study terrace, Lecture hall, Garden café and Common room. Library binding is ready. Isolated research published the university name, but OPAC/repository requests timed out and the main directory exceeded the unchanged fetch-size limit. No OAU library name is silently baked into game fixtures as verified content.

## 6. UNILAG content implemented

2304×2560 world; four zones, six venues, six roads, twelve paths, ten safe spawns, four NPCs, four shuttle nodes and sixty-eight environmental objects. Teal/tower styling, palms and waterfront-inspired fictional gardens differ from the other campuses.

Fictional fallback venues: Study court, Lecture hall, Shuttle shelter, Residence lounge, Food courtyard and Civic room. Library/senate identity bindings are configured. The normal isolated pipeline successfully published `UNIVERSITY OF LAGOS LIBRARY` from its official library site and the university name. The senate/explore page exceeded the existing size limit; no senate identity was published.

The research report is evidence, not an import/seed. A runtime connected to its own configured catalogue must run ingestion to obtain its own published facts. Default memory-only gameplay consequently remains clearly fictional. [Remote research evidence](research/phase-2-remote-research.json) records timestamps, source hashes/status and published evidence links without copying raw source pages. [Local source checks](research/phase-2-source-checks.json) record DNS failures. Sixteen official discovery URLs were checked remotely; three current facts remained after four publication evaluations.

## 7. Virtual-phone apps

CW Pocket is a fictional device/OS with a framed overlay, status bar, game clock/day/week, battery/network visuals, nine-app grid, welcome notification and muted-by-default audio. It nearly fills mobile viewports and uses an intentionally narrower desktop handset. The game input pauses while phone/venue dialogs are open; background controls are inert, focus is trapped and Escape restores focus.

| App               | Phase 2 behavior                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------------------------------------------ |
| Campus map        | Virtual player/zone/destination map, semantic destination list, waypoint and world walking indicator               |
| Portal            | University/programme/stage; academic simulation explicitly coming next, no fabricated grades/courses               |
| Schedule          | Labelled game example day; future lecture/assignment/event/exam interface                                          |
| Guide & feedback  | Published facts only, category/value/date/source links and existing correct/incorrect/outdated/correction feedback |
| My chapter        | Layered appearance customization and safe account save or cosmetic guest session cache                             |
| Inventory         | Phone/backpack/notebook cosmetic demo presentation, no valuable item authority                                     |
| Updates           | Internal welcome/guide/privacy notices; no push service or social chat                                             |
| Settings          | Weather demo, camera zoom and complete sound mute/volume control                                                   |
| Account & privacy | Existing private account, age/consent controls, sign-in, logout and deletion flows                                 |

Device properties are extensible (model, capacity, camera quality, tier, prestige). Battery is cosmetic and cannot drain below 20%. Schedule/inventory/academic placeholders are labelled; there are no fake commerce or checkout buttons.

## 8. Interaction/NPC architecture

Typed commands: `ENTER_VENUE`, `TALK_TO_NPC`, `OPEN_SERVICE`, `VIEW_NOTICE`, `TRAVEL`, `REST`. Typed events: zone entry, venue approach/entry, phone opening, period changes, transport use, NPC interaction and intent. Future systems can subscribe without coupling to React or a campus-specific conditional.

Initial fictional student/vendor/security/shuttle-operator/staff NPC roles have layered appearance, spawn/active hours, dialogue and stationary/patrol examples. Idle/wander patterns are supported as simple route/visual foundations; there is no sophisticated AI. Approach prompts follow moving NPC positions and disappear outside configured hours. No identifiable lecturer/person is represented and no NPC grants rewards.

Library, lecture and hostel interiors are compact illustrated panels, not independently navigable rooms. Full interiors and actual zone-transition venue presentations remain future extensions. The deterministic session clock controls inexpensive morning/afternoon/evening/night overlays, cosmetic venue/NPC state, phone display and demo clear/cloudy/rain. Rain is visibly drawn. Time resets on a new world session and has no academic/economic authority. The tiny synthesized sound port obeys user gestures and mute; no large audio downloads.

## 9. Player-state persistence

The fifth additive migration creates `PlayerWorldState` only. It stores owner FK, campus ID, world revision, safe spawn ID, derived zone ID, enumerated appearance and update time. No tree/bench rows or every-step coordinate writes are introduced.

The authenticated principal chooses the owner. Server validation rejects owner injection, arbitrary coordinates, unknown campus/spawn/revision and invalid appearance. A transaction locks the user and rechecks active session/user/character before upsert. Deletion cascades and immediate revocation prevents resume. Missing or invalid old spawns fall back to the current default. Reads/writes remain private/no-store and use the signed BFF/account binding.

Initial character appearance is preserved across guest-to-new-account conversion and signed-in creation. Existing account characters/state win. Appearance saves and discrete venue/transport safe-location saves use the account endpoint; guests never write the durable table. Guest appearance session storage is cosmetic/untrusted only; guest position remains ephemeral. A client can select a known safe spawn for its own account; this does not prove a visit or authorize a future reward.

## 10. Performance measures

Manifests: FUTA 25,309 bytes; OAU 16,284 bytes; UNILAG 17,459 bytes, under a 160,000-byte budget. Initial local environment art is 368 bytes/campus under a 65,536-byte budget, with byte/hash integrity checked. The production Phaser runtime is approximately 1.19 MB raw / 314 KB gzip, deferred until game entry; these art/manifest budgets are not total application download claims.

Marketing production JS has no Phaser runtime signatures; source/build checks preserve game dynamic loading. Visible-zone objects are unloaded, asset loading is progressive, failed optional trees have fallbacks, and cached geometry remains usable through brief connection loss. Initial loading says “Opening FUTA…” and failures offer branded retry without stack traces.

Local, non-transmitted diagnostics measure manifest/world boot/asset load, frame timing, asset failures and optional Chromium heap-pressure warnings. No third-party or user-linked tracking was added. Target is 30 FPS, not a proven physical-device result. Desktop/Pixel 7 browser emulation and screenshot inspection were performed; physical low-tier Android, slow-network, thermal and long-session memory tests were not. [Manual device procedure](world-engine.md#manual-device-review-still-required) records the remaining work.

## 11. Security validation

Signed nonlocal BFF trust, raw-body/account binding, origin checks, rate/replay controls, server account ownership, private/no-store account responses, deletion, publication eligibility, source provenance, robots/DNS-pinned safe fetching and candidate/public separation remain. Public world responses contain only game configuration; they do not expose source processing internals or account tokens. Cacheable BFF responses set no identity cookies. Candidate facts never feed the public information projection.

All existing security jobs remain. Trivy still fails on HIGH/CRITICAL including unfixed findings; no CVE exception was added. Strict Semgrep remains enabled; a parser-incompatible literal HTML comment regex was rewritten using the same `RegExp` approach as existing Phase 1 code. The original zero-finding parse failure was not hidden by exclusions or relaxed flags. The keyboard regression test remains strict; its initially incorrect “last control” assumption was corrected to the welcome notification.

No rewards, valuable client inventory, XP, CGPA changes, competition points, ads, commerce, payments, unrestricted chat, multiplayer or third-party analytics were introduced. Future placement IDs are data fields only.

## 12. Tests and actual execution

Final local lint/typecheck passed; earlier local build/manifest budgets also passed. The final production build and full database/browser checks ran remotely. Local unit/API tests: 100 passed, seven PostgreSQL cases skipped because this workspace lacks PostgreSQL/Docker. The missing checks were run remotely with disposable PostgreSQL, actual migrations, Chromium and containers; they are not reported as local successes. Local Playwright installation could not retrieve a valid browser archive, and Trivy/Semgrep/Bicep tools were unavailable locally. Remote jobs provide those results.

The world suite has twenty-four cases, including required ID/reference/bounds/source/version integrity, source staleness/campus separation, strict safe-state parsing/fallback, collision/path/pause, transport and NPC visibility/proximity. PostgreSQL coverage adds safe state, other-owner/invalid campus/spawn/coordinates rejection, guest denial, stale-spawn fallback and deleted-account denial/cascade. Real migration upgrade preserves the existing Phase 0.5 guest through migration 005.

Browser coverage retains guest/BFF/privacy/account conversion/resume/logout regression tests and adds phone layouts/focus wrap/Escape, Portal/guide/weather, waypoints/venue interaction, three cached manifests, guest durable-state denial, appearance save and safe-location resume. CI captures desktop/mobile screenshots. Screenshot inspection confirms phone fit and visible campus/rain/UI; it is not a physical-device or FPS benchmark.

| Required validation                      | Actual result / evidence                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Lint/typecheck                           | Passed locally and remotely                                                                             |
| Unit/world/API/security/PostgreSQL tests | 107 passed across 13 files remotely; includes all seven database/upgrade cases                          |
| World integrity suite                    | 24 cases passed; 25 focused world/API cases also passed locally after identifier hardening              |
| Migration upgrade                        | Passed real migrate deploy from Phase 0.5 through all five migrations; guest preserved                  |
| Desktop/mobile Playwright                | 14 passed, zero skipped, including account appearance/safe spawn resume and focus wrap                  |
| Production build                         | All 16 workspace build tasks and validated manifest emission passed                                     |
| Performance checks                       | All three manifest/hash budgets and marketing/Phaser separation passed; no CI FPS claim                 |
| Dependency audit                         | No known vulnerabilities reported by final remote audit                                                 |
| Web/API container build + non-root smoke | Passed                                                                                                  |
| Trivy web/API                            | Both passed; zero HIGH/CRITICAL findings with unfixed findings included                                 |
| API CycloneDX SBOM                       | Generated/uploaded successfully                                                                         |
| Strict Semgrep Community                 | Passed; 74 rules on 66 files, zero findings and no strict parse failure                                 |
| Verified secret scan                     | Passed                                                                                                  |
| Bicep compile                            | Passed remotely; no Azure resources deployed                                                            |
| CodeQL                                   | Failed at upload because repository code scanning is disabled; source analysis ran, success not claimed |

## 13. Remote CI status

Before major implementation, [Phase 1 run 37982278620](https://github.com/kinglove58/campuswahala/actions/runs/37982278620) at base `32c1c08710519f36e855931f077ae54a0e881f66` was inspected:

| Requested result | Observed result                                                      |
| ---------------- | -------------------------------------------------------------------- |
| Verify           | Success                                                              |
| Trivy web        | Success                                                              |
| Trivy API        | Success                                                              |
| SBOM             | Success                                                              |
| Semgrep          | Success                                                              |
| Secret scan      | Success                                                              |
| CodeQL           | Failure: repository code scanning is not enabled; retained unchanged |

The initial Phase 2 run found three browser failures and a Semgrep parse error with zero findings. Focus restoration, walking-test budget and parser compatibility were corrected. The corrected [run 38030824639](https://github.com/kinglove58/campuswahala/actions/runs/38030824639) passed verify (103 tests/14 browser cases), scans and secrets. [Run 38031272082](https://github.com/kinglove58/campuswahala/actions/runs/38031272082) passed 104 tests/14 browser cases, audit, Bicep, containers, Trivy, SBOM, strict Semgrep and secrets, and produced inspected screenshots/research. Later appearance/integrity/focus tests were added and rerun.

Final implementation commit: `8b07cb9a422f073281105879e7e748c55f583713`. [Push run 38032437085](https://github.com/kinglove58/campuswahala/actions/runs/38032437085): verify, containers (web/API Trivy + SBOM), Semgrep and secrets succeeded. Verify reports **107 tests and 14 browser cases passed**; audit reports no known vulnerabilities. Overall workflow remains failed because the retained CodeQL job fails on repository configuration. The matching [PR run 38032440240](https://github.com/kinglove58/campuswahala/actions/runs/38032440240) also completed: verify, containers, Semgrep and secrets succeeded; CodeQL failed on the same repository setting. The later report-only commit does not change application code; these are the exact tested implementation runs.

Artifacts on the successful implementation run: [desktop/mobile visual captures](https://github.com/kinglove58/campuswahala/actions/runs/38032437085/artifacts/11662736982), [Semgrep report](https://github.com/kinglove58/campuswahala/actions/runs/38032437085/artifacts/11662911255) and [API SBOM](https://github.com/kinglove58/campuswahala/actions/runs/38032437085/artifacts/11662731687). The separate protected [research run 38031609937](https://github.com/kinglove58/campuswahala/actions/runs/38031609937) produced the committed source-status evidence. Research is now opt-in on this branch with a `research:` commit prefix; ordinary code/docs verification does not repeatedly fetch external sites. Required security/verification jobs are unchanged.

CodeQL completes source extraction/queries/SARIF interpretation, then GitHub rejects result upload: “Code scanning is not enabled for this repository. Please enable code scanning in the repository settings.” Permissions are present; the job was not removed and **CodeQL success is not claimed**. Configuration/entitlement must be reviewed by the repository owner; this pass did not change repository security settings.

## 14. Unresolved risks and definition-of-done gaps

- FUTA has a substantially larger fictional world, but multiple verified real landmarks, real relative relationships and religious locations could not be established through the permitted pipeline. OAU library evidence remains blocked. No protected source or fixture was promoted to fill this gap.
- Research facts were published in isolated disposable data, not a deployed catalogue. Production/local PostgreSQL must perform its own normal ingestion; evidence JSON is never seeded as canonical content.
- Campus layouts are stylized generated configurations with distinct sizes/palettes/silhouettes/density; they need human campus/art review for recognition and cultural polish. Full walkable interiors, richer handcrafted geography and campus-specific bundles can extend the engine.
- Physical low-tier Android/network/FPS/heap/thermal/accessibility testing is outstanding. Emulated browser checks do not establish the Nigerian-network performance goal.
- Only initial unreleased v1 is served. Release/version-retention process must prevent replacing immutable geometry; future revision hosting/editor/CDN remains an extension.
- CodeQL repository setup still blocks a completely successful workflow. All existing Phase 1 public-release gates (private ingress/egress, distributed controls, live provider/MFA, DB roles, backup/operations/load review) remain unresolved.

## 15. Whether Phase 3 local development is safe

The architecture has explicit extension ports and keeps reward/economy authority out of the browser. Isolated Phase 3 development could use these contracts after review, but **unconditional Phase 3 sign-off is not given** while Phase 2 acceptance/content/device gaps remain. Public release is not safe on the strength of these tests alone. Stop for review; Phase 3 was not started.
