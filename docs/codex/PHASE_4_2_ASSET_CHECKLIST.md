# CampusWahala Phase 4.2 — asset production checklist

**Scope:** original assets + implementation artifacts that must exist **in the repository/PR**, not only in a design prompt. Read with `ACTIVE_PHASE.md` and `PHASE_4_2_ART_DIRECTION.md`.

## 0. Production rules

- [ ] Inspect the existing Phaser/world/appearance/asset bundle interfaces before making files.
- [ ] State the actual authoring route: original offline 3D-to-sprites (if usable) **or** original layered 2D/vector sprite pipeline with 3D-inspired shading.
- [ ] Keep editable, license-clean source files and a reproducible export/packing recipe. Generated exports are not substitutes for the source.
- [ ] No copied/reference-game images, tracing, unlicensed commercial sprite packs, hotlinked remote character textures, or hidden paid asset dependency.
- [ ] Do not substitute a prompt claiming images exist for actual production-ready sprite files. The repo must contain usable assets and runtime integration.
- [ ] If rendering/authoring tools are missing, declare blocker and provide a source-proof/limited spike rather than claiming visual acceptance.
- [ ] Give every asset a stable logical ID, version/hash (where served), provenance, dimensions, source path, packed/runtime path and bytes.
- [ ] Keep project binary sizes lean, compressed, modular, lazily loaded; respect the current manifest validation and PWA/public-asset policy.
- [ ] Asset packs are visual only and cannot carry trusted game rewards, location proof or scripts.

## 1. Character core — required Phase 4.2

| Asset ID / category | Required delivery | Acceptance proof |
| --- | --- | --- |
| CHAR-BASE | original player character rig or reusable layered sprite composition source | front/back/left/right silhouette sheet, consistent feet anchor |
| CHAR-IDLE | 4 directional idle animation states | in-game loop + spritesheet/source |
| CHAR-WALK | 4 directional walk animation states | walking GIF/video or frame contact sheet, visible locomotion |
| CHAR-SKIN | all 4 **existing** skin options | side-by-side in-game outfit/skin screenshots |
| CHAR-HAIR | all 4 existing hairstyles: crop, afro, braids, covered | hair remains legible at mobile gameplay size |
| CHAR-HCOLOR | black/brown hair-color mapping | each map updates correct layer |
| CHAR-TOP | lime/clay/blue top mapping | clothes distinct from environment |
| CHAR-BOTTOM | trousers/skirt mapping | no clipping across directions |
| CHAR-SHOES | dark/white shoe mapping | correct stance/foot contact |
| CHAR-ACCESSORY | none/backpack mapping | bag appears on right views with consistent occlusion |
| CHAR-NPC | at least two visibly distinct fictional NPC combinations on same rig | movement, depth and culling evidence |
| CHAR-PORTRAIT | optional close-up portrait/wardrobe view using *same* appearance configuration | no misleading portrait-to-world mismatches |
| CHAR-SHADOW | consistent small contact-shadow visual | no separate expensive lighting system |

**Important:** every serialized Appearance enum combination must work, not just the staged examples.

**Size guidance, not blind technical dictates:**
- start exploring original logical frames around **96×128** or **128×160**, with transparent background and consistent origins;
- 2–4 idle frames and 4–8 walk frames per direction are a useful starting point;
- 1x/2x strategy appropriate for mobile; avoid giant unused atlases and every-outfit Cartesian export;
- prefer bounded layer/palette composition, reusing NPC assets;
- keep images power-of-two-friendly where convenient, max atlas edge by measured device memory budget (suggest inspect 1024/2048 limits, do not assume unlimited textures).

Required export metadata: direction, state, frame count, frame dimensions, pivot/foot contact, scale, source hash, atlas hash, alpha/channel method.

## 2. World architecture — required

Deliver original exterior archetypes with **real scale relative to the upgraded character**:

