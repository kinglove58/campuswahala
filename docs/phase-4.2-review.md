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

Next work requires the [external character-asset handoff](phase-4.2-art-handoff.md). Do not propagate either rejected prototype into buildings or rooms first.

## PR #17 reviewer follow-up

Read reviewer comment [6109240047](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6109240047) and the existing reviewer-owned Phase 4.2 specifications. Continue the same branch/PR; no merge or later milestone advancement.

The exact Semgrep artifact `11699933196`, from PR run `38134411420`, identifies two `typescript.react.security.react-insecure-request.react-insecure-request` findings at `scripts/art/capture-baseline.mjs:35` and `:36`. Both were HTTP readiness fetches. The fix removes those requests and checks fixed loopback listening sockets with bounded timeouts and child-process liveness. No remote host, credentials or response body is involved in readiness. The existing local guest browser flow still uses the existing BFF; no endpoint, scanner rule, exclusion or assertion was weakened.

Security-fix commit: `d099d5ade55f8538f013169220c787abc056ef4b`. Local Semgrep **1.180.0**, matching CI's two configuration packs and strict/error flags, scanned **74 rules / 89 source files with zero findings and zero errors**. CI PR run [38142992522](https://github.com/kinglove58/campuswahala/actions/runs/38142992522) passed its Semgrep, CodeQL, secret and container jobs when recorded; main verification was still running at this document checkpoint. Terminal evidence for the final follow-up head belongs in the PR body, not an assumed pass here.

The fixed capture script was executed against disposable local memory API/BFF/game servers and produced all four baseline viewports successfully. Existing baseline images are preserved. Local lint/typecheck, 151 tests, original vector proof integrity and existing world budgets passed; 13 PostgreSQL cases were skipped locally. The full PostgreSQL/browser/security gates remain CI responsibilities.

A second [original offline Blender study](../art/characters/offline/README.md) tests genuine modeled source rather than another enlargement of primitive Phaser graphics. It has original procedural cheek/jaw/cloth profiles, face/hair/shoe/backpack materials, a single elevated orthographic projection, all current Appearance parameter mappings and opposing articulated limb poses. Actual CPU-rendered exports show four representative looks/facings and six walk frames in four directions for the first look: **40 transparent 128×160 frames, 754,245 encoded frame bytes / 3,276,800 decoded RGBA bytes**, plus a 640×800 close-up and contact sheets. Source, export recipe, source/frame hashes and sizes are retained. The binaries and dependencies used for authoring are scratch-only, not game dependencies. This is not a completed atlas, runtime transfer/performance measurement, complete idle export, exhaustive appearance proof, actual upgraded-game screenshot or accepted NPC rig.

Visual inspection rejects this study too: segmented mannequin-like limbs, synthetic face/hair treatment, insufficient expressive anatomy and cloth deformation. **M1 remains unresolved.** Polished source-quality character assets now require a human character artist or experienced rig authoring pass as specified in the handoff. No service has been commissioned and no accepted external assets have been supplied. The reviewer explicitly requires M1 visual approval before M2–M6. The stop is the repository's quality gate, not a request for more user authorization or another pasted prompt.

No runtime product code, public asset replacement, camera/world/interior integration, migration, balancing or authoritative behavior changed in this follow-up. M2–M6 and Phase 5 remain unstarted; PR #17 remains draft and unmerged.

## Validation truthfulness

### Mobile Wahala interceptor follow-up

Reviewer comment [6110156507](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6110156507) identifies push run [38144126322](https://github.com/kinglove58/campuswahala/actions/runs/38144126322): 35/36 browser tests passed; mobile Wahala failed. Its retained trace (`browser-failures` artifact `11704801644`) records `route.fetch` failing with `socket hang up` about 2 ms after starting, before an HTTP response. The subsequent missing retry button is a consequence of the route handler throwing before it fulfills or aborts the intercepted browser request. The trace does not establish a server-side product defect or a committed choice.

The interceptor now uses Playwright's bounded `maxRetries: 2` for `ECONNRESET` only. It forwards the same intercepted body and command ID; HTTP status failures are not retried by this option, and exhausted transport retries still fail the test. The deliberate response loss still requires a successful response and captured receipt. All existing quota handling, canonical minute, revision, bounded metric/passive decay, resolved occurrence, same-key receipt, exactly-once and refresh/history assertions remain unchanged. No production retry, security control, timeout, scanner or gameplay state was changed. Exact-head terminal CI and browser evidence are recorded in PR #17 when available; this document does not presume success.

Both Semgrep fixes remain in place. Original editable Blender source, exports, rejected studies and artist handoff remain preserved outside runtime assets. **ART REVIEW BLOCKER remains active:** an external artist must supply the original expressive master rig, continuous anatomy/cloth, consistent elevated projection, four-direction idle/walk frames, Appearance mappings, representative player/NPC looks, transparent reproducible exports and actual Phaser mobile comparison specified in the handoff. No rejected art is approved or promoted; M2–M6 and Phase 5 remain unstarted.

- Local production build and world compilation passed (baseline runtime unchanged).
- Existing world budget check passed; all-game-JS figure above is from that baseline build.
- Focused existing world/context tests: **26 passed**.
- Original proof verification passed: source/PNG hashes, dimensions/alpha, 32 unique frames, eight states, bounded ground anchor across frames.
- Local lint and typecheck passed. Unit suite: **151 passed, 13 PostgreSQL cases skipped** because no disposable PostgreSQL was configured locally. Exact checkpoint CI status is recorded in the draft PR. These skips are not passes.
- Existing Phase 4.1 PR CI `38089427870` passed all five jobs with 164 unit/PostgreSQL and 36 Playwright tests; post-merge CI `38115280934` also passed all five jobs. This is historical baseline evidence, not this checkpoint's test count.
- No new runtime browser gameplay acceptance, new-world compatibility, interior authority E2E, physical-device performance, visual approval or full Phase 4.2 exact-head security completion is claimed.

No runtime product code, academic/life authority, balancing, private caches, database, lock ordering, receipts, offline policy or reviewer-owned control files changed. No Phase 5 development. Human art approval, physical Android and production/device/content gates remain open.

## Supplied in-house M1 follow-up ? 12 October 2026

The actual reviewer-hash-matched ZIP is now staged and verified. A new modular vector/52-layer OpenRaster candidate and an isolated actual Phaser proof are available in [M1 intake review](phase-4.2-m1-intake-review.md). Canonical Appearance contracts, six examples, 40 unique poses each, four viewport captures, movement and reduced motion are exercised. This resolves binary availability and adds real M1 engineering evidence; it does not resolve the approved visual-quality standard or install production sprites. ART REVIEW BLOCKER remains. All earlier rejected sources, baseline and transport/security fixes are preserved. M2?M6/Phase 5 remain unstarted; PR #17 remains draft/unmerged. Final exact head and CI are in the updated PR body.
