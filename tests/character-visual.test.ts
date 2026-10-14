import { describe, it, expect } from "vitest";
import {
  appearanceKey,
  appearanceChoices,
  defaultAppearance,
  cameraProfile,
  facingFor,
  walkPose,
  cosmeticWalkSpeed,
  projectedStride,
  navigationPace,
  blocked,
  findPath,
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
      const speed = projectedStride[direction] * 0.4;
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
  it("ordinary keyboard and short paths have one pace in all directions and viewports", () => {
    const world = createCampusWorld("futa");
    const start = world.spawnPoints.find((s) => s.id === world.defaultSpawnId)!;
    // The actual off-grid production spawn must not add a short-route dogleg.
    const origin = {
      x: start.x,
      y: start.y,
    };
    for (const direction of [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
      { x: Math.SQRT1_2, y: Math.SQRT1_2 },
    ]) {
      const keyboard = new WorldEngine(world),
        tap = new WorldEngine(world);
      keyboard.position = { ...origin };
      tap.position = { ...origin };
      const destination = {
        x: origin.x + direction.x * 96,
        y: origin.y + direction.y * 96,
      };
      expect(blocked(world, destination)).toBe(false);
      tap.moveTo(destination);
      const speed = navigationPace(origin, tap.path, false).speed;
      expect(speed).toBe(22);
      for (let i = 0; i < 80; i++) keyboard.tick(50, direction, speed);
      expect(
        Math.hypot(
          keyboard.position.x - origin.x,
          keyboard.position.y - origin.y,
        ),
      ).toBeCloseTo(88);
      if (!direction.x || !direction.y) {
        expect(tap.path).toEqual([destination]);
        let elapsed = 0;
        while (tap.path.length && elapsed < 5000) {
          tap.tick(
            50,
            { x: 0, y: 0 },
            navigationPace(tap.position, tap.path, false).speed,
          );
          elapsed += 50;
        }
        expect(elapsed).toBeLessThanOrEqual(5000);
        expect(tap.position).toEqual(destination);
      }
      expect(keyboard.elapsedMs).toBe(4000);
      keyboard.dispose();
      tap.dispose();
    }
    for (const [width, height] of [
      [360, 571],
      [360, 731],
      [390, 775],
      [1280, 813],
    ]) {
      const profile = cameraProfile(width!, height!);
      expect(profile.spriteScale).toBeGreaterThan(0);
      expect(cosmeticWalkSpeed()).toBe(22);
    }
  });
  it("ordinary input cannot cross a collider and interrupts a queued tap path", () => {
    const world = createCampusWorld("futa"),
      engine = new WorldEngine(world);
    const building = world.buildings[0]!;
    engine.position = {
      x: building.x - 24,
      y: building.y + building.height / 2,
    };
    expect(blocked(world, engine.position)).toBe(false);
    for (let i = 0; i < 100; i++) {
      engine.tick(50, { x: 1, y: 0 }, cosmeticWalkSpeed());
      expect(blocked(world, engine.position)).toBe(false);
      expect(engine.position.x).toBeLessThan(building.x);
    }
    engine.resumeAtSpawn(world.defaultSpawnId);
    engine.moveTo({ x: engine.position.x + 96, y: engine.position.y });
    expect(engine.path.length).toBeGreaterThan(0);
    engine.tick(50, { x: 0, y: -1 }, cosmeticWalkSpeed());
    expect(engine.path).toEqual([]);
    expect(engine.mapRoute).toBe(false);
    engine.dispose();
  });
  it("nearby tap shortcuts cannot cut a building corner", () => {
    const world = createCampusWorld("futa");
    const b = world.buildings[0]!;
    const from = { x: b.x - 24, y: b.y + 24 };
    const to = { x: b.x + 24, y: b.y - 24 };
    expect(blocked(world, from)).toBe(false);
    expect(blocked(world, to)).toBe(false);
    const path = findPath(world, from, to);
    expect(path.length).toBeGreaterThan(1);
    expect(path.every((point) => !blocked(world, point))).toBe(true);
  });
  it("ordinary pace traverses each contact pose without skipping at the engine delta cap", () => {
    for (const [width, height] of [
      [360, 571],
      [360, 731],
      [390, 775],
      [1280, 813],
    ] as const)
      for (const facing of ["up", "down", "left", "right"] as const) {
        const scale = cameraProfile(width, height).spriteScale;
        let previous = 0;
        const seen = new Set<number>();
        for (let tick = 0; tick < 120; tick++) {
          const pose = walkPose(
            tick * 0.05 * cosmeticWalkSpeed(),
            scale,
            facing,
          );
          expect((pose - previous + 8) % 8).toBeLessThanOrEqual(1);
          seen.add(pose);
          previous = pose;
        }
        expect([...seen].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      }
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
        expect(cameraProfile(width, height).spriteScale).toBeGreaterThan(0);
        engine.moveTo(spawn, true);
        const modes = new Set<boolean>();
        let elapsed = 0;
        while (engine.path.length && elapsed < 45000) {
          const pace = navigationPace(
            engine.position,
            engine.path,
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
        engine.tick(50, { x: 1, y: 0 }, cosmeticWalkSpeed());
        expect(engine.mapRoute).toBe(false);
        expect(
          navigationPace(engine.position, [{ x: 10000, y: 10000 }], false)
            .speed,
        ).toBe(cosmeticWalkSpeed());
        engine.dispose();
      }
  });
});
