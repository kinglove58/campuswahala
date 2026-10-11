# ACTIVE PHASE — Phase 4.2 Visual World & Navigable Interiors

Status: READY_FOR_IMPLEMENTATION  
Owner: reviewer  
Repository: `kinglove58/campuswahala`  
Current master includes Phase 4.1 and the reviewer-owned Codex handoff workflow.  
Reviewed gameplay base: `0e4bd439d152b74499d491ace432a55d85e2699a`  
Handoff merge: `19c0dd2b4bea6da623d46af6b19c36b2d6b1f965`

## PHASE 4.2 APPROVED ART DIRECTION — BINDING ADDENDUM

**Reviewer decision (11 October 2026):** the approved CampusWahala visual approach is **original stylized 3D-inspired African/Nigerian university-student characters, exported/composited as lightweight 2D directional sprites in the existing Phaser top-down/2.5D game.**

This is **not** permission to rebuild the entire product in full real-time 3D.

The previous reference image is inspiration for expressive, polished character design, **not a source of reusable assets, character likenesses, copied costumes or game trade dress**.

Read and follow these newly published reviewer-owned specifications **in addition to this entire active-phase file**:

1. **[PHASE_4_2_ART_DIRECTION.md](PHASE_4_2_ART_DIRECTION.md)** — approved visual style guide and character design system, avatar proportions, existing appearance compatibility, original offline asset pipeline, outdoor/building/interior visual grammar, quality gate.
2. **[PHASE_4_2_ASSET_CHECKLIST.md](PHASE_4_2_ASSET_CHECKLIST.md)** — concrete original sprite/atlas/source deliverables, building/props, hostel/library/lecture furnishings, scene interactions, quality/provenance/performance evidence.
3. **[PHASE_4_2_MILESTONES.md](PHASE_4_2_MILESTONES.md)** — ordered M0–M6 checkpoints and PR evidence. M1 is an **original-character-art quality gate**: do not build entire world using unconvincing placeholders.

The three linked specifications are **mandatory** and augment the original 53 sections below. If wording differs, use the more specific requirement without weakening existing security/authority rules or original-asset quality goals.

### Explicit visual implementation requirements

- Prefer original offline 3D authoring → reproducible 2D sprite export and atlas packing, **or** original layered 2D/vector source with genuinely modeled 3D-inspired look. Keep editable sources and exact export steps. **Do not represent enlarged primitive graphics as completed character art.**
- Implement one reusable appearance-aware avatar/sprite rig with **idle + walk in up/down/left/right**; NPCs share the rig. Preserve every existing `Appearance` choice and saved avatars.
- At default **360×800 gameplay canvas**, target visually measured player height **8–12% outdoors** and **10–14% in navigable interiors**, adjusting camera/asset scale without inflating collision geometry.
- The CW Pocket Map remains a wide overview; the world is a closer player-following scene.
- Original exterior architecture, props and interiors must share character perspective, light direction, material palette and visual fidelity. Hostels/home, library and lecture room must be *navigable*, not illustrated modal-only panels.
- Bed, desk and wardrobe call **existing** server-authoritative life/academic/account paths; visual scene entry or furniture proximity never grants game progression.
- Source/licensing provenance, sprite sheet/frame/atlas dimensions, memory/transfer metrics, safe versioned assets, responsive mobile screenshots and old world/academic compatibility are required.
- Maintain the existing Phase 4.2 JS/world/security/performance requirements, and explicitly report **human visual quality review** and **physical Android device** gates separately from CI.
- If polished original character source art is not achievable in the available authoring environment, stop at M1 with an **ART REVIEW BLOCKER**, not a false "Phase 4.2 complete" claim.

### Checkpoint and finish protocol

Use one focused Phase 4.2 implementation branch/PR. Record actual completion and evidence for **M0 baseline → M1 original character art proof → M2 sprites/camera → M3 exterior → M4 navigable home → M5 library/lecture → M6 CI/visual acceptance**. The milestone file defines required evidence at each step. Checkpoint commits and PR updates allow reviewer inspection without needing the user to copy another large prompt. Do not merge or begin Phase 5 automatically.

---

## Mission

Upgrade CampusWahala from a visually miniature/map-like campus into a close, readable, lived-in top-down university world.

The reference inspiration showed useful design qualities:

