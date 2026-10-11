import { it, expect } from "vitest";
import { campusLifeContext } from "../apps/game/app/life-context";
import { lifeTerm } from "./life-fixture";
import {
  createLife,
  type AcademicView,
  type LifeView,
} from "../packages/domain/src";
function fixture() {
  const term = lifeTerm();
  const academic = { term, carryovers: [] } as unknown as AcademicView;
  const life: LifeView = {
    state: createLife(term),
    pending: null,
    recent: [],
    allowedActions: [],
  };
  return { term, academic, life };
}
it("uses authoritative presence and selects the earliest scheduled lecture/test/exam without mutation", () => {
  const { term, academic, life } = fixture();
  const original = structuredClone({ academic, life });
  const current = term.venues.find((v) => v.id === term.presenceVenueId)!;
  expect(campusLifeContext(academic, life)?.venue).toBe(current.name);
  expect(campusLifeContext(academic, life)?.next).toContain("lecture");
  expect({ academic, life }).toEqual(original);
  term.courses.forEach((c) => c.lectures.forEach((l) => (l.status = "missed")));
  expect(campusLifeContext(academic, life)?.next).toContain("test");
  term.courses.forEach((c) => (c.test.status = "taken"));
  expect(campusLifeContext(academic, life)?.next).toContain("examination");
  term.courses.forEach((c) => (c.exam.status = "taken"));
  expect(campusLifeContext(academic, life)?.next).toContain("No upcoming");
});
it("shows outstanding carryovers once and gives one contextual suggestion without changing authority", () => {
  const { academic, life, term } = fixture();
  academic.carryovers = [term.courses[0]!, term.courses[0]!];
  expect(campusLifeContext(academic, life)?.carryovers).toEqual([
    term.courses[0]!.code,
  ]);
  life.state!.metrics.satiety = 0;
  expect(campusLifeContext(academic, life)?.suggestion).toContain("hungry");
  life.state!.metrics.satiety = 7000;
  life.state!.metrics.energy = 0;
  expect(campusLifeContext(academic, life)?.suggestion).toContain("rest");
  term.minute = term.courses[0]!.lectures[0]!.start - 30;
  expect(campusLifeContext(academic, life)?.suggestion).toContain(
    "approaching",
  );
  term.status = "completed";
  expect(campusLifeContext(academic, life)).toBeNull();
  expect(campusLifeContext(null, null)).toBeNull();
});
