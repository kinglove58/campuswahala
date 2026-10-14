# M1 character refinement - visual approval required

One original layered-vector master, delivered as 2D frames in the existing isolated Phaser laboratory. Revision 2 responds to reviewer comment 6126592275. No production avatar/camera wiring, M2-M6, Phase 5 or merge. Human visual approval remains open.

## Editable source and recipe

`student.mjs` retains the seven-field Appearance contract and six curated looks. `forms.mjs` contains the original Bezier anatomy, face/hair, cloth/material paths and explicit eight-pose gait. Both are the reproducible master. The source hash is SHA-256 of JSON.stringify(sourceFiles): ordered student.mjs/forms.mjs names and individual UTF-8, LF-normalized hashes. Metadata includes both hashes.

Named SVG groups and 52 semantic OpenRaster part layers retain four independent facings. Shoes, limbs, torso/hood, lower clothes, head/face, hair/covering and bag/straps remain independently editable. Empty alternate occlusion slots are retained. SVG/ORA are interchange snapshots: graphical edits must be transferred to master paths before regeneration; no automatic round trip is claimed.

Master first, before exporting the representative variants:

```sh
node scripts/art/export-m1.mjs --master-first
node scripts/art/capture-m1.mjs --master-first
```

This interim proof is written only to ignored `artifacts/m1-master-first`. It renders the current master and retains OLD comparison/NPC atlases from the previous export. It is explicitly not current variant acceptance. Inspect the four-facing turnaround, native crops and played Phaser proof first.

After master inspection, export six current-source examples and validate:

```sh
node scripts/art/export-m1.mjs
python scripts/art/pack-m1-source.py
node scripts/art/verify-m1.mjs
node scripts/art/compare-m1.mjs
node scripts/art/capture-m1.mjs
```

Use the existing frozen-lockfile installation and compiled game-engine package. Sharp/librsvg versions are in the manifest. No new dependency, paid artist, remote art host, tracing, runtime 3D or generated raster source. The supplied ZIP remains separately quarantined and byte verified; rejected older studies and production baselines remain preserved.

All 768 canonical Appearance combinations remain source/domain validated. Six examples cover four players plus two fictional NPCs, not 768 independent atlases or human reviews. Optional warm/attentive/soft expressions are offline master-authoring examples, not new serialized Appearance values or game-state mechanics.

## Art and animation evidence

`export/master-turnaround.png` is a four-facing vector-rendered master view. `export/expression-board.png` shows three intentional facial treatments from that same master. Appearance/walk boards and close-up derive from the same source; no separate flattering portrait. `comparison/` contains hash-verified exact rejected exports from commit 12248aa and labeled face/four-direction walk comparisons.

Each current atlas remains 1024x960, forty transparent 128x192 cells: two idle and eight walk per direction. Logical foot origin stays (64,177); shadow is excluded from body bounds. Contact, plant, passing, push-off, opposite contact, lift, passing swing and lowering are explicit poses with counter-arm swing, bent knees, restrained torso weight transfer and heel/toe roll. Unique RGBA cells are technical integrity evidence, not naturalness or visual approval.

`evidence/` contains real four-viewport Phaser captures, four native unscaled master crops, eight states, four player looks, four keyboard-driven walking captures, reduced motion, measurements and a played WebM. NPCs share the rig in a controlled animation demonstration; this is not production patrol/AI acceptance.

## Honest isolated Phaser boundary

The laboratory uses the existing WorldEngine and FUTA v2 geometry. `proof-ground.mjs` is a read-only adaptation of the unchanged production CampusScene's existing floor, roads, buildings and decorations at 12248aa. Tree SVGs render at their original 64x80 decoration size, rather than stretching across a whole zone. This gives a faithful same-ground/same-camera composition without M3 new scenery. UI/labels/NPC composition remain separate; it is not a pixel-matched production React scene or M2 acceptance.

Only the lab's sprite scale targets 10% body/canvas height; camera stays 0.88 mobile / 1.05 desktop. Production movement remains 230 world units/s. The lab's cosmetic engine delta is paced to one eight-frame cycle per second: 72 projected source units laterally / 39.6 vertically, times sprite scale. A planted ankle retreats nine source units per frame (vertical projection 0.55), matching this lab travel. Heel/toe contact, perspective and perceived naturalness still require visual review. No authoritative academic/life clock, presence, API request or command is involved. Production pacing/renderer integration is blocked until M1 approval.

The lab renderer is capped at 30 FPS to bound software Canvas work; animations remain 8 FPS walking / 2 FPS idle. This is a requested frame cap, not measured physical-device performance. A look switch retains three atlases at steady state, temporarily four: 11,796,480 / 15,728,640 nominal RGBA bytes. Six exports total 23,592,960 decoded bytes. Actual encoded sizes and software observations are in manifests/measurements; production art transfer and additional production JS remain zero.

## Quality boundary

Anatomy, face proportions, sleeves, fabric folds, hair coverage, bags, shoes and stride clarity have been reworked. The source still has an illustrated vector finish; cinematic material/face polish and gait naturalness must be judged by the reviewer at native size and in played motion. **ART REVIEW BLOCKER remains pending explicit human M1 approval.** Physical Android performance remains unverified. Do not merge or proceed to M2-M6/Phase 5.
