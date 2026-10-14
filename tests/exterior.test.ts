import { describe, it, expect } from "vitest";
import { legacyWorlds } from "../packages/game-engine/src/revisions";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import {
  createCampusWorld,
  validateExterior,
  exteriorLayout,
  exteriorClearance,
  exteriorDepth,
  buildingArchetype,
  findPath,
} from "../packages/game-engine/src";
describe("M3 additive exterior v1, immutable geometry and bounded density", () => {
  for (const campus of ["futa", "oau", "unilag"] as const)
    it(`${campus}: hashed source, frame/texture/transfer bounds, clear essential paths`, () => {
      const w = createCampusWorld(campus),
        before = JSON.stringify(w),
        a = validateExterior(w);
      const bytes = readFileSync(`apps/game/public${a.path}`);
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(a.hash);
      expect(bytes.length).toBe(a.bytes);
      expect(gzipSync(bytes).length).toBeLessThan(24000);
      expect(bytes.toString()).not.toMatch(
        /<script|<foreignObject|href=|url\(https?:/,
      );
      for (const z of w.zones) {
        const props = exteriorLayout(w, z);
        expect(props.length).toBeGreaterThan(15);
        expect(props.length).toBeLessThanOrEqual(100);
        for (const p of props) expect(exteriorClearance(w, p)).toBe(true);
      }
      for (const v of w.venues) {
        const target = w.spawnPoints.find((s) => s.id === v.safeSpawnId)!;
        expect(findPath(w, w.spawnPoints[0]!, target).length).toBeGreaterThan(
          0,
        );
        expect(buildingArchetype(v.type) in a.frames).toBe(true);
      }
      expect(JSON.stringify(w)).toBe(before);
    });
  it("three campus packs have different hashes and architectural grammars", () => {
    const packs = ["futa", "oau", "unilag"].map((c) =>
      validateExterior(createCampusWorld(c as "futa")),
    );
    expect(new Set(packs.map((a) => a.hash)).size).toBe(3);
    expect(packs.map((a) => a.palette.style)).toEqual([
      "pitched",
      "terrace",
      "canopy",
    ]);
  });
  it("ground anchors share character depth ordering instead of player-on-top", () => {
    expect(exteriorDepth(150)).toBe(4150);
    expect(exteriorDepth(149)).toBeLessThan(exteriorDepth(150));
  });
  it("original v1 and v2 routes remain readable while current v2 gets a separate art revision", () => {
    for (const c of ["futa", "oau", "unilag"] as const)
      for (const version of [1, 2]) {
        const w = version === 1 ? legacyWorlds[c] : createCampusWorld(c);
        expect(w.version).toBe(version);
        expect(validateExterior(createCampusWorld(c)).worldVersions).toContain(
          2,
        );
      }
  });
});
