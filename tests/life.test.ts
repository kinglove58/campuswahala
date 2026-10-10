import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { lifeTerm } from "./life-fixture";
import { createCampusWorld, WorldEngine } from "../packages/game-engine/src";
import {
  advanceLifeState,
  applyLifeCommand,
  attachLife,
  conditionMatches,
  createLife,
  lifeActions,
  lifeCommandSchema,
  lifePolicySchema,
  selectWahala,
  wahalaTemplates,
  wahalaTemplateSchema,
  type WahalaOccurrence,
} from "../packages/domain/src/life";
import { applyAcademicCommand } from "../packages/domain/src/academics";
describe("single-timeline private CampusWahala life", () => {
  it("resumes the cosmetic avatar only at known spawns without changing academic authority", () => {
    const t = lifeTerm(),
      s = createLife(t),
      w = createCampusWorld("futa"),
      engine = new WorldEngine(w),
      minute = t.minute,
      presence = t.presenceVenueId;
    const home = w.venues.find((v) => v.id === s.homeVenueId)!;
    expect(engine.resumeAtSpawn(home.safeSpawnId)).toBe(true);
    expect(engine.position).toEqual({
      x: w.spawnPoints.find((p) => p.id === home.safeSpawnId)!.x,
      y: w.spawnPoints.find((p) => p.id === home.safeSpawnId)!.y,
    });
    expect(engine.resumeAtSpawn("untrusted-spawn")).toBe(false);
    expect(t.minute).toBe(minute);
    expect(t.presenceVenueId).toBe(presence);
  });
  it("has ten strict, versioned fictional situations and a neutral exit for each", () => {
    expect(wahalaTemplates).toHaveLength(10);
    expect(new Set(wahalaTemplates.map((t) => t.id)).size).toBe(10);
    wahalaTemplates.forEach((t) =>
      expect(wahalaTemplateSchema.safeParse(t).success).toBe(true),
    );
    expect(
      wahalaTemplateSchema.safeParse({
        ...wahalaTemplates[0],
        eligibility: [{ op: "eval", script: "true" }],
      }).success,
    ).toBe(false);
  });
  it("rejects every client authority input and unknown policy/DSL", () => {
    const command = {
      commandId: randomUUID(),
      termId: randomUUID(),
      type: "EAT",
      optionId: "proper-meal",
    };
    expect(lifeCommandSchema.safeParse(command).success).toBe(true);
    for (const key of [
      "energy",
      "satiety",
      "mood",
      "wellbeing",
      "time",
      "timeCost",
      "userId",
      "venueId",
      "seed",
      "roll",
      "templateId",
      "grade",
      "gpa",
      "effects",
      "flags",
    ])
      expect(
        lifeCommandSchema.safeParse({ ...command, [key]: 10000 }).success,
      ).toBe(false);
    const term = lifeTerm(),
      s = createLife(term);
    expect(conditionMatches({ op: "unknown" }, s, term, [])).toBe(false);
    expect(
      lifePolicySchema.safeParse({ ...s.policy, version: 999 }).success,
    ).toBe(false);
  });
  it("fractional decay and low-satiety thresholds are batching invariant and interval replay is a no-op", () => {
    const t = lifeTerm(),
      one = createLife(t),
      split = structuredClone(one);
    one.metrics.satiety = split.metrics.satiety = 2010;
    advanceLifeState(one, 420, 600);
    for (let m = 420; m < 600; m += 15) advanceLifeState(split, m, m + 15);
    expect(split).toEqual(one);
    const result = structuredClone(one);
    advanceLifeState(one, 420, 600);
    expect(one).toEqual(result);
    expect(() => advanceLifeState(one, 601, 620)).toThrow(
      "INVALID_LIFE_INTERVAL",
    );
  });
  it("processes the canonical term endpoint including its initial 07:00 offset", () => {
    const t = lifeTerm(),
      s = createLife(t);
    advanceLifeState(s, t.minute, t.endMinute);
    expect(s.lastProcessedMinute).toBe(t.endMinute);
    expect(Object.values(s.metrics).every((v) => v >= 0 && v <= 10000)).toBe(
      true,
    );
  });
  it("real-world waiting and reads never decay; life persists over term attachment", () => {
    const t = lifeTerm(),
      s = createLife(t),
      old = structuredClone(s.metrics);
    const next = lifeTerm();
    attachLife(s, next);
    expect(s.metrics).toEqual(old);
    expect(s.lastProcessedMinute).toBe(next.minute);
    expect(s.termId).toBe(next.id);
    expect(next.venues.find((v) => v.id === s.homeVenueId)?.type).toBe(
      "hostel",
    );
  });
  it("valid virtual housing exists on all three campuses", () => {
    for (const campus of ["futa", "oau", "unilag"] as const) {
      const t = lifeTerm(campus),
        s = createLife(t);
      expect(
        t.venues.some((v) => v.id === s.homeVenueId && v.type === "hostel"),
      ).toBe(true);
    }
  });
  it("sleep advances the academic timeline, genuinely misses a lecture and preserves grading definitions", () => {
    const t = lifeTerm(),
      s = createLife(t),
      course = structuredClone(t.courses[0]),
      policy = structuredClone(t.gradePolicy);
    s.metrics.energy = 500;
    applyLifeCommand(
      s,
      t,
      lifeCommandSchema.parse({
        commandId: randomUUID(),
        termId: t.id,
        type: "SLEEP",
        optionId: "sleep-six",
      }),
      [],
    );
    expect(t.minute).toBe(780);
    expect(s.lastProcessedMinute).toBe(t.minute);
    expect(t.courses[0]!.lectures[0]!.status).toBe("missed");
    expect(t.courses[0]!.mastery).toBe(course!.mastery);
    expect(t.gradePolicy).toEqual(policy);
    expect(s.metrics.energy).toBeGreaterThan(500);
  });
  it("food requires authoritative presence; impossible option/time/venue choices fail", () => {
    const t = lifeTerm(),
      s = createLife(t),
      c = lifeCommandSchema.parse({
        commandId: randomUUID(),
        termId: t.id,
        type: "EAT",
        optionId: "proper-meal",
      });
    expect(() => applyLifeCommand(s, t, c, [])).toThrow("LIFE_VENUE_REQUIRED");
    t.presenceVenueId = t.venues.find((v) => v.type === "food")!.id;
    applyLifeCommand(s, t, c, []);
    expect(t.minute).toBe(450);
    expect(s.metrics.satiety).toBe(10000);
    expect(() =>
      applyLifeCommand(
        s,
        t,
        lifeCommandSchema.parse({ ...c, type: "SLEEP" }),
        [],
      ),
    ).toThrow("LIFE_OPTION_UNAVAILABLE");
  });
  it("zero metrics never prevent authoritative travel, rest or sleep and no action exceeds term end", () => {
    const t = lifeTerm(),
      s = createLife(t);
    for (const k of ["energy", "satiety", "mood", "wellbeing"] as const)
      s.metrics[k] = 0;
    applyAcademicCommand(t, {
      type: "TRAVEL_TO_VENUE",
      commandId: randomUUID(),
      termId: t.id,
      venueId: t.venues.find((v) => v.type === "library")!.id,
    });
    advanceLifeState(s, 420, t.minute);
    applyAcademicCommand(t, {
      type: "TRAVEL_TO_VENUE",
      commandId: randomUUID(),
      termId: t.id,
      venueId: s.homeVenueId,
    });
    advanceLifeState(s, s.lastProcessedMinute, t.minute);
    expect(lifeActions(s, t, []).some((c) => c.type === "SLEEP")).toBe(true);
    t.minute = t.endMinute - 1;
    s.lastProcessedMinute = t.minute;
    expect(lifeActions(s, t, [])).toHaveLength(0);
  });
  it("server selection respects one pending, daily/global/template/term budgets and no client weather", () => {
    const t = lifeTerm(),
      s = createLife(t);
    t.presenceVenueId = t.venues.find((v) => v.type === "food")!.id;
    const h = selectWahala(s, t, [], randomUUID(), () => 0)!;
    expect(h.template.id).toBe("cw-food-queue");
    expect(selectWahala(s, t, [h], randomUUID(), () => 0)).toBeNull();
    expect(() => selectWahala(s, t, [], randomUUID(), (u) => u)).toThrow(
      "INVALID_SERVER_ROLL",
    );
    h.status = "dismissed";
    t.minute += 200;
    s.lastProcessedMinute = t.minute;
    expect(
      selectWahala(s, t, [h], randomUUID(), () => 0)?.template.id,
    ).not.toBe(h.template.id);
    const two = structuredClone(h);
    two.id = randomUUID();
    two.triggeredMinute = t.minute;
    expect(selectWahala(s, t, [h, two], randomUUID(), () => 0)).toBeNull();
    expect(
      wahalaTemplates.some((x) =>
        JSON.stringify(x.eligibility).includes("weather"),
      ),
    ).toBe(false);
  });
  it("Wahala resolution is bounded, auditable, one-time and expires without blocking academics", () => {
    const t = lifeTerm(),
      s = createLife(t);
    t.presenceVenueId = t.venues.find((v) => v.type === "food")!.id;
    const h = selectWahala(s, t, [], randomUUID(), () => 0)!,
      history: WahalaOccurrence[] = [h];
    const c = lifeCommandSchema.parse({
      type: "RESOLVE_WAHALA",
      commandId: randomUUID(),
      termId: t.id,
      occurrenceId: h.id,
      choiceId: "take-time",
    });
    applyLifeCommand(s, t, c, history);
    expect(h.status).toBe("resolved");
    expect(h.resolvedMinute).toBe(465);
    expect(s.flags).toContain("long_food_queue");
    expect(h.effect!.satiety).toBe(4000);
    expect(() => applyLifeCommand(s, t, c, history)).toThrow(
      "WAHALA_NOT_PENDING",
    );
    const late = structuredClone(h);
    late.status = "pending";
    late.expiresMinute = t.minute - 1;
    expect(() =>
      applyLifeCommand(
        s,
        t,
        lifeCommandSchema.parse({ ...c, occurrenceId: late.id }),
        [late],
      ),
    ).toThrow("WAHALA_NOT_PENDING");
    expect(t.courses.every((c) => c.result === null)).toBe(true);
  });
});