- characters occupy a meaningful portion of the screen;
- camera framing feels close to the player rather than zoomed out over the whole map;
- buildings feel like places rather than map symbols;
- homes/interiors are navigable spaces with furniture and interactions;
- streets and campuses feel dense with props, people and architectural depth;
- indoor/outdoor character scale feels continuous.

These are design principles only.

Do **not** copy LagosLife or any other game's:

- character art;
- building art;
- UI;
- layouts;
- assets;
- animation frames;
- branding;
- trade dress.

All Phase 4.2 art and code must be original CampusWahala work.

Do NOT begin Phase 5.

Do NOT add social, friends, chat, multiplayer, reputation, leaderboards, economy, Campus Cash, payments, ads or commerce.

---

# 1. Inspect current master first

Before changing code, inspect:

- `AGENTS.md`;
- reviewer-owned Codex control files;
- current `master`;
- Phase 2 world engine;
- Phase 3 academic authority;
- Phase 4 life/home/venue authority;
- Phase 4.1 Campus Life context;
- current Phaser renderer;
- world manifests/version routes/assets;
- performance budgets;
- PWA rules;
- mobile acceptance procedures.

Create a focused branch:

`codex/phase-4.2-visual-world`

Do not rebuild previous phases.

---

# 2. Architectural boundary

Phase 4.2 is primarily a **rendering/world-presentation upgrade**.

Preserve all existing authoritative rules.

The browser may render:

- player movement;
- interior movement;
- animation;
- camera;
- props;
- doors;
- furniture;
- cosmetic NPC movement.

But authoritative gameplay state remains server-owned.

Do not let cosmetic movement directly grant:

- academic attendance;
- study credit;
- life effects;
- sleep;
- food effects;
- exercise effects;
- grades;
- progression;
- future money/rewards.

Existing authoritative academic/life commands remain the only state-changing path.

---

# 3. Separate gameplay camera from map overview

The current world feels too miniature because the same broad world scale dominates the gameplay view.

Change the experience so:

## Gameplay view

Close camera following the player.

The player should feel physically present in the campus.

## CW Pocket map

Retains the wide bird's-eye overview.

Do not solve gameplay readability by making the Pocket map less useful.

The world camera and map presentation are separate concerns.

---

# 4. Outdoor character readability target

Create an explicit visual-scale contract.

At a 360×800 gameplay viewport, the main player should normally render at approximately:

**8–12% of viewport height outdoors**

under the default camera.

That is a visual target, not a collision/body-size requirement.

At common mobile sizes, the player must be immediately readable:

- head/hair;
- top;
- lower clothing;
- shoes;
- backpack/accessory.

NPCs should use the same visual scale system.

Do not simply inflate the collision radius with the artwork.

Keep collision/gameplay footprint separately controlled.

---

# 5. Interior character readability target

Inside navigable rooms, default framing may be slightly closer.

Target approximately:

**10–14% of viewport height**

for the player indoors where layout permits.

Do not zoom so closely that room navigation becomes frustrating.

---

# 6. Camera profile

Replace scattered magic zoom numbers with a pure/versioned camera-profile function.

It should derive:

- default outdoor zoom;
- default interior zoom;
- min zoom;
- max zoom;
- follow smoothing;
- mobile/desktop framing.

Keep user zoom controls, but choose a substantially closer default than the current miniature presentation.

The minimum default must not automatically collapse to a campus-wide view simply because the world is large.

Camera remains clamped to scene bounds.

Reduced-motion mode should use immediate/low-motion follow behavior.

Add unit tests for representative viewports:

- 360×640;
- 360×800;
- 390×844;
- desktop.

---

# 7. Character visual system

Replace the tiny primitive-only avatar presentation with a reusable original CampusWahala character visual system.

Use an architecture such as:

`CharacterVisual / AvatarRig / CharacterAtlas`

with layered parts compatible with the current Appearance model.

Support at minimum:

- skin tone;
- hair;
- hair colour;
- top;
- trousers/skirt;
- shoes;
- backpack/accessory.

Do not throw away saved appearance choices.

If internal rendering representation changes, map existing Appearance values deterministically.

No destructive profile migration.

---

# 8. Directional animation

Add lightweight original animation states:

- idle down;
- idle up;
- idle left;
- idle right;
- walk down;
- walk up;
- walk left;
- walk right.

Diagonal movement may select the nearest cardinal animation for Phase 4.2.

The player should face the latest meaningful movement direction.

NPCs may use the same rig.

Animation must stop or reduce appropriately in reduced-motion mode.

