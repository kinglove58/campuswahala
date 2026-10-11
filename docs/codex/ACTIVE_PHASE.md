# ACTIVE PHASE — Phase 4.1

Status: READY_FOR_IMPLEMENTATION  
Owner: reviewer  
Repository: `kinglove58/campuswahala`  
Reviewed base: `51971dd7c9f5af932b45052b7b2d3774e2d71669`

## Mission

Close the remaining Phase 4 acceptance/UI gaps without rebuilding Phase 4 and without starting Phase 5.

Phase 4 already implemented and merged:

- one authoritative academic/life timeline;
- energy, satiety, mood and wellbeing;
- passive decay;
- food, rest, sleep, socialize and exercise;
- travel energy effects;
- virtual home/hostel;
- contextual Wahala;
- 10 versioned Wahala templates;
- strict non-executable eligibility DSL;
- one pending event;
- cooldown/day/term budgets;
- idempotency/concurrency;
- private life state;
- offline refusal;
- deletion;
- browser daily-life acceptance.

## Do not add

Do not add:

- friends/follows;
- DMs/chat;
- clubs;
- multiplayer;
- social reputation;
- leaderboards;
- share cards;
- Campus Stories/Wrapped;
- money/Campus Cash;
- XP/rewards;
- ads;
- commerce;
- real GPS.

Do not begin Phase 5.

## Task 1 — non-neutral Wahala browser acceptance

The current browser journey proves a Wahala can appear and be neutrally dismissed.

Add deterministic Playwright acceptance proving a real non-neutral Wahala choice through the existing production path:

```
legitimate life/time action
→ server creates eligible Wahala
→ CW Pocket shows the situation
→ player sees choices
→ player chooses a NON-NEUTRAL choice
→ request crosses browser → BFF → private API → LifeService → PostgreSQL
→ canonical AcademicTerm.minute advances by the configured choice duration
→ passive life decay is processed
→ explicit Wahala effects apply
→ occurrence becomes resolved
→ chosenChoiceId/effect persist
→ refresh/resume preserves the outcome
```

Before the choice, capture academic minute, life revision and relevant metric values.

After the choice, assert:

- academic minute advanced by the configured minutes;
- life revision increased exactly once;
- expected bounded metric direction/effect occurred;
- occurrence is `resolved`;
- `chosenChoiceId` is stored;
- effect snapshot exists;
- occurrence is no longer pending;
- refresh shows the resolved outcome under recent campus stories.

Do not inject template IDs/rolls/metrics/time in the database and do not create a test-only endpoint.

Use legitimate context so an existing template becomes eligible naturally.

Retain the neutral `Leave it for now` route.

If practical without excessive runtime, also prove committed-but-lost resolution retry with the same command ID does not double-advance time/effects. Otherwise retain and cite the existing service/PostgreSQL idempotency proof.

## Task 2 — complete Campus Life / Today context

For an authenticated active term, Campus Life must additionally show:

### Current authoritative venue

Use `AcademicTerm.presenceVenueId` resolved to venue name.

Never use Phaser coordinates as authority.

Example:

`Current: Study House`

### Next academic event

Derive the earliest upcoming scheduled lecture/test/examination from the existing private AcademicView.

Show:

- course;
- event type;
- game day/time;
- venue.

Example:

`Next: CW-CMP-103 lecture · Tuesday 11:00 · Lecture Hall`

Keep clear that this is CampusWahala simulation data.

### Carryover context

If outstanding carryovers exist, show a concise indicator such as:

`Carryover: CW-CMP-106`

Do not duplicate the full Portal.

### Suggested next move

Show exactly one concise presentation-only suggestion derived from existing authoritative state.

Examples:

- hunger + upcoming time window → consider food;
- low energy → rest;
- lecture approaching → head there;
- no urgent event → free campus time.

The suggestion must not mutate state, predict grades, award rewards or create streak pressure.

Keep UI game-like and mobile-first.

## Task 3 — visual-vs-authoritative location assertion

