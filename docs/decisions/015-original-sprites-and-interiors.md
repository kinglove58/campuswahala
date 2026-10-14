# ADR 015: Original sprite art and versioned navigable interiors

Status: **Proposed; M1 art review blocked.** No runtime implementation or approval is implied.

## Context

Phase 4.2 keeps the top-down Phaser renderer and server-owned academics/life. Original 3D-inspired art must be delivered as lightweight 2D frames. The first editable-vector proof is not sufficiently polished to propagate into the world.

## Proposed compatibility strategy

1. Preserve the exact existing v1 JSON revisions and v2 world generator/assets. Before any generator change, freeze or retain the current v2 factory, including hashes, routes, spawns and venue IDs. Do not regenerate historical content using a new algorithm.
2. Introduce a new world revision for upgraded exterior geometry. If decorative building/interior references change the contract, use a new schema with explicit validation and adapt the renderer; do not reinterpret v2 fields.
3. Keep old academic term venue/world snapshots operational. Only new terms may select the new current revision after tests demonstrate compatibility. Completed terms remain immutable. Do not migrate grades, time, life or receipts.
4. Use a separate strict, bounded, versioned interior manifest for fictional home, library and lecture layouts. Validate unique IDs, dimensions, safe spawns, collision geometry, reachable anchors, local allowlisted assets and interaction enums. Interior coordinates never cross the authority boundary.
5. Keep public immutable hashed art apart from private academic/life reads. Load only the current zone/interior and bounded needed avatar layers. Keep offline/private-cache policies intact.

## Proposed character/camera architecture

Use original editable vector paths or offline 3D source, exported to RGBA directional frames. Preserve the exact current Appearance enum values. A bounded layered/palette renderer should share textures across the player and NPCs; avoid one full atlas per outfit permutation.

The source proof uses four directions, two idle and six walk frames per direction, a 128×160 logical frame and feet anchor (64,148). These are experimental dimensions, not an approved final silhouette. A future pure camera profile should use actual canvas size and visual bounds to target 8–12% outdoor and 10–14% indoor player height while leaving collision/interaction radii independent. The Pocket Map remains a separate overview.

## Authority and fallback

Furniture opens existing academic/life/account controls. Bed, desk or visual door proximity never grants sleep, study, attendance or authoritative venue presence. Opening/closing Pocket must retain the current cosmetic scene position. Use semantic accessible nearby controls in addition to canvas interaction.

Unavailable new art must fail safely without changing server state. Old-world rendering remains a compatibility fallback; it is not acceptable as the final Phase 4.2 visual design. No full 3D runtime, new consequential endpoint, database migration, competing clock or Phase 5 feature is proposed.

## Gate

M1 must first deliver sufficiently modeled adult student proportions, coherent elevated-view direction frames, reliable appearance layering, visible locomotion and real in-game visual proof. Until that gate is satisfied, exterior/interior implementation remains blocked. This ADR records a plan, not completed compatibility tests for a new revision.
