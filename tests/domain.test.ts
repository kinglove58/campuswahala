import { describe, expect, it } from "vitest";
import { createGuestSchema } from "../packages/domain/src";
import { campuses, validProgramme } from "../packages/campus-content/src";
import { validGuestFixture } from "../packages/testing/src";
import {
  issueGuestToken,
  hashGuestToken,
  validGuestToken,
} from "../packages/auth/src";
import { advancePosition } from "../packages/game-engine/src";
import { readConfig } from "../packages/config/src";
import { logRecord } from "../packages/observability/src";
describe("guest invariants", () => {
  it("supports all campuses, all configured years and a personal duration override", () => {
    for (const c of campuses)
      for (const p of c.programmes)
        for (const level of p.levels)
          expect(
            createGuestSchema.safeParse({
              ...validGuestFixture,
              campusId: c.id,
              programmeId: p.id,
              level,
              durationYears: p.typicalDuration,
            }).success,
          ).toBe(true);
    expect(
      createGuestSchema.parse({
        ...validGuestFixture,
        level: 600,
        durationYears: 6,
      }).durationYears,
    ).toBe(6);
    expect(validProgramme("futa", "nonexistent")).toBe(false);
  });
  it.each([
    { money: 1000 },
    { roles: ["admin"] },
    { level: 0 },
    { durationYears: 0 },
    { level: 500, durationYears: 4 },
    { durationYears: 1e20 },
    { avatar: "<script>" },
    { nickname: "unsanitized text" },
    { campusId: "unknown!" },
  ])("rejects hostile fields %j", (change) =>
    expect(
      createGuestSchema.safeParse({ ...validGuestFixture, ...change }).success,
    ).toBe(false),
  );
  it("uses random opaque keyed capabilities", () => {
    const a = issueGuestToken(),
      b = issueGuestToken();
    expect(a).not.toBe(b);
    expect(validGuestToken(a)).toBe(true);
    expect(validGuestToken("../secret")).toBe(false);
    expect(hashGuestToken(a, "key")).not.toBe(a);
    expect(hashGuestToken(a, "key")).not.toBe(hashGuestToken(a, "other"));
  });
  it("bounds movement deterministically", () => {
    expect(advancePosition({ x: 480, y: 320 }, { x: 500, y: 320 }, 10)).toEqual(
      { x: 490, y: 320 },
    );
    expect(
      advancePosition({ x: 30, y: 30 }, { x: -999, y: -999 }, 10000),
    ).toEqual({ x: 24, y: 24 });
  });
  it("fails closed on production misconfiguration without leaking env values", () => {
    expect(() => readConfig({ APP_ENV: "production" })).toThrow("NONLOCAL");
    expect(() => readConfig({ PLAYER_STORE: "postgres" })).toThrow(
      "DATABASE_AND_SECRET_REQUIRED",
    );
    expect(() => readConfig({ API_PORT: "secret-value" })).toThrow(
      "INVALID_ENVIRONMENT:API_PORT",
    );
    expect(readConfig({}).PLAYER_STORE).toBe("memory");
    expect(() => readConfig({ NODE_ENV: "production" })).toThrow(
      "APP_ENV_REQUIRED",
    );
  });
  it("never logs credential fields", () => {
    const value = logRecord({
      service: "api",
      password: "secret",
      token: "secret",
      body: "private",
      requestId: "abc",
    });
    expect(value).not.toContain("secret");
    expect(value).not.toContain("private");
    expect(value).toContain("abc");
  });
});