- [ ] EXT-HOSTEL — residence building, readable door and windows, distinct visual mass.
- [ ] EXT-LECTURE — institutional teaching block, distinct broad facade.
- [ ] EXT-LIBRARY — identifiable calm/study-oriented building.
- [ ] EXT-FOOD — fictional food stall/café form with awning/queue area.
- [ ] EXT-ADMIN — differentiated administration building.
- [ ] EXT-CLINIC — differentiated support/clinic exterior, no real medical claims.
- [ ] EXT-SPORT — pavilion/court signifiers.
- [ ] EXT-SOCIAL — outdoor/common student gathering space.
- [ ] EXT-TRANSPORT — shelter/shuttle.
- [ ] EXT-REFLECTION — optional configured quiet/reflection venue, respectful and neutral.
- [ ] EXT-BACKGROUND — non-interactable scenery building type with collision behavior and no fake venue authority.

At least FUTA/OAU/UNILAG must each show genuinely different architectural treatment through data-driven art directions (not campus-specific React switches).

Rework/validate entrances, colliders, pathfinding, safe spawns and event trigger approaches when footprint changes. Do not change server authoritative venue semantics.

## 3. Exterior prop library — required

- [ ] PROP-BENCH
- [ ] PROP-TREE (at least two canopy variations)
- [ ] PROP-PALM (where art direction makes sense)
- [ ] PROP-PLANTER
- [ ] PROP-BIN
- [ ] PROP-NOTICE
- [ ] PROP-LAMP
- [ ] PROP-SIGN
- [ ] PROP-KIOSK
- [ ] PROP-SHELTER
- [ ] PROP-FENCE/LOW-WALL
- [ ] PROP-PAVING/ROAD/MARKING
- [ ] PROP-PARKED-VEHICLE (fictional non-reward)
- [ ] PROP-BICYCLE
- [ ] PROP-TABLE/CHAIR outdoor

For every prop: footprint, pivot/depth, collision flag, interaction behavior (usually NONE), optional occlusion mask/layer and chunk ownership.

Ground/detail repetition should feel deliberate, not random clutter. Preserve clear routes and semantic destination access.

## 4. Interior scene sources — required

### HOME-01 — navigable hostel room

- [ ] FLOOR-ROOM — original tile/floor material, boundaries.
- [ ] WALL-ROOM — walls, window treatment and optional curtain.
- [ ] BED — reachable anchor, affordance calls existing SLEEP.
- [ ] DESK — reachable anchor, existing authorized study/rest only.
- [ ] CHAIR — decorative/possible accessible anchor, collision matches drawing.
- [ ] WARDROBE — reachable anchor, existing appearance editor.
- [ ] DOOR-EXIT — clearly identifiable interior-to-exterior transition.
- [ ] PERSONAL-PROPS — at least a couple of believable books, shelf, bag, poster **without copying reference art**.
- [ ] ROOM-LIGHT — readable shadows/material contrast.
- [ ] ROOM-WALKABLE — safe entry, clear accessible routes to anchors.

### LIBRARY-01 — navigable study space

- [ ] FLOOR/LIGHT/WALLS
- [ ] BOOKSHELVES
- [ ] STUDY-TABLES
- [ ] CHAIRS
- [ ] AISLES
- [ ] STUDY-ANCHOR — invokes existing server academic action
- [ ] EXIT

### LECTURE-01 — navigable classroom/hall

- [ ] FLOOR/LIGHT/WALLS
- [ ] TEACHING-BOARD/SCREEN
- [ ] DESK/SEAT ROWS
- [ ] CLEAR AISLES
- [ ] FRONT-AREA
- [ ] ACADEMIC-ANCHOR — existing attendance/test/exam action as allowed
- [ ] EXIT

Interior layouts are fictional simulation spaces, not real venue floor plans. Use one versioned reusable interior schema/renderer and variant art data instead of separate hardcoded pages.

## 5. Visual UI / feedback assets — required

- [ ] INTERACTION-ANCHOR indicator: bed, desk, wardrobe, door, study, lecture, phone (text + icon/shape; not color only).
- [ ] SCENE-TRANSITION: short fade or equivalent with reduced-motion fallback.
- [ ] MAP-ICON continuity: Pocket Map is overview, different camera from gameplay.
- [ ] WARDROBE-PREVIEW: actual saved appearance drives world and editor preview.
- [ ] VENUE-LABELS: readable names with collision-aware placement, no fabricated official labels.
- [ ] DEFAULTS/FALLBACKS: usable fallback texture if a versioned visual bundle cannot load, without breaking gameplay authority.

