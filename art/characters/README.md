# CampusWahala original student-art proof

**Status: ART REVIEW BLOCKER. Experimental source, not approved production assets.**

This is an original hand-authored layered vector attempt. No reference-game sprites, traced images, commercial pack, real-person likeness or generated reference image was used. The shape/path/material source is in `student-rig.mjs`; `composite.mjs` combines existing Appearance values. The original work was created for CampusWahala in this task on 11 October 2026 and is retained in this repository for project use.

## Reproduce

From the repository root, after the frozen-lockfile install:

```
node scripts/art/preview-student.mjs
node scripts/art/export-student.mjs
node scripts/art/verify-student.mjs
```

Export uses the repository's existing Next dependency's Sharp 0.35.5 and librsvg; no new package or runtime art service is needed. `student-board.svg` is an editable composed review board. `*-frames.svg` are contact sheets with two idle and six walk frames per facing. `export/student-proof.svg` and its hashed PNG are a full transparent 32-frame proof atlas, with frame/source/texture metadata in `export/student-proof.json`.

The proof demonstrates source/palette composition for four representative existing appearances: crop/trousers/backpack, brown braids/skirt/no bag, warm covered hair/skirt/backpack, light afro/trousers/no bag. These are a source prototype, not proof that every saved combination works in a production sprite renderer. The same compositing function could be used by NPCs, but no runtime NPC integration is implemented.

## Why it is blocked

The render is cleaner than the old primitive avatar but remains too toy-like and mostly front/side orthographic. It does not yet achieve the approved expressive young-adult, softly modeled elevated-view visual style. Hair/material treatment needs work, walking mostly translates limbs instead of showing convincing articulation, and skirt/covered-hair skin layering still needs refinement. Expanding this art into the world would hide a failed M1 gate.

Required next work: refine or replace the source character anatomy and perspective, make cloth/hair shading coherent, separate skin/face layers robustly, articulate the walk cycle and verify every Appearance choice with ground-anchor consistency. Then prove it in the actual outdoor Phaser renderer at the required viewports and perform human visual review. No production asset loader, camera, appearance save contract, world manifest, academic or life code changed in this checkpoint.

Baseline captures come from the existing real game, not a mock scene. Reproduce after `pnpm build`:

```
node scripts/art/capture-baseline.mjs
```

This starts disposable loopback memory servers and captures 360×640, 360×800, 390×844 and desktop. `CW_CHROMIUM_EXECUTABLE` optionally selects a locally installed browser; normal CI should use its pinned Playwright Chromium. The committed captures used local Chromium 153 software rendering at DPR 1, not a physical device or the CI-pinned Chromium. Baseline avatar height is calculated from source bounds and camera zoom; canvas dimensions and fetched texture-body bytes are measured.