Add/retain a browser assertion proving that after cosmetic visual walking to another venue, Campus Life still reports the server-authoritative venue until server travel occurs.

## Task 4 — screenshots

Capture desktop/mobile CI screenshots for:

1. pending Wahala;
2. non-neutral choices;
3. resolved Wahala/recent story;
4. updated Campus Life contextual screen.

Do not expose private identifiers.

## Task 5 — documentation correction

The merged README/implementation status contain stale status text.

Update them accurately:

- Phase 3 merged at `c37500c...`;
- Phase 3.1 merged at `f3edf1b...`;
- Phase 4 merged at `51971dd...`;
- Phase 4.1 is the current acceptance patch;
- production/device/content gates remain open.

Remove stale current-status statements such as:

- Phase 3 is being validated;
- Phase 3 is under branch validation;
- Phase 3.1 is only on a focused branch;
- no Phase 4 started;
- Phase 4 is under review;
- Phase 3 academics is under validation.

Do not rewrite historical review documents that intentionally record their historical checkpoint.

## Preserve Phase 4 architecture

Do not alter the core model:

- `AcademicTerm.minute` is the sole advancing game clock;
- User-first locking remains;
- session revalidation remains inside consequential transactions;
- academic/life writes remain atomic;
- life metrics remain bounded;
- authoritative venue checks remain;
- life/Wahala receipts remain idempotent;
- one-pending occurrence and cooldown budgets remain;
- offline life mutations remain refused;
- private APIs remain no-store;
- PWA private-route exclusions remain;
- academic anti-cheat remains.

Do not rebalance life/Wahala values unless a genuine defect requires it.

## Required regression coverage

Preserve:

- zero-stat recovery/no softlock;
- sleep crossing/missing lecture;
- food venue authority;
- cosmetic movement non-authority;
- academic → life processing;
- life → academic processing;
- concurrent academic/life commands;
- concurrent Wahala choice;
- immutable finalized occurrence;
- deletion cascade;
- strict client-authority rejection;
- no client weather authority;
- private cache/public-route isolation;
- Phase 3/3.1 semester/carryover/retake browser journeys.

## Validation

Run the complete existing pipeline plus the new focused browser acceptance:

- lint;
- typecheck;
- unit/domain tests;
- PostgreSQL integration;
- academic tests;
- life/Wahala tests;
- concurrency;
- migration upgrade;
- PWA tests;
- desktop/mobile Playwright;
- daily-life E2E;
- non-neutral Wahala E2E;
- academic journeys;
- constrained-network tests;
- production builds;
- world budgets;
- dependency audit;
- CodeQL;
- Semgrep;
- full-history TruffleHog;
- Trivy web/API;
- container smoke;
- SBOM;
- Bicep compile.

Never call a skipped or unavailable check passed.

## Definition of done

Phase 4.1 is complete only when:

- browser proves a non-neutral Wahala resolution;
- the choice advances the canonical academic clock;
- effects apply once;
- occurrence persists resolved;
- refresh preserves resolved history;
- Campus Life shows authoritative current venue;
- Campus Life shows next academic event;
- Campus Life shows carryover context when applicable;
- Campus Life shows one contextual next-move suggestion;
- cosmetic visual location remains non-authoritative;
- desktop/mobile evidence exists;
- README/status accurately describe merged Phase 3/3.1/4;
- all prior security/regression checks remain green.

## Final report

The PR/final report must include:

1. base/head commits;
2. exact files changed;
3. Wahala browser scenario;
4. chosen non-neutral event/choice;
5. academic minute before/after;
6. life metric/revision evidence;
7. occurrence persistence;
8. Campus Life context additions;
9. authoritative venue proof;
10. next-event/carryover/suggestion behavior;
11. documentation corrections;
12. unit/PostgreSQL test count;
13. Playwright count;
14. CodeQL/Semgrep/Trivy/secrets/dependency results;
15. remaining human gates;
16. whether Phase 5 local development is safe.

Do not merge automatically.

Stop for review.
