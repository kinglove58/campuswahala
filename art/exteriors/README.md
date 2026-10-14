# CampusWahala M3 original exterior master

Original editable layered vector source: `master.mjs`. No third-party sprites, tracing,
textures, maps, remote fonts, real vendor marks, or reference-game assets. It draws
six architecture families and sixteen prop frames using elevated planes, north-west
light, warm facade/glass gradients, grounded shadows and organic canopy silhouettes.
FUTA uses terracotta pitched roofs/gardens; OAU uses concrete terraces/repeated bays;
UNILAG uses light canopies/blue-green materials and the existing fictional waterfront.
The campus configurations are visual fiction, not surveyed or official floor plans.

Run from the repository root:

```sh
node scripts/art/export-exteriors.mjs
node scripts/art/export-exteriors.mjs --check
```

Exports are three local hash-addressed 1024×768 SVG atlases and the generated typed
frame/palette/source-hash descriptors in `packages/game-engine/src/exterior-assets.ts`.
Each campus decodes exactly one 3,145,728-byte RGBA atlas; it is not a monolithic
world bitmap. The six building cells are 256×256, sixteen prop cells 128×128, with
explicit feet pivots. Geometry/pathfinding/colliders, published labels, academic
snapshots, NPC caps and the immutable v1/v2 routes remain separate and unchanged.

The additive **exterior art version 1** does not change schema-2 world semantics or
rewrite old packs. Older clients still have their original hashed zone assets;
rollback is a code revision, not database conversion. The new renderer owns and
releases visible chunk objects, loads one atlas for the selected campus, and removes
it on scene shutdown. Character assets are the approved B originals, unchanged.
Static ground is batched; upright images independently sort at 4000 + ground Y,
matching the approved character renderer. Foreground overlap becomes translucent
for player legibility. No real-time light/shadow engine or runtime generation.

Production captures and played videos live in the exact-head CI artifact
`m3-production-exterior-proof`; the accepted M2 comparison source is push artifact
11868806928 at e0c2dd6072c7c07acdfb0d34b119a8ca668ac4e0. CI evidence is not human visual
approval. Stop for **M3 visual review**. No M4/M5/M6 or Phase 5.
