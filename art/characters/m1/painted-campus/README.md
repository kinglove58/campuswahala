# Painted Campus - selected B direction, final M1 review open

[Reviewer decision 6148790041](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6148790041) selected **B only** as the character-art direction. That selection is not final M1 acceptance or merge authorization. The [authoring configuration](appearance.mjs) records the decision/source commit, finalVisualApproval=false and runtimeIntegrated=false. A remains an untouched unselected comparison; older rejected studies remain segregated and are not loaded in this proof.

Authoring is original layered SVG paths, soft baked material gradients and restrained drawn highlights, with a semantic OpenRaster companion. The refined source derives only from the authorized B surfaces at 8fc0425; no rejected drawing modules, traced reference, game assets, AI sheet crops or new dependencies. “Painted” describes the surface treatment; it is not a claim of human painting or physically rendered 3D geometry.

## Inspect the final proof

- [Selected B before / refined B after](comparison/selected-b-before-after.png), [new editable four-facing master](source/master-turnaround.svg), [PNG master](export/master-turnaround.png).
- [Untouched 360x800 before/after, master alone](comparison/native-b-before-after.png), [native four-facing crops](comparison/native-four-facing.png), [master-only played WebM](evidence/master-only/walk-and-movement-360x800.webm).
- [Four contrasting player looks / four facings](export/player-looks.png), [four untouched native player viewports](comparison/native-four-player-looks.png), [two fictional NPC looks](export/npc-looks.png).
- [Final actual Phaser B player + two staged B NPCs](evidence/futa-360x800.png), [played facing/movement/appearance WebM](evidence/walk-and-movement-360x800.webm), [measurements](evidence/measurements.json).
- [Right eight-pose contact sheet](export/right-gait.png), [down sheet](export/down-gait.png); up/left also exported. All derive from the same rig/atlas source.
- [Editable ORA](source/master.ora), four named-layer native SVGs, 52 semantic raster layers and their [hash manifest](source/openraster-manifest.json).

The isolated lab draws the existing FUTA v2 world through the unchanged proof-ground adapter. It is M1 evidence; no production avatar/camera, exterior/interior redesign or authority integration. Native DPR1 viewports are 360x640, 360x800, 390x844 and1280x900. The separately labeled DPR2 image has720x1600 physical screenshot pixels for a360x800 logical viewport; it does not replace native 360x800 evidence. Native comparison panels/crops are composited without resizing/retouching. Before B images are SHA-verified against exact selected commit8fc0425; full production baseline is retained separately.

## One rig and every existing Appearance value

The exact seven-field contract remains: four skins, four hairstyles, two hair colours, three tops, two bottoms, two shoes and two accessories = **768 values**. [appearance.mjs](appearance.mjs) contains canonical choices, material palettes and six curated proof looks. [student.mjs](student.mjs) contains the one B rig, head/hair/hood/bag/shoe surfaces, modular crop/afro/braids/covering and trousers/skirt parts, and explicit gait phases.

Verification renders every value in all four idle facings (3,072 RGBA/bounds checks) and assembles additional swing poses (6,144 SVG pose checks total), compares canonical parsing, rejects unknown/extra fields and validates all 240 committed atlas cells against current source pixels. This is exhaustive contract/assembly validation, not human visual inspection of all 768 combinations. Covered hair conceals hair-colour changes, while the saved value is preserved; visible hair colours map the hair layer independently. No new identity fields/body system or destructive migration.

Only **six bounded precompositions** are stored: four players and two fictional NPCs sharing the same rig/material palette. Each atlas 1024x960, source cell 128x192, foot (64,177), 40 unique poses (4 facings x [2 idle +8 walk]). No 768 giant atlas export. Full arbitrary Appearance authoring is supported by the source, not a new production runtime compositor. Staged proof NPCs demonstrate the rig/variants and state animations; this does not implement M2 NPC patrol/density behavior.

Look0 crop/lime/brown/trousers/white/bag; look1 braids/blue/deep/skirt/white/no bag; look2 covered/clay/warm/skirt/dark/bag; look3 brown afro/blue/light/trousers/dark/no bag. NPCs4/5 use contrasting deep afro/clay and warm brown braids/lime outfits. They are fictional, unnamed art samples.

## Projection and motion

Smaller head proportions, broader hair crown/torso/hood tonal forms, elevated collar/shoulder and bag top surfaces, shaped shoe toe/heel planes and a consistent front/back shoulder-plane projection refine selected B. Upper-left light is preserved. Shoulder/hip sway, opposing arm swing, elbow response and tapered bare calves/cloth folds replace rigid static transitions. The projection is an authored 2D approximation; the reviewer must still judge whether down/up and all materials meet the approved modeled direction.

In the B art lab, moving-player frame phase follows **actual cosmetic WorldEngine distance**. It stops advancing when collision/idle stops displacement; idle and stationary preview retain low-cost animation. Lab pace remains64 source units/cycle laterally or 30.72 front/back, 8 poses/s, one-second cycle; production speed 230 units/s and collision radii remain untouched. Core shadow stays at source (64,177); lifted-foot contact shadows diminish. Measurements retain actual movement-frame samples and projected contact-shadow world anchors. Adjacent stance transitions must stay within one baked-pose travel interval plus 0.5 world-unit tolerance. This measures the authored contact proxy, not pixel-tracked shoe physics. Eight baked frames have bounded between-frame quantization; no continuous inverse-kinematic or perfect-foot-lock claim. Full played-video naturalness review remains human acceptance.

At native 360x800, canvas 360x731 below 69px header, zoom .88, body about73px/10% of the actual canvas, shadow excluded. Software Chromium/Phaser CANVAS target 30 FPS and gait 8 FPS; no physical Android performance claim. Normal proof loads three atlases (player +2 NPCs):11,796,480 nominal decoded bytes. Appearance switching peaks at four then evicts the previous player texture:15,728,640 bytes. Master-only loads one:3,932,160 bytes. Encoded bytes/hashes are in [manifest](export/manifest.json). There are zero authority requests. CSP, exact fixed asset whitelist, loopback, GET-only, no-store and nosniff remain enabled.

## Reproduce or edit

Existing pinned Node22/24, Sharp/esbuild/Phaser, Python3 and Playwright Chromium suffice:

```sh
node scripts/art/export-painted-campus.mjs --stills --master-first
# Inspect the B-only four-facing master first.
node scripts/art/export-painted-campus.mjs --master-first
node scripts/art/capture-painted-master.mjs
# Same selected B source, only six curated examples:
node scripts/art/export-painted-campus.mjs
python scripts/art/pack-painted-campus.py
node scripts/art/verify-painted-campus.mjs
node scripts/art/capture-painted-campus.mjs
node scripts/art/compare-painted-campus.mjs
```

The early master outputs live under ignored artifacts; capture also commits the master-only evidence folder. Source SHA uses LF-normalized authoring files; atlas bytes and shadow-free body pixel hashes, alpha bounds and contact annotations are recorded. Verification uses the documented PNG source-over packing step to compare exact committed pixels across Windows/Linux. ORA packaging is deterministic, with mimetype first/uncompressed and 52 named semantic part layers in four facing groups. Source SVG/module is editable and reproducible; editing raster ORA alone does not automatically update every gait frame. Reconcile such edits into the rig before re-export.

**Remaining gates:** final M1 visual approval, source/provenance/style acceptance, projection/silhouette/material/expression quality, full WebM gait/contact review and physical Android/device performance. M1 remains open. No M2-M6 or Phase 5, no merge or character promotion into production.
