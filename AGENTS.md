# CampusWahala Codex instructions

Before doing any implementation work in this repository, read these files in order:

1. `docs/codex/PROJECT_CONSTITUTION.md`
2. `docs/codex/PHASE_HISTORY.md`
3. `docs/codex/ACTIVE_PHASE.md`
4. `docs/codex/WORKFLOW.md`

## Mandatory operating rule

`docs/codex/ACTIVE_PHASE.md` is the reviewer-owned source of truth for the current assignment.

Implement **only** the phase described there.

Do not infer or begin the next phase.
Do not merge automatically.
Do not rewrite the reviewer-owned control files unless the active phase explicitly instructs you to do so.

When implementation is complete:

- run every validation required by the active phase;
- open or update a focused pull request;
- record exact base/head commits, files changed, migrations, tests, browser evidence, security scans, unresolved risks and remaining human gates in the PR body or the phase review document requested by the active phase;
- clearly distinguish passed, failed, skipped and unavailable checks;
- stop for reviewer approval.

If the active-phase file conflicts with older planning documentation, the active-phase file wins for current scope, while the project constitution still governs permanent safety and architecture boundaries.
