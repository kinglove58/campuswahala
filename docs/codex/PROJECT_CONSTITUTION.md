# CampusWahala Project Constitution

This file contains durable rules for all future Codex implementation phases. It is reviewer-owned.

## Product

CampusWahala is a persistent browser/PWA digital university-life world.

Core product principle:

> Your campus. Your choices. Your wahala.

It is a stylized game/simulation, not official university infrastructure, real navigation, a university transcript system or a medical service.

Initial campuses are FUTA, OAU and UNILAG using one shared engine and data-driven campus/world packs.

## Authority

The hostile browser renders UI/world state and sends intents.

The server owns any durable or consequential state, including:

- account ownership and sessions;
- academic time and authoritative venue/presence;
- enrollment, attendance, assignments, tests, exams and results;
- GPA/CGPA, carryovers and progression;
- Campus Life metrics;
- Wahala occurrences and effects;
- future money, rewards, inventory value, competition results or commerce.

Never trust Phaser coordinates, local storage, browser clocks or client-supplied values as authoritative proof.

## One timeline

During an active simulation term, `AcademicTerm.minute` is the only advancing game-life clock.

Life, academics and future time-based systems must not create competing clocks.

Any cross-context time mutation must be transactional and must process crossed academic/life consequences exactly once.

## World

Keep one renderer-independent shared world engine with versioned data-driven campus manifests.

All geometry is compressed fictionalized campus geography, not real GPS navigation.

Verified factual identities are separate from approximate game geometry.

Visual movement is cosmetic unless a server command establishes authoritative presence.

## Academics

Simulation courses use CampusWahala identifiers such as `CW-...` and must never be presented as official FUTA/OAU/UNILAG curriculum unless separately verified and explicitly published as factual information.

Programme/stage progression is configuration-driven. Never assume all programmes use universal 100L–500L arithmetic.

Finalized academic results/history remain immutable.

GPA/CGPA use fixed/integer authoritative components, not browser floats and not simple averages of displayed term GPAs.

## Campus Life

Life state is private game state.

Current durable metrics:

- energy;
- satiety;
- mood;
- wellbeing.

Wellbeing is a game mechanic, not a medical diagnosis.

No real-wall-clock punishment or offline decay. Closing the app must not starve or exhaust the player.

Recovery must remain possible. No permanent softlocks, death mechanic or manipulative streak penalty.

## Wahala

Wahala is contextual fictional game content.

Eligibility must use a bounded typed non-executable DSL. Never use `eval`, `new Function` or arbitrary scripts.

Selection is server-owned. Client weather, GPS, religion, ethnicity, medical traits, private contacts or other sensitive attributes must not control Wahala.

Wahala may affect time, bounded life metrics and allowlisted story flags. It must not directly set grades, GPA, scores, money or valuable rewards.

Use cooldowns/budgets and at most one pending event to avoid spam.

Avoid defamatory claims about named real lecturers, staff, students, businesses or religious leaders.

## Identity, privacy and deletion

Preserve the signed BFF/service-context model, opaque HttpOnly account sessions, PKCE/OIDC boundaries, owner-derived state and private-by-default player data.

Private academic/life data must use `Cache-Control: no-store` and remain excluded from service-worker caches and public SEO/profile/guide routes.

Account deletion must revoke immediately and cascade all private simulation state safely.

Under-18/unknown privacy defaults remain strict. Do not create open stranger messaging without a separately reviewed safety design.

## Offline

Static public world assets may use the existing safe PWA caching boundary.

Never queue authoritative academic, life, reward, financial or social mutations offline.

A lost response may be explicitly retried only with the same idempotency key.

## Campus Intelligence

Public source retrieval must remain permission-respecting and SSRF-safe.

Never bypass robots, login walls, CAPTCHAs, private systems or anti-scraping restrictions.

Critical contacts, fees, deadlines, security/medical information and academic structure require the strongest publication authority defined by current policy.

Research evidence does not become canonical production data automatically.

## Security and concurrency

Preserve:

- User-first locking and documented lock order;
- session revalidation inside consequential transactions;
- strict discriminated command schemas;
- owner-scoped idempotency;
- replay protection;
- bounded receipts/history;
- database constraints for critical invariants;
- additive migrations;
- CodeQL;
- Semgrep;
- Trivy;
- full-history secret scanning;
- dependency audit;
- SBOM;
- Bicep compile;
- non-root container smoke tests.

Never weaken a control just to make a test pass.

## Scope sequencing

Do not pull future systems into an earlier phase.

In particular, unless the active phase explicitly authorizes them, do not add:

- real money or payment providers;
- Campus Cash/economy;
- XP/valuable rewards;
- ads;
- commerce/marketplace;
- multiplayer/open chat;
- reputation/leaderboards;
- real GPS;
- sensitive-personalization systems.

## Testing truthfulness

Never report a skipped/unavailable test as passed.

Browser tests must cross the real browser/BFF/private-API boundary for acceptance slices where the active phase requires it.

PostgreSQL/migration/concurrency tests must use disposable test databases, never production.

Physical Android/device gates remain human gates unless actual device evidence exists.

## Phase advancement

Codex never self-advances.

Only the reviewer updates `docs/codex/ACTIVE_PHASE.md` and `docs/codex/PHASE_HISTORY.md` after reviewing merged code and CI.

Every phase ends by stopping for review.