## 6. Content-pack separation / validation

- [ ] World/exterior versions immutable where previously published; new revision/version for upgraded geometry/art.
- [ ] Old versioned world routes and associated hashes still resolve where promised.
- [ ] Previously stored academic terms with old venue/world snapshots work unchanged.
- [ ] Interior manifests strict, bounded, typed, non-executable; unknown IDs/assets reject.
- [ ] Room spawn and all anchors are reachable and safe.
- [ ] Assets referenced only from allowlisted local versioned paths.
- [ ] Runtime fetch/decode only visible zone + active interior and necessary avatar layers.
- [ ] Public SW may cache immutable public art safely; no private state/data in caches.

## 7. Quality-control / acceptance artifacts

Produce files/artifacts (paths may follow existing repo convention; link from PR):

- [ ] ART-BOARD — single art-direction sheet: silhouette, 4 facings, wardrobe alternatives, palette/materials, three environments.
- [ ] WALK-BOARD — 8-state direction/frame contact sheet or short sprite animation capture.
- [ ] BEFORE-AFTER — matched old/current gameplay viewport sizes, not misleading different crops.
- [ ] EXTERIOR-360x800, EXTERIOR-390x844, EXTERIOR-DESKTOP.
- [ ] HOSTEL-EXTERIOR.
- [ ] HOME-INTERIOR + BED + DESK + WARDROBE.
- [ ] LIBRARY-INTERIOR.
- [ ] LECTURE-INTERIOR.
- [ ] MAP-VS-WORLD camera comparison.
- [ ] NPC-SCALE/DEPTH evidence.
- [ ] PWA/offline/public asset fallback and constrained-network acceptance.
- [ ] ASSET-MANIFEST (size, source, hashes, atlas/frame count, lazy loading).
- [ ] PERF-MEASUREMENTS (player apparent height in px and %, camera zoom, active entities, load bytes, frame sample).
- [ ] SOURCE-PROVENANCE (originality, editable source path and exact export tool/command/version).

Prefer automated Playwright artifacts for viewport comparisons. Human visual approval still needed.

## 8. Quantitative budgets / safeguards

- Existing conservative **all-game-static JS** upper bound around 558 KB gzip; Phase 4.2 target ceiling **625 KB gzip** unless explicit evidence supports a reviewed exception.
- Do not confuse JS bundle size with texture/atlas transfer. Report them separately.
- Keep textures dimension/memory-bounded and lazy; avoid giant uncompressed first-load surfaces.
- Maintain current 32 manifest NPC total / 6 per zone / 16 nearby active budget unless a separately verified performance-safe change is justified.
- Static batching/chunking, no frame-loop API/database writes, low-cost shadows only.
- At 360×800 outdoor character visual height ~8–12%; indoor ~10–14%, measured after camera zoom and render canvas dimensions.
- Validate color/label readability, reduced motion, touch size and keyboard accessibility.
- On real lower/mid-range Android, still require a dedicated device gate; a CI browser emulator does not prove physical FPS/memory/thermal safety.

## 9. Completion rubric

A deliverable fails Phase 4.2 if any of these apply:

- only enlarges the primitive avatar or world-camera zoom;
- artwork is visibly inconsistent, unreadable or borrowed;
- no original production sprite assets/source exist;
- purported interiors are still static panels;
- no semantic bed/desk/wardrobe/exit behavior;
- visual entry grants attendance/sleep/study without server authority;
- old world/academic snapshots break;
- all textures load up front or mobile usability degrades;
- tests skipped locally are reported as passing;
- an implementation begins Phase 5.

When an asset cannot meet quality, mark **BLOCKED/NEEDS ART REVIEW** with a precise reason and proposed next step. Do not pretend incomplete visual quality is approved.
