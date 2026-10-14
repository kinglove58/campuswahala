# PR #17 — M3 original campus exteriors

Authorized by [reviewer 6162045147](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6162045147).
M1 and M2 are approved. This checkpoint implements **M3 only** and stops for its
visual/code/CI review. Branch `codex/phase-4.2-visual-world`; M3 start
`e0c2dd6072c7c07acdfb0d34b119a8ca668ac4e0`; PR base `7eded507ddb1876c77d25ecde94446667388123a`;
inspected master `3037d77c5b14a33fda3f4454dc836b01b38dfd5d`. Final exact head, files,
CI runs and production metrics are recorded in the PR body after terminal evidence.

## Version and compatibility decision

Use an **additive exterior art v1 manifest**, explicitly coupled to the current schema-2/world-v2 renderer, rather than altering academic world geometry or immutable published v2
semantics. No migration, changed world/venue/spawn IDs, new colliders, altered travel
costs, account Appearance mapping, clock, receipts, balancing or server endpoint.
Original v1 JSON and v2 factory/zone SVGs remain byte-identical. The new art manifest targets current v2 presentation; v1 remains served as its original legacy data, not reinterpreted as a new schema. The existing public
hash-addressed `/world-assets/` cache boundary and immutable headers carry new art;
private APIs and latest pointers remain excluded. Rollback keeps original assets and
requires no database rewrite. Geometry remains compressed fictional campus geography.

## Original visual source and runtime

The editable [vector master](../art/exteriors/master.mjs) generates six dimensional
building archetypes and sixteen reusable prop frames. Pitched terracotta roofs and
lush groves distinguish FUTA; heavy terraces, shaded concrete bays and restrained
courts distinguish OAU; light canopies, blue-green glass/palms and fictional waterfront
styling distinguish UNILAG. One renderer reads campus pack palettes/configuration;
no campus branches in React/Phaser. Door/window/pitched or terrace planes, facade
storeys, verandas, library frontage, lecture entry, food awnings, paving joints,
curbs/crossings/lane dashes, trees/shrubs/planters, benches, bins, notices, lamps,
cycles, shelter/kiosk and parked cars/shuttles share the approved B lighting/palette.

One 1024×768 local atlas per selected campus: **3,145,728 decoded RGBA bytes**.
FUTA/OAU/UNILAG exports: **44,277 /39,035 /36,833 raw bytes**,
**3,566 /3,358 /3,274 gzip bytes**. Frames/source/content hashes are reproducible.
Six building cells (256×256), sixteen prop cells (128×128) have explicit ground pivots.
Static paving is batched per visible chunk; upright sprites sort independently by
feet Y, including building/tree occlusion with a translucent player-overlap treatment.
If the art request fails, a marked footprint/label fallback retains collision legibility and movement; no rejected artwork is used. Chunk exit destroys its objects/NPCs; scene shutdown removes the selected exterior
texture. At most 100 extra placements per zone, all clear of roads, paths, existing
colliders, spawns and interactions. No decorative collider modifies navigation.

Approved character source/public PNGs, 22-unit/s movement, bounded collision stepping,
fast Map traversal/final ordinary approach, camera 1.3/1.5 defaults, body scale, six
character atlas cache entries, saved appearances and all gameplay authority are retained.
Weather overlays remain cosmetic and existing server-state checks remain enabled.
No new interiors, tap-object auto-walk/confirm flow, social system or Phase 5 code.

## Validation and production evidence

Six new unit cases cover hashes/no executable SVG, frame/decoded/transfer limits,
three architectural configurations, ground-depth order, generated prop clearance,
venue path reachability and unchanged world data. New real browser tests cover all
three campuses on desktop/mobile, immutable atlas headers/bytes, v1/v2 endpoints,
existing Map navigation to the genuine Lecture hall prompt, ordinary movement,
object/NPC/texture caps and zero academic/life/account POSTs. Twelve production
viewport/campus captures and walking movies use normal guest creation with the
**matching campusId**, real keyboard/camera and read-only metrics; no injected scene,
coordinates, poses or authoritative state. The first local comparison iteration had
an incorrect FUTA guest fixture for OAU/UNILAG; those mislabeled local outputs were
rejected and the fixture corrected with explicit renderer campus assertions.

Cold measurement disables HTTP cache and blocks service workers only in its isolated
measurement context. Normal PWA/functional security tests keep service workers.
New bounded raw wall interval mean/p95 diagnostics complement the retained Phaser
smoothed-delta measure; neither video cadence nor emulation proves physical FPS.
Capture overhead is included. Existing M2 baseline is 580,729 default cold bytes,
1,005,751 saved-look bytes, native 360×800 player 75.02px/10.26%, six character
textures, and ~53ms smoothed Phaser delta in one CI sample. Comparisons must distinguish
raw wall intervals from smoothed deltas and report CI/local browser differences.

Local pinned Chromium download failed with empty/corrupt archives. Visual inspection
uses scratch-only npm-distributed Chromium 153 and system FFmpeg, not new project
runtime dependencies or CI substitutions. Local units: **169 passed,13 PostgreSQL
skipped**; full CI is responsible for disposable PostgreSQL/migrations/security.
Local lint/typecheck/build/source verification/budgets/audit pass. Conservative local
all-static JS at this checkpoint: **570,291 gzip bytes**, within the ~625KB target;
final exact-head clean CI figures belong in the PR body. Browser evidence and every
required CI job must be terminal before claiming automated validation complete.

## Open security and human gates

The three existing high-severity CodeQL `js/bad-tag-filter` alerts remain open:
[landmarks.ts:244 #1](https://github.com/kinglove58/campuswahala/security/code-scanning/1),
[intelligence.ts:32 #2](https://github.com/kinglove58/campuswahala/security/code-scanning/2),
[intelligence.ts:67 #3](https://github.com/kinglove58/campuswahala/security/code-scanning/3).
Separate focused safe HTML extraction/grounding remediation and tests are required
before M6/final Phase 4.2 approval. No suppressions, dismissals or silent waivers;
green CodeQL analysis/upload is not a zero-alert result. Existing Semgrep >1MiB size
skips remain disclosed. Physical low/mid-range Android touch/FPS/network/memory/
thermal/long-session tests remain unperformed human release gates.

**Stop at M3 visual review. PR #17 remains draft/open/unmerged. M4–M6 and Phase 5
remain unstarted.** Passing CI cannot approve art or authorize the next milestone.
