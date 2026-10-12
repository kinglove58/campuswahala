# PR #17 ? supplied in-house ZIP / M1-only review checkpoint

12 October 2026. **Phase 4.2 incomplete; ART REVIEW BLOCKER retained.** The supplied binary dependency is now available and verified; this does not establish acceptable production art. PR remains draft/unmerged. No M2?M6 implementation or Phase 5.

## Assignment and commits

Read AGENTS, constitution, history, active phase, workflow and all three binding art/checklist/milestone documents. Followed [reviewer handoff 6124236056](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6124236056).

- PR base: `7eded507ddb1876c77d25ecde94446667388123a`.
- Intake starting head: `413d6c83f9bb6a9dfb3e6e7bc84498778359e5fd`.
- Branch: `codex/phase-4.2-visual-world`; exact final head and terminal CI are in the PR body (avoids a self-referential commit hash).
- Migrations: none. Runtime apps/packages, world manifests/revisions, immutable published asset bytes and reviewer-owned control files are unchanged.

## Actual intake

Owner-supplied `campuswahala-m1-inhouse-2d-prototype (3).zip`: 3,504,815 bytes, SHA-256 `54a95d22452eb84ee7b88ffaef6e4c346091d20cd351badcd0035d951bac164b`, exactly matching the reviewer. Copied identical bytes to the canonical filename in ignored artifacts so the existing strict importer could run. Staged 35 retained files; the room/tap-to-bed HTML was excluded. Imported authoring Python was preserved as data, not executed.

Original file hashes, PNG alpha/atlas dimensions and frame inventory are verified. The 32-cell 640?720 atlas still has only 28 individual frame files and repeated/mirrored poses; OpenRaster is frame-level, not modular anatomy/clothes. Original visuals were inspected and remain unapproved. Existing rejected studies and baseline screenshots are unchanged.

## New source candidate and animation

[Editable source and export recipe](../art/characters/m1/README.md). A separately authored layered-vector master provides body/head/face, hair/covering, torso/hood, limbs, separate shoes, lower clothes, bag/straps and ground shadow. Four separately defined facings share the pivot and global lighting direction. Profiles are not whole-image flips; rear coverings do not expose a false front face. Arm/leg phases oppose, toe orientation follows facing and weight/foot lift differ across the walk cycle.

52 editable semantic OpenRaster layers in four groups; four named-layer SVG sources; source/palette code and material sheet. Every canonical Appearance value is represented without schema changes. The source contract exercises all 768 combinations; six raster examples cover four contrasting players and two fictional NPCs. It does not claim all combinations were human reviewed or that saved production avatars were replaced.

40 unique actual RGBA cells per 1024?960 atlas (128?192): 2 idle + 8 walk per facing. Six atlases / 240 packed poses; no repeated complete frame cells. Logical foot origin (64,177), separate shadow/body extents; source/frame/atlas metadata and hashes retained. No production assets or runtime atlas registrations.

## Actual Phaser visual evidence

[Native 360?800 proof](../art/characters/m1/evidence/futa-360x800.png), [covered/skirt/backpack example](../art/characters/m1/evidence/look-2-360x800.png), [four looks/facings](../art/characters/m1/export/appearance-board.png), [walk contact sheet](../art/characters/m1/export/walk-board.png), [actual animation/movement WebM](../art/characters/m1/evidence/walk-and-movement-360x800.webm), [higher-resolution same-source view](../art/characters/m1/export/close-up.png), [measurements](../art/characters/m1/evidence/measurements.json).

Compare with the preserved [actual production baseline at the same 360?800 viewport](../art/characters/proof/baseline/futa-360x800.png). Both canvases are 360?731 and mobile zoom 0.88; baseline character estimate 46.2 px / 6.32%, new lab body approximately 73.1 px / 10%. The baseline uses the production React/Phaser scene, while the M1 lab simplifies the same v2 campus geometry/background and uses a separate header. It is not a pixel-matched production upgrade or M2 acceptance. Shoe palette may differ between baseline/default proof; appearance examples are explicit in the manifest.

