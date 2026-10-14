# Current Phase 2.5 additions

Phase 2 was merged as `9427141`. Current world/schema v2 uses canonical subject UUID + published property bindings; the exact three Phase 2 v1 manifests remain served alongside v2. Names and geometry remain separate: verified identity never verifies a drawn coordinate. No published facts or source search output are seeded as production data.

Roof style and waterfront treatment are manifest artDirection content, not campus-specific engine branches. Actual per-zone SHA-versioned SVG bundles load for visible zones. NPC manifest budget is 32 total/6 per zone; render/update budget is 16 nearby active NPCs. Inactive/off-screen NPCs skip movement updates. Art is original vector/procedural work and replaceable independently of engine logic.

Compressed ceilings: manifest 100 KiB, all campus art 400 KiB, individual zone 350 KiB, game JS 650 KiB gzip (conservative sum of all static JS, including lazy chunks), first-campus envelope 1.5 MiB. `check:world-budgets` reports real raw/gzip bytes and integrity; browser throttling reports actual encoded transfer separately. Neither establishes physical 30 FPS.

Public-only PWA cache preserves hashed assets/immutable geometry, never latest pointers, guide facts, private responses or mutation queues. Open exploration/map works offline; reload uses an identity-free static fallback. See ADR 012. Human physical gate: [mobile-device-acceptance](mobile-device-acceptance.md). Research workflow is controlled dispatch/explicit owner opt-in, no longer tied to the obsolete Phase 2 branch.

The following sections describe the original Phase 2 architecture; where v1/budget/research details differ, the current rules above and ADRs 011/012 apply.

# Virtual Campus Engine

## Content pipeline

`packages/game-engine/src/campuses.ts` holds the three content configurations. `createCampusWorld` builds geometry and `validateWorld` checks it. `pnpm build` emits validated manifests in ignored `artifacts/worlds/`. The API compiles the same geometry once at boot. Published catalogue records are matched by campus, category and fact key in `compileWorldInformation`; the client receives a small current identity projection, not normalized source-processing tables.

The pipeline is:

1. Game configuration + local art references → validated versioned geometry.
2. Phase 1 published, non-stale catalogue + geometry identity bindings → current world information.
3. Geometry + current information → rendered campus and semantic phone map.

This split prevents a long-lived geometry cache from retaining a withdrawn/stale verified label. Failed information refreshes clear verified labels. Geometry and local assets remain usable during a temporary connection interruption once loaded. There is no offline account write queue or offline reward mechanism.

## Manifest format

```ts
WorldManifest {
  schemaVersion: 1;
  campusId: 'futa' | 'oau' | 'unilag';
  version: number;
  sourceRevision: string;
  geography: 'compressed campus geography';
  bounds; defaultSpawnId; palette;
  zones; roads; paths; buildings; venues; spawnPoints;
  transportNodes; interactionPoints; decorations; npcSpawns; assetBundles;
}
```

IDs are globally unique within a manifest. Zones have bounded rectangles and asset-bundle references. Buildings have silhouettes, collision bounds and safe entrances. Venues reference buildings/zones/spawns, define presentation and cosmetic opening hours, and have a fictional identity or an approximate representation bound to a published fact key. Decorations remain fixtures and can carry future placement IDs. NPCs define role, appearance, active hours, patrol/idle/wander/stationary pattern, dialogue and an interaction target. Routes, transport destinations, source bindings and spawn points must resolve before a build succeeds.

No candidate status, administrative processing details, account attributes or arbitrary executable actions belong in a public manifest. A matching published fact verifies its identity; the geometry stays approximate. Unmatched bindings display fictional fallback names.

## Engine and renderer

`WorldEngine` owns local position, path, zone, approach state, cosmetic time/battery and typed event subscriptions. Movement uses capped frame deltas, normalized keyboard direction, collision/sliding and bounded 32px grid A\* for tap destinations. Buildings and world edges block movement. Traversable lawns remain available alongside illustrated roads/walkways. There is no joystick requirement.

The renderer lazily imports Phaser, follows the player with bounds and smooth camera movement, adjusts viewport/zoom, renders/unloads visible zone object containers with a margin and loads versioned art only as needed. Trees have a procedural fallback. Labels are refreshed without recreating the engine. Reduced motion disables smooth camera follow and decorative NPC movement. Semantic destination/interaction controls accompany the canvas.

The runtime emits `PLAYER_ENTERED_ZONE`, `PLAYER_APPROACHED_VENUE`, `PLAYER_ENTERED_VENUE`, `PHONE_OPENED`, `TIME_PERIOD_CHANGED`, `TRANSPORT_USED`, `NPC_INTERACTED` and `INTENT`. Commands include `ENTER_VENUE`, `TALK_TO_NPC`, `OPEN_SERVICE`, `VIEW_NOTICE`, `TRAVEL` and `REST`. Configured venues/NPCs/notice boards/shuttles work; commands without a configured Phase 2 activity are extension contracts only.

