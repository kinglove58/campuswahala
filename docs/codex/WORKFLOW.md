# Codex / Reviewer Handoff Workflow

This repository uses GitHub as the handoff layer between implementation and review.

## Codex start

At the beginning of every task:

1. read root `AGENTS.md`;
2. read the constitution/history/active-phase files;
3. inspect current `master`, relevant prior ADRs, migrations, tests and CI;
4. create a focused branch named for the active phase;
5. implement only the active phase.

## Codex finish

When the active phase is complete:

1. run all validation required in `ACTIVE_PHASE.md`;
2. keep earlier regression/security suites enabled;
3. open/update a focused PR against `master`;
4. ensure the PR body contains:
   - base commit;
   - head commit;
   - exact files changed;
   - migrations;
   - architecture decisions;
   - test counts;
   - Playwright evidence;
   - CI run links/IDs where available;
   - CodeQL/Semgrep/Trivy/secrets/dependency results;
   - skipped/unavailable checks;
   - remaining human/device/content gates;
   - explicit statement that the next phase was not started;
5. do not merge automatically;
6. stop.

## Reviewer

The reviewer inspects:

- live repository code;
- compare diff;
- migrations and critical domain code;
- browser/service/PostgreSQL acceptance evidence;
- final PR/push CI;
- merge tree if already merged.

If gaps are narrow, the reviewer may replace `ACTIVE_PHASE.md` with an acceptance-patch phase such as 4.1 rather than redesigning the prior phase.

Only after approval does the reviewer:

- mark the phase complete in `PHASE_HISTORY.md`;
- replace `ACTIVE_PHASE.md` with the next approved phase.

## Control-file ownership

The following are reviewer-owned and normally read-only for Codex:

- `AGENTS.md`
- `docs/codex/PROJECT_CONSTITUTION.md`
- `docs/codex/PHASE_HISTORY.md`
- `docs/codex/ACTIVE_PHASE.md`
- `docs/codex/WORKFLOW.md`

Codex may propose changes in its PR notes, but must not modify them unless the active phase explicitly authorizes that exact change.

## Failure handling

If CI fails:

- diagnose the actual failure;
- fix product/test code when genuinely defective;
- do not relax assertions, quotas or scanners merely to get green;
- distinguish transient infrastructure failure from code failure;
- rerun until the exact head has trustworthy evidence.

If the active phase is ambiguous, prefer the narrower interpretation that preserves previous authority and stop for review rather than inventing the next feature.
