# M1 editable character candidate ? visual approval required

This is a new original layered-vector study and isolated **actual Phaser** laboratory. It is not installed in CampusWahala's production renderer. The supplied AI-assisted ZIP is separately quarantined at `../inhouse-candidate/proof/`; its pixels, repeated frames and frame-only OpenRaster were not promoted into this master. Prior rejected vector/Blender studies are preserved.

## Editable source and reproducible export

- `student.mjs` is the authored source: explicit B?zier paths, named part groups, palettes, independent profile silhouettes, rear hair/covering geometry and articulated poses. No mirrored whole character, raster tracing, external game art, paid renderer or runtime 3D library.
- `source/{down,up,left,right}.svg` are named editable SVG layers usable in Inkscape. `source/modular-master.ora` provides 52 semantic raster-part layers grouped by direction, including independently editable shoes, limbs, lower clothes, torso/hood, head/face, hair/covering and bag/straps. Empty alternate occlusion slots are retained; this is not 52 whole poses.
- SVG/ORA files are artist interchange snapshots. The reproducible master is the path/palette code: edits made in a graphical editor must be transferred into the corresponding source paths before regeneration. No automatic round-trip editing claim.
- `source/material-sheet.svg` records all existing skin/top/hair/shoe palettes; `export/appearance-board.png` shows four contrasting player looks; `export/walk-board.png` shows all four eight-frame walk sequences.

From the repository root, after frozen-lockfile install, generated Prisma bindings and package build:

```sh
node scripts/art/export-m1.mjs
python scripts/art/pack-m1-source.py
node scripts/art/verify-m1.mjs
node scripts/art/capture-m1.mjs
```

Export uses the existing pinned Next/Sharp toolchain (actual Sharp/librsvg versions are in `export/manifest.json`). Packing uses Python standard library. No new dependency or external asset service. Source SHA-256 is UTF-8 with LF-normalized line endings; PNG/file hashes are exact byte hashes. Original intake payloads use scoped `-text` attributes to preserve archive bytes on Windows/Linux.

Six proof looks only: four players and two fictional NPC variants use the same source and all seven canonical Appearance fields. Every one of the 768 serialized combinations is checked against the existing `parseAppearance`, with generated source checks in four directions. Raster/visual proof covers six representative looks, not a human inspection of every combination. No Cartesian 768-atlas export and no saved-avatar/schema migration.

Each atlas is 1024?960, 40 transparent 128?192 cells: two independent idle poses and eight walk poses per direction. The logical foot origin is (64,177), with AA/shoe edges extending slightly beyond that plane; it does not move with state/direction. Arm/leg swings oppose, shoe toes follow profile direction and facing retains meaningful keyboard movement. Shadows are separate from body-height measurement. Eight states and distinct _actual packed RGBA cells_ are checked; no repeated complete poses are concealed in metadata.

## Isolated Phaser evidence

`proof-client.mjs` is bundled only into ignored `artifacts/m1-proof/dist`. The fixed-whitelist server binds an ephemeral loopback port. It renders the existing validated FUTA v2 manifest/zone art and uses the existing WorldEngine for collision-aware cosmetic keyboard/tap movement. The background is simplified, not an M3 exterior upgrade or the production React scene. It calls no private API, establishes no authoritative presence and performs no sleep/study/grade/life action. The supplied tap-to-bed HTML is not served.

The camera values remain baseline 0.88 mobile / 1.05 desktop; only this laboratory's sprite scale is fitted to the 10% body-height experiment. This is not the M2 production camera/renderer implementation. Four viewports are captured, plus eight-state proof, four player looks, two NPCs, keyboard/pointer movement, a real 360?800 WebM and reduced motion. Body measurements use exported non-shadow alpha bounds ? live scale ? live camera zoom, cross-checked with the DOM canvas rectangle; not screenshot pixel segmentation.

Three atlases are resident at steady state (11,796,480 nominal RGBA bytes); a switch briefly holds four (15,728,640). All six exported atlases total 23,592,960 decoded RGBA bytes. These are pixel-accounting bounds, not measured heap/GPU memory or physical Android performance. Encoded bytes, loaded responses and software frame samples are recorded in manifests/measurements. Production art transfer and added production JS remain zero.

## Quality boundary

The candidate improves editability, silhouette detail, direction consistency, locomotion coverage and readability over the primitive avatar. Its flat vector surfaces, relatively schematic facial/cloth forms and gait-to-travel-speed tuning remain below a confident claim of the approved modeled animated-film standard. **ART REVIEW BLOCKER remains.** Human visual/art acceptance and physical Android review are open. Do not promote this candidate, mark M1 accepted, start M2?M6/Phase 5 or merge PR #17 automatically.
