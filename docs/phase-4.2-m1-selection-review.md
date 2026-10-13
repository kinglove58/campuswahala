# PR #17 - M1 A/B master selection

Assignment: [reviewer 6147280115](https://github.com/kinglove58/campuswahala/pull/17#issuecomment-6147280115). Branch `codex/phase-4.2-visual-world`; base `7eded507ddb1876c77d25ecde94446667388123a`; iteration starts at `5bdba58a40692f93f5a924b93f2754e8e04288eb`. Exact terminal head/CI runs and artifact URLs are recorded in the draft PR body, avoiding a self-referential commit hash.

**M1 ART REVIEW BLOCKER remains. Neither A nor B has visual approval.** Prior rejected artwork is preserved as historical study, not promoted. PR draft/open/unmerged; no M2-M6 or Phase 5. This narrower reviewer assignment supersedes the older request to export representative variations at this point. Only two masters of one representative look are exported; no new Appearance permutations/NPCs until selection.

## Review and select a treatment

The first high-resolution still exports preceded the limited walking atlas proof. A uses cleaner sculpted gradients and tapered cloth. B uses looser cloth contours/knee folds, richer crown curls, warm cheek light, authored brush marks and a warmer smile. They share one anatomy rig and one outfit for comparison; B is an original SVG/stroke surface treatment with editable ORA companion, not a claim of human painting or a wholly different character design. Original editable source paths do not import rejected drawing geometry, pixels or external game artwork. No traced reference or AI full-sheet crops.

- [A/B high-resolution four facings](../art/characters/m1/treatments/comparisons/four-facing-a-b.png) (2048x1700), [editable SVG board](../art/characters/m1/treatments/comparisons/four-facing-a-b.svg).
- [A/B untouched 360x800 Phaser views](../art/characters/m1/treatments/comparisons/native-360x800-a-b.png), [four-facing native crops](../art/characters/m1/treatments/comparisons/native-four-facing-a-b.png). Each panel/crop retains original screenshot pixels; no resampling or retouching.
- A: [lateral contact sheet](../art/characters/m1/treatments/a/export/right-gait.png), [front contact sheet](../art/characters/m1/treatments/a/export/down-gait.png), [played Phaser WebM](../art/characters/m1/treatments/a/evidence/walk-and-movement-360x800.webm), [source/ORA instructions](../art/characters/m1/treatments/README.md), [measurements](../art/characters/m1/treatments/a/evidence/measurements.json).
- B: [lateral contact sheet](../art/characters/m1/treatments/b/export/right-gait.png), [front contact sheet](../art/characters/m1/treatments/b/export/down-gait.png), [played Phaser WebM](../art/characters/m1/treatments/b/evidence/walk-and-movement-360x800.webm), [measurements](../art/characters/m1/treatments/b/evidence/measurements.json).
- [Actual production baseline](../art/characters/proof/baseline/futa-360x800.png) remains unchanged. Older rejected source/proofs are outside the new A/B selection folders and are not loaded in these new captures.

All four directional gait sheets, individual native viewports/crops and keyboard-driven stills exist per option. The new lab loads exactly one new atlas and no NPC texture. It renders the existing FUTA v2 floor/roads/buildings/decorations through the same read-only proof ground, not a new M3 environment. Art approval requires viewing the complete videos; automatic frame/position checks and sampled visual inspection do not certify natural gait or style quality.

## Anatomy, projection and gait

Rounded cheeks/jaw/ears, crown surface/curl highlights, collar/hood top planes, modeled shoulders/sleeves and articulated hands, tapered or softer folded trousers, bag top/side/straps and dimensional shoe toe/sole planes use a coherent upper-left light. Smaller head/body proportion targets a stylized young adult. Left/right are separately authored elevated three-quarter contours with far-face planes, not a mirrored profile atlas. Projection/lighting are hand-authored vector approximations rather than a physically rendered 3D camera. They may still be insufficiently close to the approved concept; selection/rejection is a human gate.

Two idle poses and eight walk poses per facing, 40 cells per option / 80 total. Foot (64,177), logical source 128x192; core shadow remains at the fixed foot origin. Contact shadows diminish for lifted feet. Alternating contacts, support travel, lifted/bent swing knee, heel/toe roll, opposite arm travel and subtle recoil are authored. Source contact travel is 8 units per stance frame, paced at eight poses/s in the isolated lab (64 units/cycle laterally, 30.72 front/back). Production speed remains 230 world units/s; collisions and interaction radii are unchanged. Discrete eight-frame walking can still show between-frame plant drift; no inverse-kinematic/perfect-foot-lock claim.

Native 360x800 evidence has an actual 360x731 Phaser canvas below a 69px lab header, DPR1, zoom .88, shadow-excluded body about 73.1px / 10% canvas. Every held-key direction records all eight moving frames and at least 1.25 cycles of displacement using the existing WorldEngine, with pointer movement and reduced-motion proof. Software Chromium CANVAS render target 30 FPS / gait 8 FPS is an evidence configuration, not physical Android performance acceptance. No authority API requests, one look texture, zero NPCs, nominal 3,932,160 decoded RGBA bytes per option; encoded A/B total 791,994 bytes. Exact hashes/sizes are in the two manifests.

## Preservation and status

| Milestone / system                | Current result                                                                                                       |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| M0 baseline                       | Existing baseline, architecture drafts and measurements retained                                                     |
| M1                                | Two new original master treatments, editable sources and limited native motion proof; visual selection/approval OPEN |
| M2-M6                             | NOT STARTED; no production avatar/camera, NPC density, exterior or interior upgrade                                  |
| Phase 5                           | NOT STARTED and not authorized                                                                                       |
| Production apps/packages/worlds   | No changes in this iteration; v1/v2 manifests/snapshot compatibility retained                                        |
| Appearance                        | Seven-field schema, 768 canonical values, saves/guest mapping preserved; older regression proof retained             |
| Migrations                        | NONE; no database/world/interior schema/version change                                                               |
| Bed/desk/wardrobe/library/lecture | No new integration; existing academic/life authority remains unchanged                                               |
| Security/cache/dependencies       | No new dependency, scanner exemption, account/API path or PWA cache change                                           |

Only the isolated proof client/server accept a finite A/B selector. Default older proof still uses its existing four player examples/two NPCs and unchanged test assertions. Loopback host, exact static map, GET-only, no-store, nosniff and CSP are preserved. CI adds new source/atlas/ORA verification and actual native A/B capture/comparison/upload while retaining every old pipeline, scanner and browser test. Exact files are in [selection inventory](phase-4.2-m1-selection-files.txt); full PR scope is also listed there.

## Validation

Passed locally: lint, typecheck, 151 existing tests, cached unchanged production builds/world compilation, world/JS budgets (557,902 bytes conservative all-static-game-JS gzip), dependency audit (no known vulnerabilities), unchanged original 32-frame proof, original ZIP/768-option/six-example M1 regression, new 80 exact source-to-packed-pixel poses, 104 real ORA semantic part layers, source/atlas hashes, bounded alpha and all four actual moving Phaser facings, pointer/reduced motion, zero authority requests. Exact-cell comparison accounts for the documented PNG source-over premultiplied-alpha step, without loosening equality. A local old-source integrity failure caused by Windows CRLF checkout was resolved by restoring the two untouched source files to their committed LF bytes; no historical source/export content or assertion was changed. Initial new lint missing URL import was corrected.

Skipped locally: 13 PostgreSQL cases. Unavailable locally: Docker daemon/PostgreSQL/container/Trivy/SBOM; these are required exact-head CI checks, not local passes. Full 36-case production browser suite, PostgreSQL, CodeQL, Semgrep, complete-history secret scan, Bicep, containers, SBOM and exact-head build results are recorded in the final PR body after CI. Do not treat prior-head green checks as this head's results. No migration upgrade run is needed for this iteration (no migrations); existing integration upgrade checks remain part of CI.

Human gates: A/B visual selection (or reject both), fit to approved soft-modeled direction, anatomy/projection/cloth/face quality, complete native WebM gait/foot/shadow review, originality acceptance, physical Android/performance and later production integration. Detailed source/editing limits and reproducible recipes are in the [treatment README](../art/characters/m1/treatments/README.md). If neither treatment clears the art gate, remain blocked at M1. **Stop for visual review. Do not propagate either to all Appearance variations before explicit selection.**
