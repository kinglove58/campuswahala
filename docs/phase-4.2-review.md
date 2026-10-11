# Phase 4.2 checkpoint: M0 baseline / M1 art review blocker

**Incomplete — ART REVIEW BLOCKER. No Phase 4.2 completion or visual acceptance claim.**

Base: `7eded507ddb1876c77d25ecde94446667388123a` (merged documentation follow-up #16). One focused branch: `codex/phase-4.2-visual-world`. Exact head and CI links are recorded in the draft PR.

## Milestone state

| Milestone                   | Actual status           | Evidence / outstanding work                                                                                                                                                                                                                                                      |
| --------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| M0 baseline                 | Baseline/audit recorded | Real current-game captures at four viewports; source-derived player extent, actual canvas and texture-body bytes; existing routes/appearance audit; proposed ADR 015                                                                                                             |
| M1 original character proof | **BLOCKED; incomplete** | Editable original vector source, four wardrobe examples, four facings, 32-frame RGBA atlas and eight state contact sheets. Quality is insufficient; production sprite mapping, every-combination proof, articulated animation and actual upgraded in-game capture remain missing |
| M2 sprites/camera           | Not started             | Blocked on M1                                                                                                                                                                                                                                                                    |
| M3 exterior                 | Not started             | Blocked on M1                                                                                                                                                                                                                                                                    |
| M4 home                     | Not started             | Blocked on M1                                                                                                                                                                                                                                                                    |
| M5 library/lecture          | Not started             | Blocked on M1                                                                                                                                                                                                                                                                    |
| M6 final validation         | Not complete            | Checkpoint checks are not full phase acceptance                                                                                                                                                                                                                                  |

## Baseline findings

At 360×800 the measured Phaser canvas is 360×731. Default outdoor zoom is 0.88. The current default crop-hair character spans approximately 52.5 source units, hence 46.2 rendered pixels / 6.32% of canvas height. This is a source-bound calculation, not automatic pixel segmentation. The approved outdoor target is 8–12%. Canvas measurements and captures are in [baseline evidence](../art/characters/proof/baseline/measurements.json).

| Browser viewport | Canvas height | Existing zoom | Calculated player height | Canvas proportion |
| ---------------- | ------------: | ------------: | -----------------------: | ----------------: |
| 360×640          |           571 |          0.88 |                  46.2 px |             8.09% |
| 360×800          |           731 |          0.88 |                  46.2 px |             6.32% |
| 390×844          |           775 |          0.88 |                  46.2 px |             5.96% |
| 1280×900         |           812 |          1.05 |                55.125 px |             6.79% |

Existing building collision rectangles are uniformly 180×125 source units, excluding decorative roof/wall extents; mobile projected rectangles are 158.4×110 px. The screenshot and generator audit show that changing label/roof color alone cannot provide the required architectural variety.

Current conservative all-game-static JS: **557,948 gzip bytes**. Existing world budgets pass. Actual initial SVG response-body bytes were 1,852 on each mobile viewport and 3,704 on desktop; this is decoded HTTP body size, not compressed on-wire transfer. No physical FPS or first-load byte claim is made.

Local captures used Chromium 153.0.8010.0, DPR 1, software rendering. The normal pinned Playwright Chromium download returned corrupt empty archives; a scratch-only npm-distributed browser enabled the local captures. The alternate browser is not a repository dependency or CI change. These captures are separate from the existing CI-pinned browser acceptance.

## Contracts and version audit

The current world schema is 2 and current world revision is 2. Immutable v1 JSONs are in `packages/game-engine/src/revisions`; v2 is supplied by the current factory. API and BFF currently allow versions 1/2. Existing account safe-spawn contracts use world version and allowlisted spawn IDs; academic terms retain venue/world snapshots. None were changed.

The existing serialized Appearance choices remain: skin deep/brown/warm/light; crop/afro/braids/covered hair; black/brown hair colour; lime/clay/blue top; trousers/skirt; dark/white shoes; none/backpack. The proposed ADR explains future v2 preservation, new revisions and independently validated interior manifests. No new world revision, new route, schema change, migration or compatibility pass for a future revision is claimed.

## Original art attempt and why it stops

See [editable source and export instructions](../art/characters/README.md) and [review board](../art/characters/proof/student-board.png). The original source uses path-shaped anatomy/clothes, gradients, face features and modular palettes. It is not copied from LagosLife or another game.

The proof atlas is **104,164 PNG bytes**, 1024×640, 32 frames of 128×160, decoded RGBA **2,621,440 bytes**. The feet pivot is (64,148). These are preliminary experimental asset figures; no runtime transfer or mobile texture memory budget for a completed layered rig exists yet.

The character still has too-young/toy-like proportions, largely orthographic facings, insufficient modeled material/perspective coherence and simplistic walk articulation. Skirt-leg/covered-head skin layering needs refinement. Passing image integrity tests cannot cure those defects. The proof is deliberately kept outside runtime/public assets so it does not become the final character style by accident.

The mandatory milestone specification says: “If art still looks like primitive placeholders or no asset authoring tooling is available, **STOP; mark ART REVIEW BLOCKER**.” The approved art-direction document also rejects “cheap chibi blobs” and requires elevated perspective and modeled forms. This checkpoint stops because the actual rendered source does not yet satisfy that quality bar, not because user authorization is missing.

Next work is a stronger original character source with adult-student proportions, coherent four facings/materials and articulated motion, robust existing Appearance layering, then actual in-Phaser 360×800 gameplay proof and human visual review. Do not propagate this prototype into buildings or rooms first.

## Validation truthfulness

- Local production build and world compilation passed (baseline runtime unchanged).
- Existing world budget check passed; all-game-JS figure above is from that baseline build.
- Focused existing world/context tests: **26 passed**.
- Original proof verification passed: source/PNG hashes, dimensions/alpha, 32 unique frames, eight states, bounded ground anchor across frames.
- Local lint and typecheck passed. Unit suite: **151 passed, 13 PostgreSQL cases skipped** because no disposable PostgreSQL was configured locally. Exact checkpoint CI status is recorded in the draft PR. These skips are not passes.
- Existing Phase 4.1 PR CI `38089427870` passed all five jobs with 164 unit/PostgreSQL and 36 Playwright tests; post-merge CI `38115280934` also passed all five jobs. This is historical baseline evidence, not this checkpoint's test count.
- No new runtime browser gameplay acceptance, new-world compatibility, interior authority E2E, physical-device performance, visual approval or full Phase 4.2 exact-head security completion is claimed.

No runtime product code, academic/life authority, balancing, private caches, database, lock ordering, receipts, offline policy or reviewer-owned control files changed. No Phase 5 development. Human art approval, physical Android and production/device/content gates remain open.
