import { parseAppearance, type Appearance } from "./world";
export type Facing = "down" | "up" | "left" | "right";
/** Cosmetic presentation only. No venue, academic clock or collision authority. */
export function appearanceKey(value: Appearance) {
  const a = parseAppearance(value);
  return [
    a.skin,
    a.hair,
    a.hairColour,
    a.top,
    a.bottom,
    a.shoes,
    a.accessory,
  ].join("-");
}
export function facingFor(dx: number, dy: number, previous: Facing): Facing {
  if (Math.hypot(dx, dy) < 0.01) return previous;
  return Math.abs(dx) > Math.abs(dy)
    ? dx < 0
      ? "left"
      : "right"
    : dy < 0
      ? "up"
      : "down";
}
export function cameraProfile(
  width: number,
  height: number,
  reduced = false,
  scene: "outdoor" | "indoor-staging" = "outdoor",
) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  )
    throw new Error("INVALID_CAMERA_VIEWPORT");
  const defaultZoom =
    scene === "indoor-staging" ? 1.5 : width < 600 ? 1.3 : 1.5;
  const ratio = scene === "indoor-staging" ? 0.12 : 0.1;
  return {
    version: "m2-b-camera-1",
    scene,
    defaultZoom,
    minZoom: defaultZoom * 0.8,
    maxZoom: defaultZoom * 1.2,
    follow: reduced ? 1 : 0.15,
    spriteScale: Math.min(0.65, (height * ratio) / (152 * defaultZoom)),
    ratio,
  };
}
export const projectedStride: Record<Facing, number> = {
  down: 30.72,
  up: 30.72,
  left: 64,
  right: 64,
};
export function walkPose(distance: number, scale: number, facing: Facing) {
  if (
    !Number.isFinite(distance) ||
    distance < 0 ||
    !Number.isFinite(scale) ||
    scale <= 0
  )
    throw new Error("INVALID_VISUAL_DISTANCE");
  return Math.floor((distance / (projectedStride[facing] * scale)) * 8) % 8;
}
export function cosmeticWalkSpeed(scale: number, facing: Facing) {
  return projectedStride[facing] * scale;
}
