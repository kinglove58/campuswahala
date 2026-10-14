import { exteriorAssets } from "./exterior-assets";
import { contains, type Point, type WorldManifest, type Zone } from "./world";
export { exteriorAssets };
export type ExteriorKind = keyof typeof exteriorAssets.futa.frames;
export type ExteriorPlacement = Point & { kind: ExteriorKind; scale: number };
export const exteriorDepth = (groundY: number) => 4000 + groundY;
export function distanceToSegment(p: Point, a: Point, b: Point) {
  const dx = b.x - a.x,
    dy = b.y - a.y,
    length = dx * dx + dy * dy;
  const t = length
    ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / length))
    : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}
/** Decoration clearance only. Never changes collisions, paths, venues or authority. */
export function exteriorClearance(w: WorldManifest, p: Point) {
  return (
    !w.buildings.some(
      (b) =>
        p.x > b.x - 35 &&
        p.x < b.x + b.width + 35 &&
        p.y > b.y - 35 &&
        p.y < b.y + b.height + 60,
    ) &&
    ![...w.roads, ...w.paths].some((r) =>
      r.points
        .slice(1)
        .some(
          (b, i) => distanceToSegment(p, r.points[i]!, b) < r.width / 2 + 22,
        ),
    ) &&
    ![...w.spawnPoints, ...w.interactionPoints].some(
      (s) => Math.hypot(s.x - p.x, s.y - p.y) < 65,
    )
  );
}
export function exteriorLayout(w: WorldManifest, z: Zone): ExteriorPlacement[] {
  const result: ExteriorPlacement[] = [];
  for (let row = 0, y = z.y + 75; y < z.y + z.height - 50; y += 85, row++) {
    for (let col = 0, x = z.x + 65; x < z.x + z.width - 50; x += 95, col++) {
      const p = { x: x + (row % 2) * 19, y };
      if (!contains(z, p, 25) || !exteriorClearance(w, p)) continue;
      const variant = (row * 7 + col * 11) % 13;
      result.push({
        ...p,
        kind:
          variant < 5
            ? "tree"
            : variant < 7
              ? "tree-wide"
              : variant < 9
                ? "shrub"
                : variant === 9
                  ? "bench"
                  : variant === 10
                    ? "planter"
                    : variant === 11
                      ? "cycle"
                      : "bin",
        scale: variant < 7 ? 1.05 : 0.85,
      });
      if (result.length >= 100) return result;
    }
  }
  return result;
}
export function buildingArchetype(type: string): ExteriorKind {
  return (
    (
      {
        lecture_hall: "lecture",
        library: "library",
        hostel: "hostel",
        admin: "admin",
        clinic: "admin",
        food: "food",
        commercial: "food",
      } as Record<string, ExteriorKind>
    )[type] ?? "pavilion"
  );
}
export function validateExterior(w: WorldManifest) {
  const a = exteriorAssets[w.campusId];
  if (a.version !== 1 || !a.worldVersions.includes(w.version as 2))
    throw Error("EXTERIOR_WORLD_COMPATIBILITY");
  if (
    !/^\/world-assets\/exteriors\/(futa|oau|unilag)-v1\.[a-f0-9]{12}\.svg$/.test(
      a.path,
    ) ||
    !a.path.includes(a.hash.slice(0, 12)) ||
    a.decodedBytes > 4 * 1024 * 1024
  )
    throw Error("EXTERIOR_ASSET_BUDGET");
  for (const f of Object.values(a.frames))
    if (
      f.x < 0 ||
      f.y < 0 ||
      f.x + f.width > a.width ||
      f.y + f.height > a.height ||
      f.pivotY > f.height
    )
      throw Error("EXTERIOR_FRAME_BOUNDS");
  for (const z of w.zones)
    for (const p of exteriorLayout(w, z))
      if (!contains(z, p) || !exteriorClearance(w, p))
        throw Error("EXTERIOR_CLEARANCE");
  return a;
}