Do not animate at expensive frame rates merely for cosmetic smoothness.

---

# 9. Original asset strategy

Prefer a compact original sprite/vector atlas pipeline over huge independent PNG files.

Allowed:

- original local sprite sheets;
- original local SVG/vector parts;
- generated textures built from original project assets.

Do not hotlink third-party game assets.

Do not depend on remote runtime art hosts.

All production asset references remain versioned/hashable and compatible with the existing public asset/PWA boundary.

---

# 10. World versioning

Do not silently mutate immutable historical world content.

Introduce a new world revision/version for the visual upgrade.

If the manifest contract must change for interiors/decorative structures, introduce a compatible new schema/version rather than redefining old v2 semantics.

Preserve existing versioned world routes/assets required by regression/history.

Existing active academic terms that already snapshot older world/venue data must remain valid.

Do not rewrite completed academic terms.

New simulation terms may use the new current world version after compatibility is proven.

Document the migration/version strategy in an ADR.

---

# 11. Exterior building scale

The current generated venue buildings are visually too small and uniform.

Create larger, better differentiated building archetypes.

Target visibly distinct types such as:

- hostel/residence;
- lecture block;
- library;
- admin block;
- food/café/market structure;
- clinic/care building;
- sports pavilion;
- social/common space;
- religious/reflection space where configured;
- transport shelter.

Do not rely only on label/color differences.

Building footprints should feel large relative to the player.

Tune geometry safely rather than blindly multiplying every rectangle.

---

# 12. Campus-specific architectural language

Keep one engine, but let campus configuration drive visual language.

Examples already present:

- FUTA: pitched-roof / greener campus language;
- OAU: heavier/brutalist academic forms;
- UNILAG: canopy/tower/waterfront-inspired language.

Expand these distinctions through data/configuration.

Do not hard-code React branches like:

`if campus === "futa"`

for every drawing decision.

Use versioned art-direction/config data.

---

# 13. Dense-but-readable exterior world

Add original environmental density without creating clutter.

Useful prop types include:

- benches;
- noticeboards;
- streetlights;
- bins;
- planters;
- trees/palms;
- fences/low walls;
- kiosks;
- parked fictional campus vehicles;
- bicycles;
- tables/chairs;
- shaded waiting areas;
- signs;
- decorative non-enterable buildings;
- paved walkways;
- courtyards;
- lawns.

Props must not imply factual real-campus placement.

They are fictional/compressed gameplay scenery unless separately bound to verified identity.

---

# 14. Background/decorative buildings

Support non-venue scenery buildings independently from enterable venues.

They may provide:

- campus density;
- streetscape;
- skyline;
- architectural rhythm.

They must:

- participate in collision where appropriate;
- not expose venue actions;
- not become fake published campus facts;
- remain clearly gameplay geometry.

---

# 15. Depth and occlusion

Improve scene depth.

Use stable Y/depth sorting for characters and appropriate props.

Players/NPCs should visually pass:

- behind foreground trees/objects;
- in front of objects when physically below them.

Avoid obvious cases where every object is painted on one flat layer.

Maintain deterministic ordering.

---

# 16. Shadows and grounding

Use lightweight shadows to visually ground:

- player;
- NPCs;
- vehicles;
- buildings where appropriate.

Keep shadows simple enough for mobile performance.

Do not introduce expensive dynamic lighting.

---

# 17. NAVIGABLE INTERIOR ENGINE

Phase 4.2 must replace the current key "mini interior panel" experience with a reusable navigable interior scene system.

At minimum support three interior archetypes:

1. hostel/home;
2. library/study interior;
3. lecture hall/classroom interior.

The same engine must work across FUTA/OAU/UNILAG with data-driven visual variation.

Do not create three independent one-off React pages.

---

# 18. Interior manifest

Create a versioned data contract for interiors.

Conceptually include:

- id;
- version;
- venue type;
- bounds;
- entry spawn;
- exit anchor;
- collision rectangles/polygons;
- floor/wall style;
- props;
- interaction anchors;
- optional NPC spawns;
- asset bundle references.

Strictly validate:

- bounds;
- collisions;
- spawn safety;
- unique IDs;
- interaction references;
- asset paths;
- size budgets.

No executable scripts in content.

---

# 19. Virtual hostel/home

The player's virtual home must become a real navigable room/space rather than only a modal illustration.

The hostel/home interior must contain at minimum:

