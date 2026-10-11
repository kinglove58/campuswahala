# CampusWahala Phase 4.2 — approved visual direction

**Status:** binding art-direction specification for the active Phase 4.2.
**Owner:** project reviewer. Codex reads this alongside \`ACTIVE_PHASE.md\`.
**Decision:** original 3D-*inspired* stylized African/Nigerian campus art, delivered at runtime as optimized **2D directional sprites in the existing Phaser top-down/2.5D renderer**.

## 1. Non-negotiable medium decision

- Do **not** replace Phaser with Unity, Unreal, Three.js, Babylon.js, React Three Fiber or a full real-time 3D runtime.
- A 3D tool such as Blender is optional **offline authoring only**: original models can be posed/rendered to sprite frames, then packed into local atlases. Source and reproducible export instructions must be retained.
- Equally acceptable is an original layered 2D/vector production pipeline with convincing modeled forms, soft shading, expressive anatomy and consistent perspective. **A larger collection of the existing flat rectangles/circles alone is not a visual-quality solution.**
- Character sprites are 2D gameplay assets, even when authored in 3D. Backgrounds, buildings and furniture use the same stylized 2.5D projection and palette.
- No live remote asset API, paid render dependency, remote CDN, runtime generative AI, or proprietary reference-game asset.
- Respect the existing authoritative server contracts; visual art never proves attendance, sleep, study, food, location, money or rewards.

## 2. Visual North Star

**An original, warm, lively, readable Nigerian university-life world:** appealing animated-film sensibility adapted to a phone-sized interactive campus. The film-poster reference defines *expressiveness and polish*, not permission to reproduce its characters.

Positive qualities:
- distinctly readable characters with human personality, expressive faces and silhouettes;
- softly modeled rounded forms without toy-like oversimplification;
- head, hairstyle, body shape, clothing, footwear and bag legible at gameplay size;
- believable student style, real visual variety and coherent material rendering;
- sun-warmed campus architecture, active courtyards, signage, paths, greenery and lived-in rooms;
- low-cost shadows and clean layering rather than photorealistic lighting.

Avoid:
- literal replica of the reference, its costumes, poses, faces, proportions, or named designs;
- cheap chibi blobs, stick figures, unshaded primitives and disconnected clip-art;
- uncannily photoreal faces, heavy cinematic shaders or dark/muddy environment palettes;
- stereotyped ethnic/gender traits; real-person likenesses; mockery through body shape;
- UI that overwhelms the game world or tiny unreadable world labels;
- fabricated claims about real campus layouts, vendors, building interiors or students.

## 3. Projection and shape grammar

- Keep one consistent 3/4 elevated top-down view in outdoors and interiors: show character head/torso/feet, roofs/entrances and floor/wall planes in compatible perspective.
- Prefer clear proportions with a slightly emphasized head and hands/shoes that remain visually recognizable at small scale. Do not exaggerate into a toddler look.
- Use coherent light direction, subtle body contact shadows, restrained highlights, clean dark/light values and consistent outline treatment.
- Maintain matching world feet/ground anchors on all directions and all animation frames. Character collision and interaction bounds are **independent** of visual extent.
- Outfits read as broad distinguishable color/material zones; fine prints and facial microdetail belong in portrait/wardrobe previews, not the smallest gameplay sprite.

### Gameplay readability targets

On a **360×800** phone in the default camera:
- outdoor player visible height ~**8–12%** of actual gameplay viewport height;
- indoor player visible height ~**10–14%** of gameplay viewport height, when navigation permits.
- NPCs use the same scale and perspective; avoid tiny doll NPCs beside a detailed player.
- Test the actual canvas viewport (not full browser outer height), representative 360×640 / 360×800 / 390×844 / desktop and DPR variants.
- The Pocket Map stays an independent, wide bird's-eye functional overview.

These are acceptance *ranges*, not a command to blindly multiply existing camera/collision values. Prefer measurable visual bounds + camera framing + human screenshot review.

## 4. Character design language

### Base variation

Retain and honor the exact current serialized \`Appearance\` choices unless a separately reviewed additive mapping is required:

- skin: deep, brown, warm, light;
- hair: crop, afro, braids, covered;
- hairColour: black, brown;
- top: lime, clay, blue;
- bottom: trousers, skirt;
- shoes: dark, white;
- accessory: none, backpack.

Every existing combination must produce a visually valid, stable character. Do not silently drop a saved option or create a server profile breaking change.

Future extension slots, **not required for Phase 4.2**:
- optional body silhouettes (slim/average/broad/stocky/tall-lean/compact/curvy);
- extra hair choices (fades, twists, locs, bun, cornrows, natural curls, scarf);
- campus casual clothes (polo, tees, hoodies, shirt, joggers, jeans, skirt, Ankara-inspired trim, sneakers/sandals);
- glasses, headwear, satchel or shoulder bag;
- emotional portrait expressions (happy, focused, tired, stressed, curious).

Do not invent religious, ethnicity, health or sex attributes from visual choices; no enforced identity-based game effects. Optional extensions need typed defaults, backwards compatibility, UI choices and bounds tests.

### Player vs NPC

- Player: appearance layering and wardrobe preview match gameplay output.
- NPCs: curated variations from the same underlying rig/atlas; no per-NPC giant unique texture, no real lecturers/staff/student likenesses.
- Role readability may come from clothing/props but must not depict real named campus workers or official uniforms without validation.

### Motion

At least eight states:
- idle and walk for up/down/left/right.

Support latest meaningful facing direction. Diagonals may select nearest cardinal. Idle should have subtle stillness and reduced-motion must disable unnecessary motion.

**Recommended first-pass data contract** (adapt to actual pipeline):
- local original transparent RGBA sprite frames;
- 4 directional facing states × idle/walk;
- loop frames consistent in body anchor and silhouette;
- logical source frame size initially around 96×128 or 128×160, but choose based on *measured on-screen readability*;
- recommended idle 2–4 frames/direction, walk 4–8 frames/direction;
- 1x/2x/DPR strategy without giant memory duplication;
- texture key/frame naming deterministically derived from direction/state/frame and appearance layers.

Do not produce a separate full atlas for every combinatorial appearance permutation. Use modular composited layers, palette swaps or bounded precompositions, with batching and fallback textures.

## 5. Campus world art direction

Building types must be recognizable by architecture, not just roof color and a text label.

| Setting | Distinctive cues |
| --- | --- |
| Hostel/home | residence proportions, windows/veranda, warmer details, surrounding sitting areas |
| Lecture block | broad institutional mass, shaded access, repeated bays/classroom entrances |
| Library | quiet entry, broad windows, restrained signage, orderly nearby seating |
| Food/café | awning/counter silhouettes, queue space, colorful accents, seating |
| Admin | formal geometry, entry steps, institutional details |
| Clinic | calm/clear entry, separate readable treatment of the exterior; no medical claim |
| Sports | open pitch/court access, bleachers or sports equipment as appropriate |
| Social/common | shared seating, notice/meeting nodes, trees and shade |
| Transport | shelter, stop marks and fictional campus shuttle shapes |
| Reflection/religious | respectful optional venues consistent with fictional pack; no religion mechanics |

Data-driven differentiation:
- FUTA: pitch-roof, green, courtyard and practical building forms;
- OAU: weightier/brutalist mass and terraces;
- UNILAG: lighter canopies/tower/waterfront-inspired fictional spaces.

Do not claim exact surveyed campus geography. Published identity labels remain separate from approximate compressed game geometry.

## 6. Props, atmosphere and occlusion

Exterior library of **original reusable props**: shade trees/palms, planters, benches, bins, noticeboards, kiosks, lamp posts, road markings, parked cycle/vehicle props, fences, walkway and courtyard detailing.

Use a layered depth contract:
- floor/roads below buildings/characters;
- roofs and foreground trees occlude when appropriate;
- character/NPC standing Y sorts dynamically;
- feet/contact point determines depth, not fixed player-on-top;
- low-cost ground-contact shadows;
- no costly real-time shadows/reflections.

Avoid prop counts that defeat zone chunking/culling. Prop clustering must preserve collision clearance and accessible paths.

## 7. Interiors — original, actually navigable

Use data-driven interior manifests, a reusable scene renderer, and the same avatar/art language. Never treat a modal image as a completed navigable interior.

### Home/hostel

- bed, wardrobe, desk, chair, exit/door, windows/wall detail, plausible personal props;
- walkable route from entrance to every interaction anchor;
- bed → existing server-authoritative sleep options;
- desk → existing legitimate study/rest actions;
- wardrobe → existing validated appearance editor;
- door → return to exterior at coherent spawn;
- phone → CW Pocket without resetting interior state.

### Library

- navigable aisles, shelves, tables, chairs and exit;
- existing academic study server commands;
- fictional layout, not official floor plan.

### Lecture hall

- navigable walkways, rows/seats, front board/presentation area and exit;
- attendance/test/exam remain existing authoritative academic commands;
- walking into the room by itself does **not** count as attendance.

Mobile touch targets must be accessible through semantic nearby-action controls as well as tapping the canvas. Scene transitions should be fast and reduced-motion aware.

## 8. Palette, light and UI compatibility

Start from current campus palettes and existing CW UI tokens; evolve them into one reviewed palette system instead of inventing three unrelated styles.

- sun-warmed cream/sand/cement;
- campus greens and foliage variation;
- clay/terracotta/roof warmth;
- restrained gold/mustard accents;
- airy blues/water inspiration where appropriate;
- outfits sufficiently distinct in value/saturation from backgrounds.

Use normal indoor brightness with wall/floor/prop contrast. Avoid too-dark lecture rooms, overly saturated props, and conflicting text/background values.

Keep CW Pocket readable, accessible and separate from world-game camera scaling. Color cannot be the only status signal.

## 9. Visual proof and quality gate

A phase is **not visually accepted merely because TypeScript/tests pass**.

Before claiming Phase 4.2 complete, provide before/after screenshot/contact-sheet evidence and a reviewer-readable art sheet showing:

1. player close-up + native gameplay scale in 4 facings;
2. at least 4 saved Appearance combinations, including skirt/trousers, covered/braids, varied skin/top/accessory;
3. walking animation contact sheet or short local clip;
4. same rig on at least 2 distinct NPC variants;
5. exterior near hostel, lecture and library with richer depth;
6. inside hostel with bed/desk/wardrobe/exit;
7. library and lecture interior;
8. indoor/outdoor 360×800 and desktop camera/character proportion;
9. comparison of original vs upgraded game at equivalent viewport sizes;
10. original-source asset provenance and source/export instructions.

Reject placeholders, enlarged primitive-only avatars, pixelated faces, wrong projection, empty rooms, unreadable clothes and low-fidelity copies of the reference.

The final handoff must include measured asset bytes, atlas/frame counts, loaded bundles, game-JS gzip budget, constrained-network checks and explicit **physical Android still unverified** if not measured.

If the current toolchain cannot actually produce polished original art, stop and report an explicit **visual asset blocker**. Do not disguise inadequate art as finished with screenshots or passing unit tests.

## 10. Authority and release boundary

Phase 4.2 adds no economy/social/Phase 5 functionality.

Do not change the single academic/life clock, signed BFF, account authority, academic grades, life/Wahala effects, idempotency, private/offline policies or deletion. Cosmetic interior/player coordinates are never a credential for valuable state.

All changes go through a focused implementation PR. No automatic merge. Stop for reviewer acceptance.
