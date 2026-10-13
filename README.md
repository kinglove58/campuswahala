# CampusWahala

Phases 0–4.1 are implemented and merged. Phase 3 merged at `c37500cf95c2296581350ca346b95de3211b998a`, Phase 3.1 at `f3edf1b5ca7ac598eb73d683339f88e30c71fb64`, and Phase 4 at `51971dd7c9f5af932b45052b7b2d3774e2d71669`. Phase 4.1 merged at `0e4bd439d152b74499d491ace432a55d85e2699a`; see [review notes](docs/phase-4.1-review.md). Phase 4.2 visual world and navigable interiors is the current reviewer-owned assignment in [ACTIVE_PHASE.md](docs/codex/ACTIVE_PHASE.md). Production, device and content gates remain open. Phase 5 has not started. Phase 4.2 [baseline and original source-art checkpoint](docs/phase-4.2-review.md) is blocked at the M1 art-quality gate; the visual-world/interior upgrade is not complete.

The playable digital world of African university life. FUTA, OAU and UNILAG share validated virtual-world manifests and CW Pocket. Authenticated players have private academic simulation, daily-life metrics and contextual fictional Wahala on one server-owned game timeline. Simulation courses, housing and compressed geography are game representations, not official university records or physical navigation. This is not a production launch.

## Run locally

Requires Node 22–24. Use `npx pnpm@10.32.1` wherever `pnpm` is shown if pnpm is not installed.