- bed;
- desk/chair;
- wardrobe/storage;
- door/exit;
- window or visual wall detail;
- small room props;
- clear walking space.

It should feel lived-in, not like an empty rectangle.

This remains **simulation housing**, not the user's actual residence.

---

# 20. Home interaction anchors

Use semantic interior interactions.

## Bed

Expose existing server-authoritative sleep options.

The bed itself does not grant energy.

Click/tap/interact:

`bed → existing SLEEP command`

only when existing life authority permits it.

## Desk

May expose:

- existing REST where appropriate;
- existing STUDY academic actions when hostel is an allowed study venue.

No new study-credit shortcut.

## Wardrobe

Open the existing appearance editor or a focused wardrobe experience.

Saving appearance follows the existing account/world-state contract.

## Phone

Open CW Pocket.

## Door

Exit back to the exterior scene.

---

# 21. Interior authority

Entering and walking inside an interior is cosmetic visual state.

It does NOT automatically change:

`AcademicTerm.presenceVenueId`

or life authority.

Existing authoritative travel semantics remain intact.

If the player has visually reached/entered a venue but does not yet have matching authoritative presence:

- allow visual exploration if desired;
- clearly indicate when a gameplay action requires confirmed campus travel;
- do not silently award authority.

Add regression tests for this.

---

# 22. Hostel/home continuity

When the authoritative home venue matches and the player enters the home interior:

the experience should feel continuous.

Example:

```
campus exterior
→ hostel door
→ short scene transition
→ player appears at interior entry
→ walk to bed
→ sleep
→ canonical academic/life time advances
→ interior remains/resumes coherently
```

Do not reset the player to an unrelated map point.

---

# 23. Library interior

Create a navigable library/study interior with original fictional layout.

Include visual elements such as:

- desks/tables;
- chairs;
- bookshelves;
- study zones;
- exit.

Study actions still use existing academic authority.

No real-library floorplan claim.

---

# 24. Lecture hall interior

Create a navigable lecture/classroom interior.

Include:

- rows of desks/seats;
- board/screen;
- front teaching area;
- doors/exit.

Do not use a named real lecturer.

Attendance/test/exam actions remain existing server-authoritative commands.

Visual presence alone never counts as attendance.

---

# 25. Food and other venues

Food/social/admin/clinic/sports/religious/transport venues do not all require full navigable interiors in Phase 4.2.

However, improve their exterior/panel presentation so they no longer feel like generic identical boxes.

Architect the interior system so additional archetypes can be added later without engine rewrites.

---

# 26. Scene transitions

Add a lightweight enter/exit transition.

Examples:

- short fade;
- short camera dissolve.

Keep it fast.

Reduced-motion mode should use immediate/simple transition.

Do not use long cinematic loading sequences.

---

# 27. Input

Preserve:

- keyboard movement;
- pointer/tap movement;
- mobile usability.

Interior navigation must work at 360×800.

Tap targets for semantic interactions must be comfortable on touch devices.

Do not require precise tiny clicks on furniture pixels.

---

# 28. Interaction discovery

When close to an interaction anchor, show concise context such as:

- Sleep;
- Study;
- Wardrobe;
- Exit;
- Open Pocket.

Do not permanently cover the screen with interaction buttons.

Use existing interaction concepts where practical.

---

# 29. Visual avatar vs collision body

Keep rendering size separate from authoritative/local collision footprint.

A larger-looking character must not suddenly collide with half the campus.

Define:

- visual bounds;
- collision radius/body;
- interaction radius

independently.

Add tests for collision safety after scale changes.

---

# 30. NPCs

Upgrade NPC presentation using the same visual language.

Keep existing privacy/content rules:

- fictional;
- no named real students/staff;
- bounded active NPCs;
- no social multiplayer.

NPCs should:

- have readable appearance;
- use idle/walk animation;
- preserve current lightweight patrol/wander behavior;
- depth-sort correctly.

Do not materially increase AI/CPU complexity.

---

# 31. World density budget

Do not solve visual emptiness by rendering hundreds of live objects.

Use chunking/culling.

Maintain or improve:

- visible-zone loading;
- off-screen unload;
- bounded active NPC count;
- no per-frame database/network work.

Decorative static props may be batched where practical.

---

# 32. Performance budgets

Current conservative all-static game JS is approximately 558 KB gzip across all static chunks, not measured first load.

Phase 4.2 should keep the conservative all-static game JS upper bound at or below approximately:

**625 KB gzip**

