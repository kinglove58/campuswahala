# PR #17 - selected B, final M1 visual review

[Reviewer decision 6148790041](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6148790041) selected **B - Painted Campus** as the character-art direction. Selection was explicitly not final M1 acceptance or merge approval. This iteration completes the authorized B-only technical/source/Appearance proof and stops for **explicit final M1 visual approval**. PR draft/open/unmerged. No M2-M6 or Phase 5.

Branch `codex/phase-4.2-visual-world`; base `7eded507ddb1876c77d25ecde94446667388123a`; iteration start/selected-source commit `8fc0425f4ce14d034a380a3f511f6ad766b7ff66`. Exact terminal head, CI run/job/artifact links and results are recorded in the PR body to avoid a self-referential hash. [Exact iteration and full-PR file inventory](phase-4.2-m1-painted-files.txt).

## What changed in B

One refined B-only modular source, with the decision locked in authoring config. A stays an untouched unselected comparison; earlier rejected art/imported ZIP remain unchanged outside the new proof. No rejected drawing module/pixels are used. This original source derives from the selected B paths, with smaller young-adult head proportions, broader crown/torso/hood tonal forms, elevated collar/shoulder and bag top surfaces, shoe toe/heel cues, front/back shoulder-plane projection, shoulder/hip motion and stronger opposing arm/elbow response. Fewer micro-marks emphasize large forms. Modular afro/braids/covering, clothing/material palettes and bare calves/skirt folds extend that same rig; no six unrelated designs, new body system or identity fields.

Authoring remains SVG paths and soft baked gradients/strokes plus deterministic semantic OpenRaster. “Painted” denotes a treatment, not a human-painted commission or physically rendered 3D model. No tracing, external game assets, AI sprite-sheet crops, real-time 3D reset, remote art host or new dependency. The reviewer must still judge the projection/silhouette and fidelity to the approved soft-modeled direction; this is not a claim the art gate is passed.

## Review evidence

- [Selected B before / refined B after](../art/characters/m1/painted-campus/comparison/selected-b-before-after.png), [four-facing master](../art/characters/m1/painted-campus/export/master-turnaround.png), [editable master sheet](../art/characters/m1/painted-campus/source/master-turnaround.svg).
- [Untouched native 360x800 before/after](../art/characters/m1/painted-campus/comparison/native-b-before-after.png), [native four-facing crops](../art/characters/m1/painted-campus/comparison/native-four-facing.png), [master-only played WebM](../art/characters/m1/painted-campus/evidence/master-only/walk-and-movement-360x800.webm).
- [Four player looks / four facings](../art/characters/m1/painted-campus/export/player-looks.png), [four native player views](../art/characters/m1/painted-campus/comparison/native-four-player-looks.png), [two fictional NPC variants](../art/characters/m1/painted-campus/export/npc-looks.png).
- [Actual B player + two NPCs at 360x800](../art/characters/m1/painted-campus/evidence/futa-360x800.png), [covered/skirt/bag](../art/characters/m1/painted-campus/evidence/look-2-360x800.png), [played appearance/facing/keyboard/pointer WebM](../art/characters/m1/painted-campus/evidence/walk-and-movement-360x800.webm), [measurements and planted transitions](../art/characters/m1/painted-campus/evidence/measurements.json).
- [Right eight-frame contact sheet](../art/characters/m1/painted-campus/export/right-gait.png), [down sheet](../art/characters/m1/painted-campus/export/down-gait.png), with up/left sheets also exported.
- [Source, provenance, ORA and exact recipes](../art/characters/m1/painted-campus/README.md), [source/atlas hashes/bytes](../art/characters/m1/painted-campus/export/manifest.json), [comparison provenance](../art/characters/m1/painted-campus/comparison/provenance.json).
- [Unchanged production baseline](../art/characters/proof/baseline/futa-360x800.png). Master-only native comparisons use the same viewport/ground/zoom, no NPCs, without source image resizing/retouching; lab UI fonts differ. The final variant lab separately stages two B NPCs. It does not replace the production React renderer or establish M2 integration.

A B-only high-resolution sheet and actual native master-only movement proof were inspected before extending to curated variants. Master-only and final proofs are refreshed from the same final source hash. Complete videos still require human review; source contact sheets, sampled video inspection and numeric tests do not establish naturalness. All four moving directions record all eight poses, matching actual displacement; keyboard, pointer, appearance switching and reduced-motion are exercised. 360x640/360x800/390x844/1280x900 and separately labeled DPR2 evidence are provided.

## Appearance, source and memory

Every exact existing seven-field Appearance value remains supported: four skins, four hairstyles, two hair colours, three tops, two bottoms, two shoes and two accessories = 768. All768 pass canonical parsing; all four idle facings are actually rasterized/bounds-checked (3,072 cases), with additional swing assemblies (6,144 SVG checks total). This is technical contract/assembly validation, not human inspection of every combination. Covered hair conceals colour changes while preserving the saved value; visible hairstyles have black/brown palette mapping. No migration, saved-profile/schema change or new production appearance compositor.

Four players contrast crop/braids/covered/afro, all four skins, three top colours, skirts/trousers and bag/no bag; two original unnamed NPC variants share the rig. Six bounded atlases only: each 1024x960, logical 128x192, foot (64,177), 40 distinct poses per look / 240 total, two idle +eight walk per facing. Encoded total 2,518,362 bytes; all six nominal decoded 23,592,960 bytes, normal proof steady three 11,796,480, switch peak four 15,728,640 before eviction, master-only one 3,932,160. No 768 giant texture export or later NPC behavior/density system.

