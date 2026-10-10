# Phase 3 review

Base: `30d045545380348335d6a3a6de321fd0e4bb3e41` (Phase 2.5 merge). Branch: `codex/phase-3-academics`. User authorized Phase 3 after the merge. Master is not modified by this branch. No deployment, production migration or later-phase work.

## Base inspection

Master matched the specified merge. Post-merge CI run [38044440088](https://github.com/kinglove58/campuswahala/actions/runs/38044440088) completed successfully: verify, containers (web/API smoke, Trivy and SBOM), secret scanning, CodeQL and Semgrep. Existing migrations 001–006 preserve guests, canonical academic position, private accounts, published/candidate campus facts and safe world state. Existing PWA only caches a public immutable/static allowlist; private reads/mutations are never cached. Programme structure/stages and explicit entry modes are reused. World INTENT/venue interactions and Phaser remain presentation-only.

## Architecture and playable tracks

See [ADR 013](decisions/013-server-authoritative-academics.md). Three private aggregate/receipt tables plus explicit semester-stage links; bounded snapshots avoid tables for every tree, lecture or noun. Six versioned Computing and six Engineering simulation courses, with 1/2/3 units, differing difficulty/effort/weights and nonofficial CW codes. Four accelerated game weeks support enrollment, nonoverlapping lectures, study, assignments, tests, examinations, missed events, integer grading, GPA/CGPA, carryover retakes and canonical progression. Completed snapshots are immutable. No university rules, credentials, real lecturer names or official timetable claims.

## Player experience and authority

CW Pocket Portal shows canonical position, current term/time/presence, units/courses, mastery, attendance, coursework, tests/exams, finalized results, GPA/CGPA, carryovers and history. Schedule is the private generated timetable, labelled simulation. Library/lecture venue panels expose eligible server intents. Travel consumes configured academic minutes; visual coordinates and safe spawns cannot authorize benefits. Phone/world lighting derives from server academic time. Guest tutorial is in-memory demo and does not migrate to account grades. Updates show bounded private academic notifications.

Strict owner-scoped, term-bound commands run in User-row-locked transactions with an in-lock live-session check. Accepted revision increments and receipt commit atomically. Retry returns original acknowledgement/current private view, conflicting key reuse fails. Two tabs cannot duplicate attendance/submissions/assessments/completion. Privacy/SEO/account/guest/Campus Intelligence boundaries remain. Academic responses are no-store, never in public guides/profiles or SW caches. Offline mutations fail; uncertain responses require explicit same-ID retry, with no background queue. Deletion cascades all private academic state through the existing worker.

## Validation checkpoint

Local lint/typechecks and production game webpack build passed. Latest local tests: 134 passed, 11 PostgreSQL tests skipped because this environment has no disposable PostgreSQL; these are not counted as passes. Remote disposable database, migration, browser/container/security validation passed on the implementation commit, as recorded below. Existing security jobs are preserved. New tests cover strict authority-field rejection, integer grade boundaries and components, missed events, location/time, snapshots, complete terms/carryovers/direct-entry, concurrent transitions, deletion and lost-response browser retry. Browser throttling and Phase 2.5 physical-device acceptance remain separate from correctness.

## Remaining review limits

Automated implementation acceptance passed on the implementation commit. The final documentation-only head must also retain green CI before review handoff; its run is linked in PR #11. This is not production launch or physical-device acceptance. Owner product/academic-balance review, prior FUTA verified-content/art/physical Android gates and Phase 1 ingress/egress/shared abuse/identity/DB-role/operations gates remain. Simulation curriculum is game content. SIWES/project tags are future context only. Nonconfigured programmes and programme-end progression fail closed/hold. 100-term and 2,000-command-per-term capacities are explicit; future archival needs a tombstone design. There is no money, economy, XP/rewards, ads/commerce, multiplayer/chat or Wahala Engine.

Historical first implementation CI `b2a2027` / run [38049261372](https://github.com/kinglove58/campuswahala/actions/runs/38049261372): 138 tests passed, one failed. Carryover-start validation correctly rejected an overlapping timetable; slots were corrected and all supported 5–12 offering loads gained a regression test. Container smoke, web/API Trivy/SBOM, Semgrep, full-history secrets and CodeQL succeeded on that checkpoint. Corrected-head results supersede this checkpoint when recorded below.

## Exact changed files

25 files, confirmed against GitHub PR #11:

- `.github/workflows/ci.yml`
- `IMPLEMENTATION_STATUS.md`
- `README.md`
- `apps/api/src/academics.ts`
- `apps/api/src/app.ts`
- `apps/game/app/academic-panel.tsx`
- `apps/game/app/academic-tutorial.tsx`
- `apps/game/app/api/academic/[action]/route.ts`
- `apps/game/app/campus-experience.tsx`
- `apps/game/app/style.css`
- `apps/game/app/use-academics.ts`
- `apps/game/app/world.tsx`
- `docs/decisions/013-server-authoritative-academics.md`
- `docs/phase-3-review.md`
- `packages/database/prisma/migrations/202610100007_academic_simulation/migration.sql`
- `packages/database/prisma/schema.prisma`
- `packages/domain/src/academics.ts`
- `packages/domain/src/index.ts`
- `packages/game-engine/src/engine.ts`
- `tests/academics-postgres.test.ts`
- `tests/academics.test.ts`
- `tests/e2e/academics.spec.ts`
- `tests/e2e/world.spec.ts`
- `tests/migration-upgrade.test.ts`
- `tests/pwa.test.ts`

Historical browser checkpoint `cbb086d` / run [38049523173](https://github.com/kinglove58/campuswahala/actions/runs/38049523173): all 142 unit/database/migration tests passed; 24 browser tests passed and four failed. Two assertions retained obsolete Phase 2 Portal copy; two new tests created a 200-stage fixture while expecting CW-CMP-101. The obsolete copy assertions and explicit 100-stage academic test setup were corrected. These failures are retained as history, not counted as acceptance.

## Completed implementation evidence

Implementation commit: `f3601949cdbb371ac09881a70423dcc6d73c4712`. Exact-head push [CI 38050624459](https://github.com/kinglove58/campuswahala/actions/runs/38050624459) completed successfully on 10 October 2026. The corresponding PR run validates the temporary merge with unchanged master, not an actual merge. Final documentation-only head/run evidence is recorded in [PR #11](https://github.com/kinglove58/campuswahala/pull/11).

| Check | Observed outcome |
| --- | --- |
| Lint and all package/test typechecks | Passed |
| Unit, publication, ingestion, world, account/API/security, PostgreSQL concurrency/deletion and migration upgrade | 145 passed across 18 files; zero skips in CI |
| Desktop/mobile Playwright including academic semester, offline refusal, lost-response retry, results/resume, guest tutorial and existing PWA/world/phone behavior | 28 passed, zero skips; 5.8 minutes |
| All production builds and world budgets | Passed; Phaser absent from marketing and lazy in game |
| Dependency audit | No known vulnerabilities found |
| Trivy web/API, container smoke and CycloneDX API SBOM | All passed |
| Semgrep Community | Passed; no findings on the corrected PR checkpoint |
| Full-history TruffleHog | Passed; no verified secrets on the corrected PR checkpoint |
| CodeQL | Passed; actual SARIF upload and processing succeeded |
| Bicep compile | Passed |

CI measured all game static JavaScript at **550,821 gzip bytes**, a conservative total including lazy chunks, not a browser transfer measurement (local Node 24 output was 649,001 bytes). FUTA manifest: 31,921 raw / 4,446 gzip bytes, all FUTA zone art 2,130 gzip bytes; OAU 20,683 / 3,307 plus 1,427 art; UNILAG 23,682 / 3,661 plus 1,430 art. No dependency was added. Existing art/manifest budgets remain respected. CI artifacts contain Phase 3 visual screenshots, browser measurements, Semgrep output and API SBOM. Browser throttling is not a physical device/FPS acceptance claim.

Phase 3 is ready for code/product review subject to the documented human/production gates. Master remains at the Phase 2.5 merge. No production migrations/deployment, merge, or later phase was performed.

Constrained browser artifact on the implementation push run: 360×800, Chromium CPU slowdown 4×, latency 180 ms, download 500,000 bytes/s, 60-second movement soak. Desktop/mobile-labelled projects recorded boot 3,276/3,168 ms, manifest 185.7/185.6 ms, 203,306 encoded first-boot bytes and 210,682 session bytes each. These values cover the measured page under that test/cache setup, excluding APIRequest fixture creation; they are not an independently cold first-campus transfer guarantee. Renderer diagnostic averages were **57.4/47.2 ms per frame**, below a 30 FPS target under this throttle, with zero asset failures and no heap-warning flag. No physical Android, sustained thermal/memory or authenticated academic-session FPS acceptance is claimed. Device acceptance and rendering performance remain human review gates.
