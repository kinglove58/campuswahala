# Phase 3.1 academic acceptance patch

Base master: `c37500cf95c2296581350ca346b95de3211b998a`, merged Phase 3. Branch: `codex/phase-3.1-academic-e2e`. No Phase 4, production deployment/migration or automatic merge.

## Inspection

Master exactly matched the requested merge. Post-merge [CI 38060180472](https://github.com/kinglove58/campuswahala/actions/runs/38060180472) passed verify, containers/Trivy/SBOM/smoke, CodeQL, Semgrep and full-history secrets. Inspected `tests/e2e/academics.spec.ts`, pure academic and PostgreSQL tests, actual world waypoint/Walk there/Enter venue UI, venue AcademicPanel, private BFF routes and signed API command handling. Existing neglected-semester, offline refusal, explicit lost-response retry, guest, account deletion, migration and concurrency tests remain unchanged.

## Added browser journeys

`tests/e2e/academic-journeys.spec.ts` adds two scenarios to both desktop and mobile projects:

1. Sign in and start a semester in CW Pocket; assert six courses and real simulation Schedule; set a phone waypoint and walk to the lecture hall. At the correct lecture time visual movement/entry must leave academic presence/revision unchanged and attendance is rejected by the server. Travel through the actual venue panel, expand the course and attend from that same panel. Study, work and submit through Portal; use the real BFF for repetition; take a test and an examination through Portal; finish the remaining validated events, finalize through Portal, assert all courses passed, positive GPA/CGPA and successful progression.
2. Prepare five courses while neglecting the sixth, skip that course's test/exam by legitimately ending the day, and require exactly one failure plus progression with carryovers. Start the next semester through Portal, require exactly one copy of the carryover, prepare and assess every offering, then require a passed retake and no outstanding carryover. Compare the original failed history/result/progression snapshot unchanged and compute cumulative units/quality points from both persisted term results, including both attempts. One assignment submission races two genuinely concurrent BFF requests, requiring one success and one safe conflict with a single revision increase.

There are no new production endpoints, schemas, strategies, limit changes or test backdoors. The only DB operation in the new browser scenarios resets the existing local-development account fixture through User deletion before signup; academic grades/time/mastery/snapshots are never inserted or edited. All authoritative gameplay mutations use browser-context HttpOnly cookies → existing BFF signed context → private API → AcademicService → PostgreSQL. A bounded response poll waits only when an actual 429 occurs under the unchanged quotas; it retains the same command ID. No arbitrary delay or academic clock shortcut is used.

Privacy checks require no-store academic responses, no academic paths in Cache Storage, and no academic state/simulation course publication in public marketing/university/guide responses. Ordinary profile responses also omit grades. There is no public academic/share endpoint. New CI screenshots cover successful results, the actual venue attendance panel, failed carryover results, next-term carryover enrollment and passed retake/history on desktop/mobile. Existing failed-semester screenshots are retained.

## Exact files changed

- `tests/e2e/academic-journeys.spec.ts`
- `docs/phase-3.1-review.md`
- `IMPLEMENTATION_STATUS.md`
- `README.md`

The latter two correct Phase 3's merged status and link this acceptance evidence. Existing production academic/world/PWA code and security workflow remain unchanged.

## Validation checkpoint

Local lint and test TypeScript checks passed. Local unit execution passed 134 tests; 11 PostgreSQL tests were explicitly skipped because no local disposable PostgreSQL is available. Local Chromium/container/security tooling is unavailable. These skips are not passes. The focused PR final report records the exact head, real remote outcomes/counts/runtime, result values and screenshot artifacts; its GitHub Actions links are the source of truth for acceptance. Full CI retains all publication/ingestion/world/PWA/account/security/database/migration tests, desktop/mobile and constrained-network Playwright, builds/budgets/audit, CodeQL, Semgrep, full-history TruffleHog, Trivy web/API, SBOM, Bicep and container smoke.

## Remaining Phase 3 gates

These scenarios close automated boundary acceptance, not production launch. Academic balance/product review, physical Android/thermal/memory acceptance, the previously documented throttled renderer performance limit, campus content/art acceptance and ingress/egress/identity/shared-abuse/DB-role/operations gates remain. Simulation curriculum and progression rules are game content, not university credentials. Existing capacity, unconfigured-programme and future SIWES/project limits remain. No Phase 4 systems are introduced.
