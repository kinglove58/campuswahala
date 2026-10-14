export interface Point {
  x: number;
  y: number;
}
export const WORLD = { width: 960, height: 640, margin: 24 } as const;
export function clampPosition(point: Point): Point {
  return {
    x: Math.max(WORLD.margin, Math.min(WORLD.width - WORLD.margin, point.x)),
    y: Math.max(WORLD.margin, Math.min(WORLD.height - WORLD.margin, point.y)),
  };
}
export function advancePosition(
  from: Point,
  target: Point,
  step: number,
): Point {
  const distance = Math.hypot(target.x - from.x, target.y - from.y);
  if (distance <= step) return clampPosition(target);
  const ratio = step / distance;
  return clampPosition({
    x: from.x + (target.x - from.x) * ratio,
    y: from.y + (target.y - from.y) * ratio,
  });
}

export * from "./world";
export * from "./engine";
export * from "./campuses";
export * from "./visual";
export * from "./exterior";