Library, lecture and hostel venues show illustrated mini-interior panels; food/admin/clinic/sports venues use interaction panels. These are compact venue experiences, not separately navigable interior maps. Transport checks local proximity and configured routes, jumps to a safe spawn and persists only that safe ID for accounts. It charges nothing.

Time starts Monday 07:00, advances one game minute per 1.5 seconds of capped simulation time, includes week and a null semester context, and resets each world session. It controls inexpensive time overlays, cosmetic opening state, NPC visibility, phone time and clear/cloudy/rain demo weather. It is not academic or economic authority. Rain is drawn with a small fixed number of lines. The phone battery bottoms out at 20%; it cannot lock a player out.

## Assets and budgets

Asset metadata lives separately in `assets.ts`; the local production-compatible paths contain a 12-character SHA-256 prefix and full hash metadata. The first environment asset for each campus is 368 bytes. Build checks verify exact bytes/hash. Buildings/avatars/phone/effects are code-rendered, so they do not require large bitmap sheets. Future bundles can be split by zone without changing the engine.

Budgets: 160,000 bytes per manifest, 65,536 bytes of initial campus art. Current manifests: FUTA 25,309 bytes; OAU 16,284 bytes; UNILAG 17,459 bytes. These budgets exclude JS runtimes. The local production Phaser chunk is approximately 1.19 MB raw / 314 KB gzip; it is downloaded only for the game. Marketing output is checked for Phaser signatures, and the game retains a dynamic import. This is not a 314 KB total-app claim.

Target rendering is 30 FPS. `performance.measure` records manifest, world boot and asset load timings locally. DOM diagnostics expose average frame timing, asset failure count and a memory-pressure warning when Chromium's optional heap measurement exists. No diagnostic is transmitted or user-linked. No third-party tracking or telemetry consent bypass is introduced. Any future linked analytics requires the existing consent policy.

CI does not benchmark FPS. Browser tests use desktop Chrome and Pixel 7 emulation. Physical low-tier Android, constrained Nigerian mobile networks, thermal behavior, long-session heap stability and screen-reader usability still need manual testing.

## Manual device review still required

On a physical mid/low-tier Android phone, record device/browser/viewport, cold and warm boot time, manifest/art/Phaser transfer size, 30-second frame timing during movement/rain, heap warning availability, touch accuracy, phone scroll/focus/close behavior and recovery after network loss. Repeat at 360×640, 390×844 and a desktop viewport; inspect larger desktop zoom bounds. Test reduced motion, muted/unmuted audio and keyboard destinations/interactions. Report real measurements; do not extrapolate emulated CI timings to a physical phone.

## Run and review

Apply migration `202610090005_world_state` after all Phase 1 migrations for PostgreSQL mode. Default memory mode supports cheap guests; durable account behavior requires PostgreSQL and the existing explicitly enabled local provider or configured Entra.

Entry points: `/play?campus=futa`, `/play?campus=oau`, `/play?campus=unilag`. Optional `destination=venue-1` must match the chosen manifest; unknown identifiers are ignored/rejected by catalogue allowlists. All private game shells remain noindex.

`pnpm check:world-budgets` runs after build. `CAPTURE_VISUALS=1 pnpm test:e2e` writes optional world/phone screenshots to ignored `artifacts/`. Existing lint, types, security/PostgreSQL/upgrade/browser checks remain in CI. The isolated research job uses an ephemeral database and the real Phase 1 pipeline; it does not provision or write a production catalogue. It is opt-in on this branch with a `research:` commit prefix; ordinary code/docs commits retain all required checks without repeating research.

## Additive M3 exterior art revision

The current renderer uses exterior art manifest v1 alongside the unchanged schema-2/world-v2 geometry. This does not silently replace published v1/v2 JSON or their original hashed zone assets; academic snapshots, venue/spawn IDs, collisions and safe-location contracts remain unchanged. Original source/export instructions are in [art/exteriors](../art/exteriors/README.md). Six 256×256 architecture frames and sixteen 128×128 props share one 1024×768 hashed local SVG atlas per selected campus (3 MiB decoded RGBA estimate).

Static paving/ground is batched by existing visible zones; independently owned upright sprites sort at 4000 + feet Y, matching characters. Foreground crowns/roofs become translucent where their bounds overlap the player. Pure decoration placement excludes roads/paths, buildings, spawn and interaction clearance; these props are cosmetic, not new colliders. Chunk exit disposes objects, scene shutdown disposes the exterior texture. A marked geometry/label fallback preserves movement legibility when the atlas request fails.

Existing public immutable `/world-assets/` delivery/PWA allowlists handle the new atlas. No private state, game clock, progression, server presence or consequential mutation is stored in art or inferred from cosmetic movement. M3 remains a visual review checkpoint; no navigable interior or later-milestone completion is implied.

The M3 sprite/Graphics-only scene explicitly uses Phaser Canvas rendering. Controlled Chromium145 software-rendering captures were substantially faster than WebGL; physical Android remains an open gate. This changes presentation only: approved B source, camera, movement/physics and gameplay authority are retained. Twelve-unit sprite overscan bounds off-screen work; no per-zone floor texture cache is retained.
