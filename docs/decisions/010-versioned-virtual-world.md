# ADR 010: Versioned virtual worlds and safe account locations

Status: proposed for Phase 2 review. No public release or Phase 3 authorization.

## Decision

A shared, renderer-independent `WorldEngine` consumes validated `WorldManifest` content. Campus differences live in content configuration. Phaser renders the visible zones; React owns semantic controls and the fictional CW Pocket overlay. Neither renderer nor browser movement owns durable truth or rewards.

Compile game geometry and local asset references at build time and validate again at API boot. Compile verified identities separately from the Phase 1 published catalogue at request time. Immutable geometry must not freeze a fact beyond its publication lifetime. A live no-store information projection supplies current labels and provenance; absent, held, stale or failed information falls back to explicitly fictional venue names.

All geometry is **compressed campus geography**. Coordinates, buildings, paths and illustrations are gameplay approximations, never survey measurements, real GPS directions or official opening hours. A factual identity does not verify its drawn location.

Account persistence accepts only a known campus, exact world revision, safe spawn ID and enumerated cosmetic appearance. The server derives zone and owner from the manifest and authenticated principal. Coordinates and owner IDs are rejected. The user/session check is repeated while holding the user row lock, serializing with conversion/deletion. Account deletion cascades to world state; revoked or deleted accounts cannot resume. Guests never write this table.

## Version and cache contract

- `/v1/worlds/:campus/versions/:version`: public game geometry, immutable cache, ETag; no accounts, candidate facts or source processing metadata.
- `/v1/worlds/:campus/latest`: allowlisted short-lived pointer.
- `/v1/worlds/:campus/information`: fresh published identity projection, no-store.
- `/v1/account/world`: private, no-store; signed BFF binding and existing origin/rate/replay controls.

Before releasing changed geometry, increment the campus world version and update the allowlisted served revision. Never overwrite an already released immutable version. Phase 2 supplies the initial, unreleased v1 only; historical revision hosting and an editor remain future work. Existing spawn IDs survive when valid; removed IDs fall back to the current default, with derived zone/version corrected on read.

## Consequences

Static geometry stays outside PostgreSQL. The only new table is `PlayerWorldState`. A manifest database and per-object rows are unnecessary for this scope. Versioned local assets can later move to a reviewed CDN; gameplay makes no remote image requests.

Typed intents/events are extension ports, not authorization. Future academics, rewards, economics, multiplayer and presence must introduce server authority independently. Visual NPCs, transport, time, battery and demo inventory cannot award durable resources.

Production release still depends on the Phase 1 ingress/egress, shared abuse controls, provider, database-role, operational and privacy gates. This decision does not relax them.