unless the final report gives a compelling measured reason for a small exception.

New environment/interior art must lazy-load by active zone/interior.

Target:

- no giant monolithic bitmap;
- individual compressed interior/zone bundles kept small and versioned;
- only currently needed art decoded/rendered.

Do not claim physical-device performance without physical measurements.

---

# 33. Renderer target

CI/emulated acceptance should target stable gameplay and avoid obvious long frames.

Physical lower/mid-range Android remains a human gate.

Do not claim 30/60 FPS on physical devices unless actually measured.

Add instrumentation for:

- outdoor active objects;
- interior active objects;
- camera zoom/profile;
- frame timing sample;
- loaded bundle bytes.

Keep metrics local/privacy-safe.

---

# 34. Mobile visual acceptance

At minimum review/capture:

## 360×800

- outdoor character readability;
- close follow camera;
- hostel exterior;
- home interior;
- bed interaction;
- wardrobe interaction;
- library interior;
- lecture interior.

## 390×844

same critical flow.

## desktop

ensure camera is not excessively zoomed and interiors do not feel tiny.

---

# 35. Accessibility

Preserve:

- keyboard navigation;
- reduced motion;
- semantic interaction alternatives outside canvas where necessary;
- readable labels;
- focus behavior around CW Pocket/dialog surfaces.

Canvas-only visual furniture cannot be the sole inaccessible route to critical game actions.

Provide an accessible nearby-action surface.

---

# 36. CW Pocket and interior scenes

CW Pocket must still open from exterior or interior scenes.

Opening the phone pauses or safely gates movement as current architecture requires.

Closing it returns to the same visual scene.

Do not reset interior position merely because the phone opened.

---

# 37. Appearance editor

Ensure the appearance editor visibly maps to the upgraded character system.

A user changing:

- hair;
- top;
- lower clothing;
- accessory

must see the corresponding upgraded player visual after save/update.

Preserve current safe appearance validation.

---

# 38. No proprietary copying

Explicit regression/review requirement:

No asset should be traced or copied from the reference game.

Do not reproduce recognizable:

- sprites;
- houses;
- furniture arrangement;
- UI cards;
- maps;
- logos;
- textures.

Use CampusWahala's own visual identity.

---

# 39. Exterior visual identity

Strengthen CampusWahala's own visual language.

Use:

- warm Nigerian campus palette;
- readable roofs/walls;
- greenery;
- walkways;
- noticeboards;
- buses/shuttles;
- student-oriented props;
- clear CW branding where appropriate.

Avoid generic "AI game" appearance.

---

# 40. Regression boundaries

Do not break:

- Phase 3 academic journeys;
- GPA/CGPA;
- carryover/retake;
- Phase 4 life state;
- Phase 4.1 Wahala consequences;
- authoritative venue checks;
- account deletion;
- PWA private-cache rules;
- signed BFF;
- idempotency;
- concurrency;
- publication/intelligence rules.

No production service should trust interior coordinates.

---

# 41. World-version regression

Add tests proving:

- prior versioned world manifests remain accessible/valid where promised;
- new world version validates;
- older completed academic snapshots remain readable;
- an existing active older-world term remains operable;
- new terms can snapshot the current world version;
- saved safe spawn fallback remains safe across version changes.

---

# 42. Interior-domain tests

Test:

- valid home/library/lecture manifests;
- duplicate IDs rejected;
- out-of-bounds props rejected;
- unsafe spawn rejected;
- collision validity;
- unknown interaction targets rejected;
- asset reference validation;
- bounded manifest/bundle size.

---

# 43. Camera/scale tests

Create pure tests for:

- mobile outdoor camera;
- mobile interior camera;
- desktop camera;
- min/max zoom;
- resize;
- reduced motion;
- user zoom bounds.

Avoid acceptance that depends only on screenshots.

Screenshots supplement, not replace, functional assertions.

---

# 44. Browser acceptance — outdoor scale

Add Playwright acceptance showing:

```
load campus
→ player appears at upgraded readable scale
→ camera follows player closely
→ movement works
→ map opens separately as overview
→ closing map returns to close gameplay camera
```

Use renderer-visible state/metrics rather than brittle screenshot pixel matching where practical.

---

# 45. Browser acceptance — navigable home

Add a real browser flow:

```
sign in
→ start term/life
→ authoritative travel home if required
→ visually enter hostel/home
→ navigate room
→ approach bed
→ invoke existing SLEEP
→ verify canonical academic minute/life state changes once
→ remain/resume coherently in home scene
→ open/close Pocket
→ exit to exterior
```