The real Phaser laboratory uses validated current FUTA geometry, existing WorldEngine collision/path movement, two safe-positioned NPCs sharing the source, four look switches with texture eviction, eight states and reduced motion. Tests inspect actual rendered frame names, live origin/scale/zoom, DOM canvas size and movement. No private API requests, commands, authoritative travel, clock/stat injection or bed simulation; no client coordinates grant authority. Actual iframe/room/wardrobe/academic/life acceptance remains later-milestone work, not skipped M1 proof.

## Quantitative evidence

| Viewport | Live canvas | Body px | Body % | Camera |
| -------- | ----------- | ------- | ------ | ------ |
| 360x640  | 360x571     | 57.10   | 10.00% | 0.88   |
| 360x800  | 360x731     | 73.10   | 10.00% | 0.88   |
| 390x844  | 390x775     | 77.50   | 10.00% | 0.88   |
| 1280x900 | 1280x831    | 83.10   | 10.00% | 1.05   |

Source export atlas bytes: 1,651,713. Six decoded RGBA atlases: 23,592,960 bytes. Steady state three: 11,796,480; measured transient switching maximum four: 15,728,640. Shadow excluded from body-height calculation. Metrics are software Chromium/Phaser Canvas, DPR1; frame samples are not a physical-device FPS claim. Public production transfer/bundles are unchanged: conservative all-game JS **557,902 gzip bytes**, below the 625 KB target. Proof-only Phaser/module/atlas transfers are separate and are not an optimized production first-load measurement.

## Validation status

- Passed locally: frozen install, regenerated current Prisma bindings, lint, typecheck, all production builds, world compilation/budgets, audit (no known vulnerabilities), import byte/image verification, all-combination source checks, 240 distinct packed poses and source hashes.
- Existing local suite: **151 passed / 13 PostgreSQL skipped** across 22 files. Docker daemon unavailable locally; no local PostgreSQL/container/Trivy/Semgrep/CodeQL success is claimed. Complete exact-head CI is recorded in the PR body.
- M1 browser laboratory: four viewports, all eight states, four looks, two NPCs, keyboard/pointer movement, bounded texture eviction, zero API traffic and reduced motion passed. These are separate from the existing 36 production browser regressions.
- Failed attempts diagnosed, not counted as passes: stale generated Prisma bindings after branch checkout (regenerated); Windows CRLF conversion of hash-pinned world SVGs (restored exact hash-verified Git blob bytes, no content revision); early authoring/lint defects fixed before final capture. CI assertions, scanner rules and existing quotas were not weakened.
- Existing full security/Bicep/PG/36-browser pipeline retained. Added intake/export verification, isolated Phaser evidence artifact and scanner coverage of M1 executable source. No M6 completion claim.

## Art assessment and remaining gates

The source is materially more editable and directionally consistent than the supplied cropped frames. Native-size appearance is clearer than the primitive baseline. However, vector surfaces and facial/cloth modeling are still schematic relative to the binding 3D-inspired animated-film standard, and gait-to-travel-speed/deformation needs a character artist's review. **Do not treat technical passes, larger scale or these screenshots as visual approval. ART REVIEW BLOCKER remains.**

Human M1 source/style/animation/provenance approval and physical Android measurements remain open. No external artist was commissioned; no paid services or cloud resources were created. Old world/academic/life/Wahala/identity/deletion/private-cache authority remains untouched. M2 camera/production avatar wiring, M3 exterior, M4 home, M5 library/lecture and M6 phase acceptance are not implemented. Phase 5 is not safe or authorized to begin.

## Exact file inventory

The complete base-to-head inventory and this iteration's paths are recorded in [M1 file inventory](phase-4.2-m1-files.txt), with exact head/CI in the draft PR. Source/export/evidence paths are non-runtime, and the intake golden bytes are preserved.