Four generated SVG facings have13 semantic named layers each. The ORA has 52 actual part layers in four direction groups, not flattened full-frame layers; vector module/material/hair/skirt sources support every value. Raster ORA editing alone does not update all gait frames: edits must be reconciled into the rig before re-export. Source hash `2314f9a7d0b5d1353074804b98552b8bbc4feea8f4dbcdfcb99a3ad503eb9fc5`, LF canonicalization, atlas byte hashes, per-body RGBA hashes, alpha bounds and source contact annotations are recorded. Exact-source verification matches the documented PNG source-over packing step, without loosening pixel equality.

## Movement and measured scale

B-only art-lab player gait now uses actual cosmetic travel distance as the pose clock, so collision/idle stops moving-pose advance. Lab pacing is 64 source units/cycle lateral or 30.72 front/back at 8 poses/s; production 230 world units/s and collision/interaction geometry remain unchanged. Opposing arm travel, knee lift, heel/toe roll, cloth/bag shapes and shoulder/hip response are authored. Core shadow stays at (64,177), lifted contact shadows diminish.

Played evidence records source contact-shadow positions transformed through actual sprite scale/world position. Adjacent planted phase transitions must stay within one baked-pose travel interval plus 0.5 world-unit allowance; at least two such transitions per facing are required. These are authored contact proxies rather than pixel-tracked shoe physics. Between-frame quantization remains; no continuous IK/perfect-foot-lock or human gait acceptance claim. Complete timed WebM review is an open gate.

| Viewport / DPR1 | Actual canvas | Approx body / canvas  |
| --------------- | ------------- | --------------------- |
| 360x640         | 360x571       | 57.1px /10%           |
| 360x800         | 360x731       | 73.1-73.6px /10-10.1% |
| 390x844         | 390x775       | 77.5-78.0px /10-10.1% |
| 1280x900        | 1280x831      | 83.1-83.6px /10-10.1% |

Measured shadow-excluded alpha x sprite scale x live zoom / actual canvas;69px lab header, zoom .88 mobile/1.05 desktop. Software Chromium CANVAS render target 30 FPS / gait 8 FPS. DPR2 screenshot is720x1600 for360x800 logical viewport. No physical Android/device FPS or production camera acceptance claim. GameplayJS remains unchanged; local all-static conservative gzip 557,902 bytes, CI exact build recorded in PR body, target 625KB.

## Scope and authority status

| System / milestone                          | Result                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| M0                                          | Existing baseline, ADRs, architecture and old-world evidence retained                                              |
| M1                                          | B selected direction; refined source, all Appearance values and six curated proofs; **final visual approval OPEN** |
| M2-M6                                       | NOT STARTED: no production sprite/camera/NPC system, world styling, home/library/lecture interiors                 |
| Phase 5                                     | NOT STARTED / NOT AUTHORIZED; local development is not safe to begin under this handoff                            |
| Production apps/packages/worlds             | No change in this iteration; v1/v2 manifests/snapshots retained                                                    |
| Migrations / schema                         | NONE; no new world/interior revision or database migration                                                         |
| Bed/desk/wardrobe/library/lecture authority | No new integration; canonical academic/life/BFF paths remain unchanged                                             |
| PWA/cache/security/dependencies             | No new dependency, exemption, account/API path or private cache change                                             |

Isolated loopback proof keeps exact static whitelist, GET-only, CSP, no-store/nosniff. Zero authority requests. Default older proofs/scanners/browser assertions remain enabled; new B-only selection is a fixed internal flag. Art-lab body/camera changes do not grant venue/presence, attendance, sleep/study, life metrics, progression or authoritative time. NPCs are two staged cosmetic samples, not a M2 patrol/density implementation. Reviewer-owned controls are untouched.

## Validation and remaining gates

Passed locally: lint/types, 151 tests, cached unchanged production builds/world compilation, budgets, dependency audit (no known vulnerabilities), original32-frame proof, original ZIP/768-option/six-example M1 regression, unchanged A/B integrity, new768/3,072/6,144 Appearance checks,240 exact-source atlas cells,52 actual ORA layers and final Phaser master/variant proofs. An empty transformed bag-layer source assertion was fixed by omitting empty groups, preserving the assertion. A copied proof's stale log variable and unused source initialization were fixed. No previous assertion/timeout/scanner was weakened. Original LF-byte proof is validated against committed bytes; Windows checkout CRLF remains a local byte-check caveat, not a content edit.

Skipped locally: 13 PostgreSQL cases. Unavailable locally: Docker daemon/PG/container/Trivy/SBOM. Exact-head CI must supply 164 unit+PostgreSQL/36 browser regressions, complete security scans, Bicep/container/SBOM and current browser artifacts; terminal results/IDs in PR body. Do not count prior-head results as this head's checks. No new migration upgrade is needed; existing upgrade integration remains enabled.

Remaining human gates: **explicit final M1 visual approval** of B projection/silhouette/material/face/cloth, full timed gait/foot/shadow review, source/originality acceptance and physical Android/performance. If quality remains insufficient, retain the M1 art gate. Stop here; keep draft/unmerged and do not begin M2-M6 or Phase 5.