1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm dev`
4. Open http://localhost:3000 (marketing), http://localhost:3001 (game), http://localhost:3002 (admin boundary). API: http://localhost:4000/health/live.

Default local storage is bounded, in-memory and temporary. No database, cloud credentials, GPS or payments are needed. A restart loses guests. Guests expire after 24 hours. Reloading the game resumes the guest using an HttpOnly cookie. Guests create no durable academic state and nothing earns money, XP or competition points. Persistent private simulation grades require PostgreSQL and an authenticated durable character.

For local production output, run `pnpm build`, then start the API with `pnpm --filter @campuswahala/api start` and each frontend with its `start` script in separate terminals. Frontend scripts prepare and run Next's standalone output. Root `.env.example` is a reference: export environment variables in the shell; the Nest API does not implicitly load a root `.env` file.

## Containers

`docker build -f Dockerfile.web --build-arg APP=marketing -t campuswahala-marketing:local .` builds a non-root standalone frontend. Use `APP=game` or `APP=admin` for other shells. Supply public site/game origins as build arguments and game `GAME_ORIGIN`, `API_INTERNAL_URL`, `APP_ENV` at runtime. `docker build -f Dockerfile.api -t campuswahala-api:local .` builds the API. Its production runtime requires explicit secure PostgreSQL/origin/secret configuration. Pin promoted images to digests; the development base tags receive security updates through rebuilds. No Azure resources are deployed by these commands.

## PostgreSQL mode

Set `POSTGRES_PASSWORD` to a local password in your shell; `docker compose up -d`. Set `DATABASE_URL` to your local PostgreSQL connection string, `PLAYER_STORE=postgres`, and `SESSION_SECRET` to at least 32 random characters. Run `pnpm db:migrate`, then `pnpm dev`. Versioned SQL migrations are supplied and are not applied automatically at application boot. Readiness checks the connection. Production refuses memory storage, localhost origins and missing secrets. For durable local demo accounts set AUTH_PROVIDER=local explicitly. Default is disabled. Entra adapter configuration is available; no tenant is provisioned and live Entra sign-in remains unverified.

## Checks

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Install Chromium with `pnpm exec playwright install chromium`, then `pnpm test:e2e`. PostgreSQL integration tests run when `TEST_DATABASE_URL` is set to a disposable migrated database; never point it at production.

## Structure

Five applications and eleven shared packages follow the bounded contexts in [architecture](docs/architecture.md). [Implementation status](IMPLEMENTATION_STATUS.md) distinguishes implemented behavior from designs and future work. Start with [build plan](docs/build-plan.md), [security](docs/security.md) and [domain model](docs/domain-model.md).

Campus names come from the supplied brief. Programme durations, layouts, locations, schedules and cultural content are explicitly unverified gameplay fixtures. This is not a campus navigation or official academic service.

## Phase 0.5 hardening

Apply `pnpm db:migrate` before using existing local PostgreSQL. The additive migration removes academic arithmetic and adds an ordered expiry index without rewriting guests. After build, `pnpm --filter @campuswahala/worker start` with the same exported database configuration cleans expired guests at startup/every minute, at most 5,000 per sweep. Local memory remains simple and ephemeral.

Nonlocal API requires independent SESSION_SECRET and BFF_SERVICE_SECRET. Nonlocal game BFF requires independent BFF_SERVICE_SECRET, NETWORK_HMAC_SECRET and EDGE_SERVICE_SECRET, plus explicit GAME_ORIGIN/API_INTERNAL_URL and a signed trusted-ingress assertion. It refuses unsigned ingress until the future private bridge is implemented. Local loopback startup needs no real secrets. ADRs 005–007, [supply chain](docs/supply-chain.md) and [infrastructure](docs/infrastructure.md) describe rotation and staging gates. See the Phase 1 review and updated identity/publication decisions.

Playwright owns its API/game/marketing servers (marketing test port 3100) and refuses occupied test ports. Set CAPTURE_VISUALS=1 for optional landing/world/phone screenshots; functional security tests omit those captures by default.

The retention worker validates only APP_ENV, PLAYER_STORE and DATABASE_URL. Do not provision session or ingress signing keys to its production identity; grant separately reviewed least-privilege cleanup/intelligence database permissions. It also deletes pending accounts and expires login attempts/sessions/conversion receipts.

## Phase 1 local development

Apply all four versioned migrations before starting PostgreSQL mode. Migration 003 adds normalized UUID catalogue, identity/privacy/sessions, durable characters, guest conversion receipts and provenance/version/policy/feedback tables. It seeds only labelled demo academic records so existing guest choices can convert; it creates no verified facts. Migration 004 adds explicit event expiry, source failure details and relational academic-position guards. The upgrade test first installs Phase 0.5, seeds a guest and then runs real migrate deploy to preserve it.

`AUTH_PROVIDER=local` enables a clearly labelled shared demo identity only in APP_ENV=local. In the phone open Account & privacy -> Continue to sign in. The guest cookie survives login, then an owner-bound transaction saves the same character. An existing account character triggers a safe guest conflict: choose its resume or temporary guest exploration; the guest is preserved. Accounts are private, under-18/unknown privacy is strict, and deletion revokes immediately then removes account data through the worker. Authentically configured Entra uses code/PKCE/state/nonce/signature checks and server-held tokens; .env.example lists configuration names. No Google button, tenant, credentials or Azure deployment is created.

Set `INTELLIGENCE_ENABLED=true` on the database-configured worker to begin permitted official-source research. It discovers FUTA/OAU/UNILAG public URLs, checks robots and safe DNS-pinned fetching, and extracts observed university names and a small exact-text official-landmark registry. No slang, navigation or academic content is fabricated. Policy automatically publishes eligible evidence, holds contradictions and expires stale data. The Guide & feedback phone app and marketing `/guide/<campus>` read only published, unexpired facts. Fixture pages are noindex and removed from the sitemap; thin guides remain noindex. All existing fixture warnings remain.

Read [Phase 1 review](docs/phase-1-review.md), [identity](docs/identity.md), [intelligence](docs/campus-intelligence.md), [publication policy](docs/publication-policy.md), [privacy/age](docs/privacy.md) and [actual CI triage](docs/ci-triage-phase-1.md). Local tests do not establish production readiness. Shared rate/replay/pacing, private ingress/egress/database roles, configured Entra/MFA, monitored cleanup and clean scans remain public-release gates. Read [Phase 2 review](docs/phase-2-review.md), [world engine](docs/world-engine.md) and [ADR 010](docs/decisions/010-versioned-virtual-world.md) for historical Phase 2 validation and remaining gates.

Local Phase 1 validation passed 82 tests and 10 desktop/mobile browser cases. Both final runtime images use Alpine, passed non-root smoke and returned zero HIGH/CRITICAL Trivy 0.75.0 findings including unfixed findings; the API native Prisma engine was also tested against PostgreSQL. Complementary strict Semgrep Community scan passed. At the historical Phase 1 checkpoint, remote CodeQL required corrected repository permissions/settings. Phase 2.5 runs now successfully upload CodeQL analysis on the public repository; see the current review for exact commit/run evidence.

## Phase 2 local world

Apply the fifth migration, `202610090005_world_state`, after the four Phase 1 migrations. Account world state stores validated safe spawn IDs and enumerated appearance; guests remain ephemeral. `/play?campus=futa`, `/play?campus=oau` and `/play?campus=unilag` select a world. Marketing never loads Phaser.

`pnpm build` compiles and validates manifests. Run `pnpm check:world-budgets` after build. World names remain fictional until live, published, non-stale catalogue facts match configured identity bindings. Geometry is **compressed campus geography**, never real GPS navigation. The isolated research report records actual robots/size/timeout failures and eligible UNILAG library publication; it is not imported as production seed data.

CW Pocket includes virtual map/waypoints, published guide/feedback, appearance, private account controls, cosmetic inventory, updates and settings. Authenticated Computing/Engineering simulation players have a private Portal, timetable, courses, assignments, tests/exams, results and progression; guests retain demo content. There are no rewards, money, commerce, advertising, chat or multiplayer. Phase 3 is merged at `c37500c`; Phase 3.1 is merged at `f3edf1b` with browser acceptance evidence. Documented production/content/device gates remain open.

## Phase 2.5 hardening

Apply migration 006 after the merged Phase 0–2 migrations. Subject/property identity preserves published history; bounded campus/category/subject catalogue cursors replace a global limit. Critical information needs literal official authority. Existing-account guest conflicts preserve the temporary journey and reserve conversion ownership. Deletion cleanup is bounded and safe across workers.

World v2 uses canonical identities and original per-zone art; exact immutable v1 manifests/assets remain served. The production game registers a public-only service worker. Open worlds/maps continue cosmetically through brief network loss; offline reload gets a static fallback. Private profiles, sessions, guests, guide facts, latest pointers and mutations are not cached or queued.

Controlled research is separate from CI: dispatch `.github/workflows/research.yml` with a listed campus, or explicitly push `docs/research/request.json` on an owner-controlled `codex/research/**` branch with a `research:` commit. The request permits only `campus` and fixed `sourceSet=curated-public-2026-10-10`. Disposable PostgreSQL and read-only GitHub permissions produce artifacts, never production imports. Ordinary PRs/CI do not crawl.

Physical Android acceptance remains a human gate: [device procedure](docs/mobile-device-acceptance.md). See ADRs 011/012 and the Phase 2.5 review for exact execution evidence. Historically Phase 2.5 added no academics, rewards or monetization; Phase 3 academics is described below.

## Private academic simulation (Phase 3)

Use disposable/local PostgreSQL, apply migrations through 007, and configure the existing local-only identity provider (`AUTH_PROVIDER=local`, `APP_ENV=local`, `PLAYER_STORE=postgres`, `DATABASE_URL`, independent local session secret). Create a Computing or Engineering sample character and save the guest journey through Account. In Pocket Portal start a simulation semester. Courses use CW codes and are game content, not official university curriculum or real credentials.

Academic travel changes server-owned presence and consumes game minutes. Map walking/shuttles remain cosmetic. At a study venue choose course study/assignment actions; submit before the game deadline. Use Schedule and Wait to next academic event, travel before its start, then attend/take the eligible action. End day deliberately misses crossed events. At semester end finalize results and view GPA/CGPA, carryovers and the progression decision. Definitions/history are snapshotted and private. Offline actions are disabled; explicitly retry an uncertain command with its original receipt key. No background mutation queue.

[Phase 3 architecture and validation](docs/phase-3-review.md) · [ADR 013](docs/decisions/013-server-authoritative-academics.md).

[Phase 3.1 browser acceptance review](docs/phase-3.1-review.md).

Phase 4 campus life and Wahala merged at `51971dd`; apply migration 008. Its post-merge CI passed all jobs. [Historical Phase 4 review](docs/phase-4-review.md) records architecture and earlier acceptance fixes. Phase 4.1 merged at `0e4bd439`; it proves non-neutral Wahala consequences and adds a concise authoritative Today view. Its [post-merge CI](https://github.com/kinglove58/campuswahala/actions/runs/38115280934) passed all five jobs. Phase 5 has not started.

### M1 in-house character prototype (review-only)

The supplied ZIP has been checksum-verified and preserved outside runtime. [M1 source and Phaser evidence](docs/phase-4.2-m1-intake-review.md) document the new editable vector/OpenRaster candidate, directional animation and canonical Appearance mapping. It is an isolated art laboratory, not the production character/room upgrade. ART REVIEW BLOCKER and human visual approval remain; PR #17 is draft and M2?M6/Phase 5 are not started.

Earlier PR #17 studies are documented in the [historical M1 refinement review](docs/phase-4.2-m1-refinement-review.md). Reviewer decision6148790041 selected **B - Painted Campus as direction only**. The current [B-only final M1 proof](docs/phase-4.2-m1-painted-review.md) includes editable SVG/ORA, all 768 Appearance values validated, four player looks, two fictional NPC variants and native played Phaser evidence. Final M1 visual approval remains open; draft/unmerged, no production character promotion, no M2-M6 or Phase 5.
