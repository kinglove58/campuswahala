# PR #17 - M1 character quality refinement

Reviewer assignment: [comment 6126592275](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6126592275). Branch codex/phase-4.2-visual-world. Base `7eded507ddb1876c77d25ecde94446667388123a`; starting head `12248aacbecae885cb7905cf9279457fb141c96c`. Exact final head and terminal CI results are recorded in the draft PR body to avoid a self-referential hash.

**M1 visual approval remains open; ART REVIEW BLOCKER retained.** PR draft/open/unmerged. No M2-M6 or Phase 5 implementation. Migrations: none. Production apps/packages, original world assets/manifests, Appearance schema, authority/security controls and reviewer-owned files remain unchanged.

## What changed

One shared master was refined and inspected first: a four-facing high-resolution turnaround and actual native 360x800 Phaser captures preceded the full six-example export. The interim master-first command retains old comparison NPC atlases and writes only ignored artifacts; final evidence uses six current-source examples. No Cartesian permutation export or additional body-design system.

- Smaller rounded eyes/nose, softer cheek/jaw lighting, deliberate smile and separate attentive/soft authoring examples, fuller textured hair silhouettes and corrected rear afro coverage.
- Rounded shoulder/sleeve transitions, attached forearms and softer hands, tapered thighs/calves, hip continuity, knee/ankle folds, draping skirt, dimensional headwear/bag/straps and consistent upper-left light. Offline SVG soft-volume filtering is baked into sprites, not runtime lighting.
- Explicit contact/plant/passing/push-off/opposite-contact/lift/passing-swing/lower poses, opposite arm/leg swing, heel/toe roll and restrained torso sway. A malformed left shoe and exposed rear hair gap found during inspection were corrected.
- Separate isolated lab uses a read-only adaptation of the existing production floor/roads/buildings/decorations; fixed the prior tree SVG erroneously stretched to zone dimensions. No new M3 environment design. Camera/manifest ground match the existing baseline; UI, labels and NPC composition remain separate.
- Lab movement is paced to the exported plant travel at 8 FPS walking, with a 30 FPS software renderer cap. Production 230 units/s movement is unchanged. Four keyboard-driven walks are recorded in the played video. This is art-lab pacing evidence, not production movement/camera acceptance.

## Review these artifacts

- [Four-facing master](../art/characters/m1/export/master-turnaround.png), [same-source expressions](../art/characters/m1/export/expression-board.png).
- [Before/after face](../art/characters/m1/comparison/face-before-after.png), [before/after four-direction walk](../art/characters/m1/comparison/walk-before-after.png). Before inputs are exact SHA-verified exports from rejected 12248aa, not altered reconstructions.
- [Actual 360x800 Phaser](../art/characters/m1/evidence/futa-360x800.png), [native front crop](../art/characters/m1/evidence/native-master-down-crop.png), [native profile crop](../art/characters/m1/evidence/native-master-left-crop.png), [covered/skirt/backpack](../art/characters/m1/evidence/look-2-360x800.png).
- [Played Phaser animation/movement WebM](../art/characters/m1/evidence/walk-and-movement-360x800.webm), [keyboard-driven profile walk](../art/characters/m1/evidence/played-walk-right-360x800.png), [measurements](../art/characters/m1/evidence/measurements.json).
- [Unchanged actual production baseline](../art/characters/proof/baseline/futa-360x800.png); this laboratory does not replace the React CampusScene or confer authority.
- [Editable source, provenance and exact recipe](../art/characters/m1/README.md), [source/atlas hashes and sizes](../art/characters/m1/export/manifest.json), [file inventory](phase-4.2-m1-files.txt).

## Quantitative and validation evidence

Logical frame 128x192 / foot (64,177), 40 frames per 1024x960 atlas, six examples / 240 distinct RGBA poses, 52 semantic ORA parts / four facings. All 768 Appearance combinations and original 35-file ZIP intake remain verified. Source hash now covers both student.mjs and forms.mjs; exact per-file hashes are retained.

Six decoded atlases: 23,592,960 nominal RGBA bytes; steady three: 11,796,480; switching peak four: 15,728,640. Current encoded totals, four canvas/body-height rows and exact-head security/CI artifact IDs are recorded in the final PR body. Native body remains about 10% of the actual canvas at 360x640, 360x800, 390x844 and desktop; shadow excluded, live scale/zoom and DOM bounds measured. Software Chromium DPR1, not physical Android or a measured 30 FPS guarantee. Production transfer/JS remains unchanged; world/JS budgets checked separately.

Passed locally: lint, types, 151 existing tests, cached unchanged production builds/world compilation, source/hash/alpha/768-option validation, labeled comparison provenance and final real Phaser captures. Thirteen PostgreSQL tests skipped locally; Docker daemon unavailable. CI is responsible for exact-head PostgreSQL, 36 production browser regressions, security scans, Bicep, containers and SBOM; final statuses/links are in the PR body, not borrowed from accepted 12248aa.

Diagnosed pre-final failures: unused initial hair assignment fixed without lint suppression; an initial fixed-duration keyboard probe failed under slower lab pacing, replaced with bounded observed movement and a stronger minimum displacement; a screenshot hit its unchanged 30-second deadline under local software-rendering load. The lab renderer cap now limits work to 30 FPS, with gait/frame/movement assertions retained and additional played-direction evidence. No existing production browser assertion, timeout, retry, quota or scanner was relaxed.

## Remaining human gates

The artwork and stride are more readable and editable, but still require independent judgment for appealing adult-student anatomy, softly modeled materials, hairstyle attachment/occlusion, feet grounding and natural motion at native size. A unique frame count, larger scale or green CI cannot grant visual approval. **ART REVIEW BLOCKER remains pending explicit M1 visual approval.** Physical Android memory/FPS/thermal/device acceptance is still unverified. No artist/paid service was commissioned, no production deployment or merge occurred, and no M2-M6/Phase 5 work is authorized.
