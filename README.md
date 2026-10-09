# CampusWahala

The playable digital world of African university life. Phase 0 foundation and a guest exploration slice; not a production launch.

## Run locally

Requires Node 22–24. Use `npx pnpm@10.32.1` wherever `pnpm` is shown if pnpm is not installed.

1. `pnpm install`
2. `pnpm db:generate`
3. `pnpm dev`
4. Open http://localhost:3000 (marketing), http://localhost:3001 (game), http://localhost:3002 (admin boundary). API: http://localhost:4000/health/live.

Default local storage is bounded, in-memory and temporary. No database, cloud credentials, GPS or payments are needed. A restart loses guests. Guests expire after 24 hours. Reloading the game resumes the guest using an HttpOnly cookie. Nothing earns money, XP, grades or competition points.

For local production output, run `pnpm build`, then start the API with `pnpm --filter @campuswahala/api start` and each frontend with its `start` script in separate terminals. Frontend scripts prepare and run Next's standalone output. Root `.env.example` is a reference: export environment variables in the shell; the Nest API does not implicitly load a root `.env` file.

## Containers

`docker build -f Dockerfile.web --build-arg APP=marketing -t campuswahala-marketing:local .` builds a non-root standalone frontend. Use `APP=game` or `APP=admin` for other shells. Supply public site/game origins as build arguments and game `GAME_ORIGIN`, `API_INTERNAL_URL`, `APP_ENV` at runtime. `docker build -f Dockerfile.api -t campuswahala-api:local .` builds the API. Its production runtime requires explicit secure PostgreSQL/origin/secret configuration. Pin promoted images to digests; the development base tags receive security updates through rebuilds. No Azure resources are deployed by these commands.

## PostgreSQL mode

Set `POSTGRES_PASSWORD` to a local password in your shell; `docker compose up -d`. Set `DATABASE_URL` to your local PostgreSQL connection string, `PLAYER_STORE=postgres`, and `SESSION_SECRET` to at least 32 random characters. Run `pnpm db:migrate`, then `pnpm dev`. Versioned SQL migrations are supplied and are not applied automatically at application boot. Readiness checks the connection. Production refuses memory storage, localhost origins and missing secrets. Entra login and production hosting remain unimplemented.

## Checks

`pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`. Install Chromium with `pnpm exec playwright install chromium`, then `pnpm test:e2e`. PostgreSQL integration tests run when `TEST_DATABASE_URL` is set to a disposable migrated database; never point it at production.

## Structure

Five applications and eleven shared packages follow the bounded contexts in [architecture](docs/architecture.md). [Implementation status](IMPLEMENTATION_STATUS.md) distinguishes implemented behavior from designs and future work. Start with [build plan](docs/build-plan.md), [security](docs/security.md) and [domain model](docs/domain-model.md).

Campus names come from the supplied brief. Programme durations, layouts, locations, schedules and cultural content are explicitly unverified gameplay fixtures. This is not a campus navigation or official academic service.
