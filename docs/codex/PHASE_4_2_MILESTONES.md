# CampusWahala Phase 4.2 — implementation milestones and evidence gates

**Active phase:** 4.2 Visual World & Navigable Interiors
**Status:** execution plan; one Phase 4.2 implementation PR; no Phase 5.
**Source of authority:** \`docs/codex/ACTIVE_PHASE.md\` and the project constitution. This document specifies order, deliverables and review checkpoints.

## Workflow

- Read current master and all Phase 4.2 reviewer-owned docs first.
- Use the existing suggested branch \`codex/phase-4.2-visual-world\`; do not open separate competing phase PRs.
- Implement checkpoints sequentially. Each completed checkpoint should have a clearly named commit or PR update and a brief **evidence summary** (screenshots/tests/blockers).
- Progress after a checkpoint only if its objective tests and deliverables pass; do not hide unresolved core visual defects.
- At the **M1 art-proof checkpoint**, if quality/asset tooling is not sufficient, stop for human art review rather than proceeding to wire placeholder art into the whole game.
- Subsequent milestones can continue without user copy/paste when their acceptance gates pass; do not automatically merge.
- Maintain a progress table in the Phase 4.2 PR body with M0–M6 and actual status/evidence.
- The final PR requires all Phase 4.2 checks and screenshots before reviewer approval. Local progress/partial CI does not establish phase completion.
- Reviewer-owned \`docs/codex/*\` files must not be changed by the implementation agent; changes can be proposed in PR comments.

## M0 — baseline, contracts and authority safety

**Goal:** freeze what must remain compatible, establish visual baselines and check tooling.

Deliver:
1. audit existing world v1/v2 immutable routes, manifest creation, safe-spawn versioning and snapshots;
2. record Phase 4.1 baseline tests/CI and current renderer on 360×640, 360×800, 390×844 and desktop;
3. record baseline player rendered height, default camera, main building relative size, all-game-JS gzip and actual texture transfer;
4. ADR draft covering v3 world vs v2 snapshots, versioned interior schema, sprite pipeline, authority separation and fallback;
5. inventory actual authoring/export tooling and asset source/provenance method;
6. document all current \`Appearance\` values and asset-loading interface.

**Gate M0:** no changes to academic/life authority, no untracked migrations, baseline screenshots/measurements and version plan documented.

## M1 — ORIGINAL CHARACTER ART PROOF (VISUAL QUALITY GATE)

**Goal:** produce one genuine, attractive, original student character system prototype **before** propagating its style to the entire world.

Deliver:
1. source project or layered authoring files for original character;
2. front/up/left/right visual facings and consistent ground anchor;
3. 8-state idle/walk animation at initial representative frame counts;
4. modular proof of existing hair/top/bottom/skin/accessory variants;
5. test 4 representative combinations that include braids/covered hair, skirt/trousers, contrasting skin/top, with and without backpack;
6. original palette/material/shape sheet;
7. a real in-Phaser gameplay capture at 360×800 outdoors, plus a higher-resolution character view;
8. small NPC variant sharing rig;
9. preliminary atlas/texture sizes and export instructions;
10. comparison against the existing primitive avatar at *same viewport*.

**M1 human-quality check:** Is the player noticeably more polished, expressive and legible, rather than simply larger? Are the frames consistent? Can the game scale it on a phone without losing identity? Do the character and sample materials look like one product?

**Gate M1:** original usable sprites, source, animation and in-game proof exist. If art still looks like primitive placeholders or no asset authoring tooling is available, **STOP; mark ART REVIEW BLOCKER**. Do not implement later rooms using a fake claim that character art is finished.

## M2 — close camera, player/NPC visual system

**Goal:** the actual outdoor player becomes readable and physically present in the campus.

Deliver:
1. reusable layered avatar/sprite renderer with stable spritesheet registry, current Appearance mapping and direction/state handling;
2. existing saved/guest character options remain intact;
3. NPCs reuse sprite architecture with bounded updates and coherent animation;
4. pure camera profiles for viewport, zoom bounds, scene (outdoor/interior), resize and reduced-motion;
5. outdoor apparent player height ~8–12% of 360×800 gameplay viewport, verified numerically and in screenshots;
6. interior camera target ~10–14% captured in a test staging scene;
7. collision/interaction radius independent of sprite dimensions;
8. Pocket Map overview remains unchanged in purpose; screen switching maintains close game zoom.

**Tests:** unit animation direction/appearance mapping/camera sizes; Playwright outdoors + movement + Pocket Map; performance sample; accessibility/reduced motion.

**Gate M2:** the main character no longer looks tiny; no broken navigation/avatar save; no authority state changes.

## M3 — meaningful original exterior world

**Goal:** campus exterior moves beyond sparse map-like rectangles.

Deliver:
1. v3-ish new world revision, preserving old v2 world/academic snapshots;
2. well-scaled differentiated building archetypes and safe entrance/path adjustments;
3. original prop library (trees, benches, signs, bins, noticeboard, kiosks, shelters, vehicles etc.);
4. static background buildings and visual floor/road/path treatment;
5. foreground occlusion/depth sorting, shadows and efficient static batching/chunking;
6. distinct FUTA/OAU/UNILAG visual configuration without hard-coded UI forks;
7. collision/spawn/travel semantics unchanged;
8. before/after exterior screenshots across target viewports.

**Tests:** world manifest validation, safe spawns/collision/pathfinding, old-version routes and snapshot compatibility, NPC cap and asset budgets.

**Gate M3:** at least one dense, believable exterior scene and campus-specific differences. No blocking of essential travel or decorative/factual identity confusion.

## M4 — reusable interior engine + hostel/home

**Goal:** Phase 4 home becomes a walkable space with meaningful real affordances.

Deliver:
1. versioned validated interior-manifest schema and reusable scene controller/renderer;
2. safe spawn, collision, floor/walls, door transitions, character movement and room camera;
3. original home bed/desk/chair/wardrobe/window/personal props;
4. bed → existing SLEEP, desk → authorized STUDY/REST, wardrobe → validated Appearance edit/save, phone → CW Pocket, exit → exterior;
5. browser scene position persists through phone open/close and action refresh;
6. visual interior presence never sets \`AcademicTerm.presenceVenueId\`;
7. semantic nearby-action controls accessible on mobile/keyboard/reduced motion;
8. real browser gameplay from exterior through door, bed, desk, wardrobe, exit.

**Tests:** interior manifest strict invalid inputs, reachability, authoritative denial before server travel, sleep clock/life one-time effects, desk action, wardrobe persistence and exit.

**Gate M4:** no modal-only mock room; every named anchor reachable and actual server authority remains unchanged.

## M5 — library and lecture interiors + coherence

**Goal:** full minimum room family, same art/character/interaction semantics.

Deliver:
1. navigable fictional library with shelving/table/aisle/exit and authorized study access;
2. navigable fictional lecture hall with aisle/seats/board/exit and authorized academic attendance/test/exam affordance;
3. consistent room-to-room/outdoor scale, shadows, furniture depth;
4. real browser proof visual room entry alone grants no attendance;
5. real browser proof authoritative travel + command performs legitimate academic action;
6. resume/back/reduced-motion/phone transitions do not reset scene unexpectedly;
7. optional NPCs remain fictional and bounded.

**Gate M5:** all three rooms work as genuine walkable spaces with correct authority; no real university room-layout claims.

## M6 — polish, performance, device-ready evidence and final PR

**Goal:** a credible ship-quality *visual* phase ready for technical reviewer audit.

Deliver:
1. actual original art source, export pipeline, hashed runtime assets and updated manifest/index;
2. accessibility/readable prompts, touch testing, low-motion, loading fallback;
3. all original gameplay tests, academic/life/Wahala/Phase 4.1 regressions;
4. old world/saved safe-spawn/snapshot upgrade and active-legacy-term compatibility tests;
5. constrained network and PWA public asset/privacy checks;
6. conservative all static JS <=~625 KB gzip or justified exception, separate measured active texture bytes and atlas memory;
7. browser screenshot/contact-sheet artifact set listed in asset checklist;
8. mobile 360×640 / 360×800 / 390×844 and desktop visual evidence; no false physical-device claims;
9. CI: lint/typecheck/unit/PostgreSQL/Playwright/build/world budgets/dependency audit/CodeQL/Semgrep/full-history TruffleHog/Trivy/containers/SBOM/Bicep;
10. ADR, README, implementation status, world/interior docs and full PR review evidence.

**Gate M6:** complete regression suite green on exact PR head; visual quality evidence supports M1–M5; no Phase 5 code; reviewer decides merge.

## Required artifact/evidence matrix

| Checkpoint | Technical proof | Human-visible proof |
| --- | --- | --- |
| M0 | baseline audit/version plan | baseline screenshots |
| M1 | original source, atlas, frame/appearance proof | character sheet + mobile before/after |
| M2 | camera/animation tests and save mapping | 360×800/desktop close-player captures |
| M3 | manifest/collision/culling tests | exterior venue and campus identity images |
| M4 | interior/authority/Postgres/E2E | navigable hostel bed/desk/wardrobe captures |
| M5 | interior/academic authority/E2E | library + lecture walkthroughs |
| M6 | full exact-head CI/security/size checks | mobile/desktop artifact pack and review report |

## Suggested iteration hygiene

- Treat M0/M1 as proofs; do not invest in huge quantity before visual style is credible.
- Reuse rig, shading/light direction and prop materials. Do not mix 3D-like characters with flat unrelated room art.
- Record blockers clearly; final report should state *what exists* rather than what was planned.
- Camera proximity is a gameplay UX change; prevent camera clipping and loss of destination readability.
- Do not conflate CI visual screenshots with independent human quality approval.
- If true source-quality art is out of reach for Codex, produce a clean and honest blocker handoff, not mislabeled completion.

## End condition

After M6, PR remains unmerged until the reviewer checks exact head, real code, artifacts and CI. Reviewer may request focused Phase 4.2 acceptance revisions. Phase 5 remains unstarted until Phase 4.2 is approved and merged.
