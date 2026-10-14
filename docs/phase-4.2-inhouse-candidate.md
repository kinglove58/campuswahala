# Phase 4.2 — in-house 2D M1 candidate handoff

**Status: UNAPPROVED ART STUDY. M1 ART REVIEW BLOCKER REMAINS.**

This note records the independent AI-assisted sprite study generated in the project's ChatGPT conversation on 12 October 2026. It is an **original generated concept and proof**, not an imported, licensed third-party game asset, and it is not an accepted production character.

## Source and delivery

The reviewer has the downloadable conversation attachment named:

`campuswahala-m1-inhouse-2d-prototype.zip` (3,504,815 bytes).

SHA-256:

`54a95d22452eb84ee7b88ffaef6e4c346091d20cd351badcd0035d951bac164b`

A separate self-contained browser demo was also generated:

`CampusWahala_2D_Tap_to_Bed_Interactive_Proof.html`

The ChatGPT sandbox links are **not publicly hosted GitHub URLs** and Codex must not pretend to have downloaded them from GitHub. Only the text staging importer and this handoff are currently in the repository. An operator must provide the ZIP to the Codex working directory **once**, or an authorized binary-upload channel must be connected.

After the *actual archive bytes* are present in a checkout of PR #17, run:

```bash
python3 scripts/art/import-m1-candidate.py ./campuswahala-m1-inhouse-2d-prototype.zip
```

The importer verifies the exact ZIP SHA-256, expected paths, size bounds, atlas metadata and 32 OpenRaster frame layers. It stages files in `art/characters/inhouse-candidate/proof/` and records individual SHA-256 hashes. It does not overwrite the existing folder or copy the assets to `public/`, runtime manifests or Phaser production textures. The standalone HTML demo is not copied into app routes.

## Actual prototype inventory

- Source: one AI-generated 1672×941 reference/turnaround image.
- Editable authoring: `.ora` OpenRaster with **32 independent raster-frame layers**. This is **not** a separated head/torso/hair/top/bottom/rigged-arm source.
- 32 atlas cells at 80×180 in four rows of eight; transparent 640×720 atlas.
- 28 individually saved transparent directional walk images: down 8; up 6; right 7; left 7.
- Some atlas cells repeat earlier frames. Opposite profile direction is mirrored. This is **not** proof of 32 independently drawn poses or authentic left/right consistency.
- No distinct authored idle sequence, no complete outfit/skin/hair/covered/skirt/backpack mapping, and no two NPCs derived from the same production rig.
- Separate client-only 360-wide room demonstrator has tap/confirmation/pathfinding to bed/desk/wardrobe. It calls **no** real private API and must never stand in for server-authoritative sleep/study or Phase 4.2 navigable interior acceptance.

## Required M1 quality improvement (do NOT promote the study)

1. Redesign one cohesive stylized **2D layered master** matching the approved warm young-adult Nigerian student concept. Four facings must use consistent elevated 3/4 projection and body/feet anchors; character anatomy, head/face/cloth and walk frames must remain stable.
2. Create genuine editable **body/face/hair/top/bottom/shoes/accessory** parts or equivalent modular 2D artwork; the existing `.ora` offers frame-level editing only.
3. Produce 2–4 truly authored idle and 4–8 genuinely articulated walk frames for **each** of down/up/left/right. Fix mirrored side errors and flicker, with coherent body weight and floor contact.
4. Map **all serialized Appearance options** without touching the server schema and show four contrasting outfits plus two fictional NPC variants.
5. Deliver source/export steps and hashes, atlas transfer/decoded memory, native game-scale and high-resolution contact sheets.
6. Build a **minimal isolated actual Phaser M1 proof** with the candidate (no new academic/life API). Capture native 360×800 game at identical baseline viewport, measured player height/zoom and movement/appearance proof. No M2–M6 implementation before explicit M1 visual review.
7. M1 acceptance is human visual approval **plus** the objective tests. Working export scripts or standalone canvas demonstrations cannot substitute for it.

## Gameplay interaction direction (later M4/M5 only)

Future UX: tap furniture → original confirmation → valid collision-aware auto-walk to semantic interaction anchor → explicit eligible server command → authoritative result/animation. Arrival alone never changes academic presence, sleep, GPA or life metrics. Keep accessible semantic controls and cancellation.

## Phase boundaries

- Keep PR #17 draft, open and unmerged.
- Do not promote the rejected vector/Blender studies or this unapproved raster candidate into runtime.
- Do not begin M2–M6, Phase 5, a full-3D renderer or money/social features.
- Existing CI/security/authority requirements remain unchanged.
