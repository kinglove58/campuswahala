# Rejected offline character study / M1 handoff

**ART REVIEW BLOCKER. This is editable experimental source, not production art or M1 acceptance.**

The reviewer rejected the earlier vector proof. This follow-up tested original offline Blender authoring: hand-defined cheek/jaw/cloth lofts, modeled eyes and face, fixed elevated orthographic projection, tailored seams, four hair geometries, shoe/bag materials and a parameterized opposing-arm/leg walk. No imported model, game asset, likeness, reference tracing, third-party texture or runtime 3D library was used. The Python geometry/material source was authored for CampusWahala on 11 October 2026.

The render still has segmented mannequin-like limbs, overly synthetic hair/face treatment and insufficient natural expression and clothing deformation. It does **not** meet the approved polished young-adult art bar. Do not install these images as the final player/NPC or propagate the style into rooms.

`student.py` is the editable source; its parameters map the existing Appearance enums. `proof/` contains four representative looks in four directions and six walk frames in each direction for the first look, plus a close-up. Source support is not exhaustive saved-appearance or runtime compatibility proof. There is no upgraded actual-game capture, second idle frame export, accepted animation rig, production atlas, NPC integration or mobile art acceptance in this study.

## Reproduce

Install **Blender 4.0.2** as an offline authoring tool. From the repository root:

```sh
python art/characters/offline/render-study.py --blender /path/to/blender
node art/characters/offline/board.mjs
```

This writes transparent 128×160 RGBA frames and a 640×800 close-up, using CPU Cycles, 96 samples, no denoiser. Geometry has a ground origin at (0,0,0), forward −Y and Z up. The export camera looks from (0,−6,5) toward (0,0,0.94), orthographic scale 2.24. No collision model or server state exists in the source. To save a `.blend`, invoke `student.py` with output, direction, state, frame, Appearance JSON, width and `--save-blend`; do not commit duplicated scene files for every frame. A source hash and individual frame hashes/bytes are retained in `proof/frames.json`.

The local authoring environment used the Ubuntu Blender 4.0.2 package extracted into scratch because system package installation could not write its cache. Those binaries/dependencies are not repository or game dependencies. This study is outside public assets and outside CI runtime builds.

## External asset dependency

A **human character artist / experienced character-rig authoring pass** is required to deliver acceptable source and exports. The concrete handoff is [the M1 asset brief](../../../docs/phase-4.2-art-handoff.md). It requires polished coherent anatomy, faces, hair, cloth and articulated motion, all existing appearance mappings, transparent directional exports, source/provenance, then actual Phaser mobile proof and reviewer approval. This dependency has not been supplied or approved; no paid service has been commissioned.

M2–M6 remain blocked. Full real-time 3D and Phase 5 remain out of scope.