No DB time/stat injection.

---

# 46. Browser acceptance — desk

At home:

- approach desk;
- expose study/rest action according to existing authority;
- execute at least one legitimate action;
- verify the same existing academic/life server path is used.

No new shortcut endpoint.

---

# 47. Browser acceptance — wardrobe

At home:

```
walk to wardrobe
→ open appearance editor
→ change one existing allowed appearance value
→ save
→ upgraded avatar updates
→ reload/resume retains allowed appearance
```

Preserve account/world-state security.

---

# 48. Browser acceptance — library/lecture interiors

Demonstrate both:

- visual interior entry/movement;
- server authority remains separate.

At least one scenario must prove:

cosmetic visual entry alone does not grant academic credit.

Then perform legitimate authoritative presence/action through existing flow.

---

# 49. Visual artifacts

Capture desktop/mobile CI screenshots for:

1. upgraded exterior player scale;
2. dense campus street/zone;
3. hostel exterior;
4. navigable home;
5. bed interaction;
6. wardrobe/avatar;
7. library interior;
8. lecture hall interior;
9. CW Pocket map overview versus close gameplay view.

Screenshots should be evaluated as visual acceptance evidence, not merely generated.

---

# 50. Documentation

Add:

- Phase 4.2 ADR for visual/world-version/interior architecture;
- interior-manifest documentation;
- character/camera scale documentation;
- Phase 4.2 review report.

Update:

- README;
- IMPLEMENTATION_STATUS;
- world-engine documentation.

Clearly state:

- Phase 4.1 is merged;
- Phase 4.2 is the visual-world/interior upgrade;
- Phase 5 has not started.

---

# 51. CI

Run full existing CI plus Phase 4.2 additions.

Required:

- lint;
- typecheck;
- all domain/unit tests;
- PostgreSQL integration;
- migration/upgrade checks if any;
- academic tests;
- life/Wahala tests;
- world validation;
- camera/scale tests;
- interior validation tests;
- PWA tests;
- desktop/mobile Playwright;
- outdoor visual-world E2E;
- home E2E;
- wardrobe E2E;
- library/lecture authority E2E;
- existing academic journeys;
- existing life/Wahala journeys;
- constrained-network tests;
- production builds;
- world/asset budgets;
- dependency audit;
- CodeQL;
- Semgrep;
- full-history TruffleHog;
- Trivy web/API;
- container smoke;
- SBOM;
- Bicep compile.

Never report skipped tests as passed.

---

# 52. Definition of done

Phase 4.2 is complete only when:

- outdoor player is substantially more readable at default gameplay scale;
- default gameplay camera is clearly closer;
- Pocket Map remains a separate wide overview;
- upgraded player/NPC visual system exists;
- directional idle/walk animation works;
- building scale/variety is improved;
- campus exterior is visibly denser;
- Y/depth ordering/occlusion is improved;
- virtual home is navigable;
- bed works through existing sleep authority;
- desk connects to existing study/rest authority;
- wardrobe updates upgraded appearance;
- library is navigable;
- lecture hall is navigable;
- visual interior movement does not become authoritative presence;
- world/interior content is versioned and validated;
- older academic/world snapshots remain safe;
- mobile/desktop acceptance passes;
- existing Phase 0–4.1 security/authority regressions remain green;
- no Phase 5 system is introduced.

---

# 53. Final report

The PR/final report must include:

1. base commit;
2. head commit;
3. exact files changed;
4. world version/schema strategy;
5. old-world compatibility evidence;
6. avatar visual architecture;
7. default outdoor/interior camera profiles;
8. measured player visual scale at representative viewports;
9. building/prop changes;
10. home interior architecture;
11. library/lecture interior architecture;
12. bed/desk/wardrobe authority path;
13. visual-vs-authoritative presence proof;
14. NPC animation/density behavior;
15. asset/bundle sizes;
16. conservative JS gzip bound;
17. browser test count;
18. total automated test count;
19. mobile/desktop screenshots;
20. constrained-network result;
21. CodeQL;
22. Semgrep;
23. Trivy;
24. secret scan;
25. dependency audit;
26. physical-device/performance gates still open;
27. unresolved visual/content risks;
28. whether Phase 5 local development is safe.

Do NOT merge automatically.

Do NOT begin Phase 5.

Stop for reviewer audit.
