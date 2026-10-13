import { describe, it, expect } from "vitest";
import {
  appearanceKey,
  appearanceChoices,
  defaultAppearance,
  cameraProfile,
  facingFor,
  walkPose,
  cosmeticWalkSpeed,
  navigationPace,
  WorldEngine,
  createCampusWorld,
} from "../packages/game-engine/src";
describe("M2 B visual contracts", () => {
  it("preserves and distinguishes every canonical saved appearance", () => {
    let rows = [{}] as Record<string, string>[];
    for (const [key, values] of Object.entries(appearanceChoices))
      rows = rows.flatMap((row) =>
        values.map((value) => ({ ...row, [key]: value })),
      );
    const keys = rows.map((a) => appearanceKey(a as typeof defaultAppearance));
    expect(new Set(keys).size).toBe(768);
    expect(() =>
      appearanceKey({
        ...defaultAppearance,
        hair: "unknown",
      } as unknown as typeof defaultAppearance),
    ).toThrow();
  });
  it("keeps default outdoor and staging scale ranges across resize", () => {
    for (const [w, h] of [
      [360, 571],
      [360, 731],
      [390, 775],
      [1280, 831],
    ])
      for (const scene of ["outdoor", "indoor-staging"] as const) {
        const p = cameraProfile(w!, h!, false, scene);
        const ratio = (152 * p.spriteScale * p.defaultZoom) / h!;
        expect(ratio).toBeGreaterThanOrEqual(scene === "outdoor" ? 0.08 : 0.1);
        expect(ratio).toBeLessThanOrEqual(scene === "outdoor" ? 0.12 : 0.14);
        expect(p.defaultZoom).toBeGreaterThan(1.05);
        expect(p.minZoom).toBeLessThan(p.defaultZoom);
        expect(p.maxZoom).toBeGreaterThan(p.defaultZoom);
      }
    expect(cameraProfile(360, 731, true).follow).toBe(1);
    expect(() => cameraProfile(0, 0)).toThrow();
  });
  it("matches walk contact phase to distance and retains last cardinal idle", () => {
    expect(facingFor(0, 0, "up")).toBe("up");
    expect(facingFor(-5, 2, "down")).toBe("left");
    for (const direction of ["down", "up", "left", "right"] as const) {
      const speed = cosmeticWalkSpeed(0.4, direction);
      expect(
        Array.from({ length: 8 }, (_, i) =>
          walkPose((speed * i) / 8, 0.4, direction),
        ),
      ).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      expect(walkPose(speed, 0.4, direction)).toBe(0);
    }
  });
  it("cosmetic pace changes displacement without scaling the clock or footprint", () => {
    const a = new WorldEngine(createCampusWorld("futa")),
      b = new WorldEngine(createCampusWorld("futa"));
    const before = { ...b.position };
    for (let i = 0; i < 20; i++) {
      a.tick(50, { x: 0, y: 1 });
      b.tick(50, { x: 0, y: 1 }, 12);
    }
    expect(b.elapsedMs).toBe(a.elapsedMs);
    expect(b.battery.value).toBe(a.battery.value);
    expect(b.time).toEqual(a.time);
    expect(b.position.y - before.y).toBeCloseTo(12);
    b.setPhone(true);
    const paused = { ...b.position };
    b.tick(50, { x: 1, y: 0 }, 12);
    expect(b.position).toEqual(paused);
    a.dispose();
    b.dispose();
  });
  it("retains timely Map arrival, natural approach, and interruptible manual pace", () => {
    const world = createCampusWorld("futa");
    for (const [width, height] of [
      [360, 571],
      [1280, 633],
      [360, 731],
      [390, 775],
    ] as const)
      for (const type of ["lecture_hall", "food"]) {
        const venue = world.venues.find((v) => v.type === type)!;
        const spawn = world.spawnPoints.find(
          (s) => s.id === venue.safeSpawnId,
        )!;
        const engine = new WorldEngine(world);
        const scale = cameraProfile(width, height).spriteScale;
        engine.moveTo(spawn, true);
        const modes = new Set<boolean>();
        let elapsed = 0;
        while (engine.path.length && elapsed < 45000) {
          const target = engine.path[0]!;
          const facing = facingFor(
            target.x - engine.position.x,
            target.y - engine.position.y,
            "down",
          );
          const pace = navigationPace(
            engine.position,
            engine.path,
            scale,
            facing,
            engine.mapRoute,
          );
          modes.add(pace.fast);
          engine.tick(50, { x: 0, y: 0 }, pace.speed);
          elapsed += 50;
        }
        expect(elapsed).toBeLessThan(45000);
        expect(
          Math.hypot(engine.position.x - spawn.x, engine.position.y - spawn.y),
        ).toBeLessThan(1);
        expect(modes).toEqual(new Set([true, false]));
        expect(engine.mapRoute).toBe(false);
        engine.moveTo(spawn, true);
        engine.tick(50, { x: 1, y: 0 }, cosmeticWalkSpeed(scale, "right"));
        expect(engine.mapRoute).toBe(false);
        expect(
          navigationPace(
            engine.position,
            [{ x: 10000, y: 10000 }],
            scale,
            "right",
            false,
          ).speed,
        ).toBe(cosmeticWalkSpeed(scale, "right"));
        engine.dispose();
      }
  });
});
