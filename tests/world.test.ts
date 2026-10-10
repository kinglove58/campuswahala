import { describe, it, expect } from "vitest";
import {
  createCampusWorld,
  isCampus,
  validateWorld,
  parseWorldState,
  defaultAppearance,
  safeLocation,
  WorldEngine,
  blocked,
  findPath,
  compileWorldInformation,
  campusTime,
} from "../packages/game-engine/src";
describe("world integrity and authority boundaries", () => {
  it("NPC prompts follow visible patrols and disappear outside configured hours", () => {
    const world = createCampusWorld("futa"),
      engine = new WorldEngine(world);
    const npc = world.npcSpawns[0]!;
    const talk = world.interactionPoints.find((i) => i.npcId === npc.id)!;
    talk.radius = 20;
    engine.elapsedMs = 4000;
    engine.position = { x: npc.x + 60, y: npc.y };
    engine.tick(0);
    expect(engine.nearby?.npcId).toBe(npc.id);
    engine.elapsedMs = (22 * 60 - 7 * 60) * 1500;
    engine.tick(0);
    expect(engine.nearby?.npcId).not.toBe(npc.id);
  });
  for (const id of ["futa", "oau", "unilag"] as const)
    it(`${id} validates and meets manifest budget`, () => {
      const w = createCampusWorld(id);
      expect(validateWorld(w)).toBe(w);
      expect(Buffer.byteLength(JSON.stringify(w))).toBeLessThan(160000);
      expect(w.bounds.width).toBeGreaterThan(960);
      expect(w.assetBundles.reduce((sum, b) => sum + b.bytes, 0)).toBeLessThan(
        65536,
      );
    });
  const cases: Array<
    [string, (w: ReturnType<typeof createCampusWorld>) => void]
  > = [
    [
      "duplicate ID",
      (w) => {
        w.venues[0]!.id = w.buildings[0]!.id;
      },
    ],
    [
      "unknown venue",
      (w) => {
        w.interactionPoints[0]!.venueId = "missing";
      },
    ],
    [
      "unknown zone",
      (w) => {
        w.spawnPoints[0]!.zoneId = "missing";
      },
    ],
    [
      "unknown spawn",
      (w) => {
        w.defaultSpawnId = "missing";
      },
    ],
    [
      "outside world",
      (w) => {
        w.buildings[0]!.x = 999999;
      },
    ],
    [
      "transport destination",
      (w) => {
        w.transportNodes[0]!.destinations[0]!.spawnId = "missing";
      },
    ],
    [
      "source entity link",
      (w) => {
        w.venues[0]!.identity = {
          kind: "approximate",
          category: "candidate",
          canonicalEntityId: "javascript:bad",
          displayProperty: "name",
        };
      },
    ],
    [
      "invalid version",
      (w) => {
        w.version = 0;
      },
    ],
    [
      "collision spawn",
      (w) => {
        Object.assign(w.spawnPoints[0]!, {
          x: w.buildings[0]!.x + 20,
          y: w.buildings[0]!.y + 20,
        });
      },
    ],
    [
      "unknown interaction command",
      (w) => {
        Object.assign(w.interactionPoints[0]!, { command: "EXECUTE_SCRIPT" });
      },
    ],
    [
      "invalid NPC hours",
      (w) => {
        w.npcSpawns[0]!.activeHours = [23, 6];
      },
    ],
    [
      "non-finite road width",
      (w) => {
        w.roads[0]!.width = NaN;
      },
    ],
    [
      "remote asset",
      (w) => {
        w.assetBundles[0]!.path = "https://evil.test/image.svg";
      },
    ],
  ];
  for (const [name, mutate] of cases)
    it(`rejects ${name}`, () => {
      const w = createCampusWorld("futa");
      mutate(w);
      expect(() => validateWorld(w)).toThrow();
    });
  it("accepts safe IDs only, rejects ownership/coordinates/unknown world/appearance", () => {
    expect(isCampus(["futa"])).toBe(false);
    expect(isCampus({ campus: "futa" })).toBe(false);
    const w = createCampusWorld("futa"),
      valid = {
        campusId: "futa",
        worldVersion: w.version,
        spawnId: w.defaultSpawnId,
        appearance: defaultAppearance,
      };
    expect(parseWorldState(valid, w).zoneId).toBe("zone-0");
    for (const bad of [
      { ...valid, userId: "other" },
      { ...valid, x: 999999 },
      { ...valid, campusId: "unknown" },
      { ...valid, spawnId: "missing" },
      { ...valid, worldVersion: 0 },
      { ...valid, appearance: { ...defaultAppearance, top: "reward" } },
    ])
      expect(() => parseWorldState(bad, w)).toThrow();
  });
  it("stale removed spawn safely falls back", () => {
    const w = createCampusWorld("futa");
    expect(
      safeLocation(w, { spawnId: "removed", worldVersion: 0 }).spawnId,
    ).toBe(w.defaultSpawnId);
  });
  it("does not promote fixtures, stale facts, wrong campus or mismatched bindings", () => {
    const w = createCampusWorld("futa"),
      now = Date.now();
    w.venues[0]!.identity = {
      kind: "approximate",
      canonicalEntityId: "12345678-1234-4123-a123-123456789012",
      displayProperty: "name",
      category: "building",
    };
    const fact = {
      id: "fact",
      campus: "futa",
      category: "building",
      canonicalSubjectId: "12345678-1234-4123-a123-123456789012",
      propertyKey: "name",
      value: "University Library",
      sources: ["https://example.edu/library"],
      lastObservedAt: new Date(now - 1000),
      staleAt: new Date(now + 60000),
    };
    expect(compileWorldInformation(w, [], now)[0]!.verification).toBe(
      "fictional",
    );
    expect(compileWorldInformation(w, [fact], now)[0]!.verification).toBe(
      "verified-identity",
    );
    expect(
      compileWorldInformation(
        w,
        [{ ...fact, staleAt: new Date(now - 1) }],
        now,
      )[0]!.verification,
    ).toBe("fictional");
    expect(
      compileWorldInformation(w, [{ ...fact, campus: "oau" }], now)[0]!
        .verification,
    ).toBe("fictional");
    expect(compileWorldInformation(w, [fact], now)[2]!.verification).toBe(
      "fictional",
    );
  });
  it("movement avoids buildings and boundaries and pauses for phone", () => {
    const w = createCampusWorld("futa"),
      e = new WorldEngine(w);
    for (let i = 0; i < 10000; i++) e.tick(50, { x: -1, y: -1 });
    expect(blocked(w, e.position)).toBe(false);
    const before = { ...e.position };
    e.setPhone(true);
    e.tick(50, { x: 1, y: 1 });
    expect(e.position).toEqual(before);
    e.dispose();
  });
  it("pathfinding routes around collision and rejects unsafe endpoints", () => {
    const w = createCampusWorld("futa"),
      s = w.spawnPoints[0]!,
      b = w.buildings[0]!;
    expect(findPath(w, s, { x: b.x + 50, y: b.y + 50 })).toEqual([]);
    const path = findPath(
      w,
      s,
      w.spawnPoints.find((p) => p.id === "spawn-venue-1")!,
    );
    expect(path.length).toBeGreaterThan(0);
    expect(path.every((p) => !blocked(w, p))).toBe(true);
  });
  it("travel requires proximity and configured route", () => {
    const w = createCampusWorld("futa"),
      e = new WorldEngine(w),
      t = w.transportNodes[0]!;
    expect(e.travel("missing", "spawn-arrival")).toBe(false);
    e.position = { x: t.x, y: t.y };
    expect(e.travel(t.id, t.destinations[0]!.spawnId)).toBe(true);
    expect(e.travel(t.id, t.destinations[1]!.spawnId)).toBe(false);
  });
  it("clock is deterministic, cosmetic and includes four time periods", () => {
    expect(campusTime(0).label).toBe("07:00");
    expect(campusTime(0)).toEqual(campusTime(0));
    expect(campusTime(13 * 60 * 1500).period).toBe("night");
  });
});
