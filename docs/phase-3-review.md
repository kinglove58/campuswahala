# Phase 3 review checkpoint

Base: `30d045545380348335d6a3a6de321fd0e4bb3e41` (Phase 2.5 merge). Branch: `codex/phase-3-academics`. User authorized Phase 3 after the merge. Master is not modified by this branch. No deployment, production migration or later-phase work.

## Base inspection

Master matched the specified merge. Post-merge CI run [38044440088](https://github.com/kinglove58/campuswahala/actions/runs/38044440088) completed successfully: verify, containers (web/API smoke, Trivy and SBOM), secret scanning, CodeQL and Semgrep. Existing migrations 001–006 preserve guests, canonical academic position, private accounts, published/candidate campus facts and safe world state. Existing PWA only caches a public immutable/static allowlist; private reads/mutations are never cached. Programme structure/stages and explicit entry modes are reused. World INTENT/venue interactions and Phaser remain presentation-only.

## Architecture and playable tracks

See [ADR 013](decisions/013-server-authoritative-academics.md). Three private aggregate/receipt tables plus explicit semester-stage links; bounded snapshots avoid tables for every tree, lecture or noun. Six versioned Computing and six Engineering simulation courses, with 1/2/3 units, differing difficulty/effort/weights and nonofficial CW codes. Four accelerated game weeks support enrollment, nonoverlapping lectures, study, assignments, tests, examinations, missed events, integer grading, GPA/CGPA, carryover retakes and canonical progression. Completed snapshots are immutable. No university rules, credentials, real lecturer names or official timetable claims.

## Player experience and authority

CW Pocket Portal shows canonical position, current term/time/presence, units/courses, mastery, attendance, coursework, tests/exams, finalized results, GPA/CGPA, carryovers and history. Schedule is the private generated timetable, labelled simulation. Library/lecture venue panels expose eligible server intents. Travel consumes configured academic minutes; visual coordinates and safe spawns cannot authorize benefits. Phone/world lighting derives from server academic time. Guest tutorial is in-memory demo and does not migrate to account grades. Updates show bounded private academic notifications.

Strict owner-scoped, term-bound commands run in User-row-locked transactions with an in-lock live-session check. Accepted revision increments and receipt commit atomically. Retry returns original acknowledgement/current private view, conflicting key reuse fails. Two tabs cannot duplicate attendance/submissions/assessments/completion. Privacy/SEO/account/guest/Campus Intelligence boundaries remain. Academic responses are no-store, never in public guides/profiles or SW caches. Offline mutations fail; uncertain responses require explicit same-ID retry, with no background queue. Deletion cascades all private academic state through the existing worker.

## Validation checkpoint

Local lint/typechecks and production game webpack build passed. Local checkpoint tests: 128 passed, 11 PostgreSQL tests skipped because this environment has no disposable PostgreSQL; these are not counted as passes. Remote disposable database, migration, browser/container/security validation is pending on the implementation commit. Existing security jobs are preserved. New tests cover strict authority-field rejection, integer grade boundaries and components, missed events, location/time, snapshots, complete terms/carryovers/direct-entry, concurrent transitions, deletion and lost-response browser retry. Browser throttling and Phase 2.5 physical-device acceptance remain separate from correctness.

## Remaining review limits

This checkpoint is not a completed Phase 3 acceptance claim. Remote CI must pass on the exact final head. Owner product/academic-balance review, prior FUTA verified-content/art/physical Android gates and Phase 1 ingress/egress/shared abuse/identity/DB-role/operations gates remain. Simulation curriculum is game content. SIWES/project tags are future context only. Nonconfigured programmes and programme-end progression fail closed/hold. 100-term and 2,000-command-per-term capacities are explicit; future archival needs a tombstone design. There is no money, economy, XP/rewards, ads/commerce, multiplayer/chat or Wahala Engine.

Historical first implementation CI `b2a2027` / run [38049261372](https://github.com/kinglove58/campuswahala/actions/runs/38049261372): 138 tests passed, one failed. Carryover-start validation correctly rejected an overlapping timetable; slots were corrected and all supported 5–12 offering loads gained a regression test. Container smoke, web/API Trivy/SBOM, Semgrep, full-history secrets and CodeQL succeeded on that checkpoint. Corrected-head results supersede this checkpoint when recorded below.
