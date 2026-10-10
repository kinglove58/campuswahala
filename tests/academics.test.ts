import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import {
  academicCommandSchema,
  academicClock,
  createTerm,
  simulationCourses,
  gameGradePolicy,
  validatePolicy,
  validateCourse,
  weightedScore,
  grade,
  aggregateResults,
  applyAcademicCommand,
  completeResults,
  decideProgression,
  processTime,
  assessmentScore,
  allowedActions,
  validateTimetable,
  type AcademicTerm,
  type AcademicHistory,
} from "../packages/domain/src/academics";
import { createCampusWorld, WorldEngine } from "../packages/game-engine/src";
export function fixtureTerm(track: "computing" | "engineering" = "computing") {
  const w = createCampusWorld("futa");
  const venues = w.venues.map((v) => ({
    ...v,
    ...w.spawnPoints.find((s) => s.id === v.safeSpawnId)!,
    id: v.id,
  }));
  return createTerm({
    id: randomUUID(),
    sequence: 1,
    label: "Simulation semester",
    track,
    programmeId: randomUUID(),
    structureId: randomUUID(),
    structureVersion: 1,
    stageId: randomUUID(),
    semesterId: randomUUID(),
    entryMode: "standard",
    activityTags: [],
    campusId: w.campusId,
    worldVersion: w.version,
    venues,
    presenceVenueId: venues.find((v) => v.type === "hostel")!.id,
    studyVenueIds: venues
      .filter((v) => ["library", "hostel"].includes(v.type))
      .map((v) => v.id),
    templates: simulationCourses(track, 0, 0),
  });
}
const run = (term: AcademicTerm, input: object) =>
  applyAcademicCommand(
    term,
    academicCommandSchema.parse({
      commandId: randomUUID(),
      termId: term.id,
      ...input,
    }),
  );
describe("versioned CampusWahala academic domain", () => {
  it("provides two six-course, weighted, nonofficial, nonoverlapping tracks", () => {
    for (const track of ["computing", "engineering"] as const) {
      const t = fixtureTerm(track);
      expect(t.courses).toHaveLength(6);
      t.courses.forEach(validateCourse);
      validateTimetable(t);
      expect(new Set(t.courses.map((c) => c.units)).size).toBe(3);
      expect(t.courses.every((c) => c.code.startsWith("CW-"))).toBe(true);
    }
  });
  it("rejects all client authority fields and fake identifiers at the strict contract", () => {
    for (const type of ["START_TERM", "STUDY", "TAKE_EXAM", "COMPLETE_TERM"]) {
      const good =
        type === "START_TERM"
          ? { commandId: randomUUID(), type }
          : {
              commandId: randomUUID(),
              termId: randomUUID(),
              type,
              ...(type === "STUDY"
                ? { courseId: "course", minutes: 60 }
                : type === "TAKE_EXAM"
                  ? { courseId: "course" }
                  : {}),
            };
      for (const key of [
        "score",
        "grade",
        "points",
        "GPA",
        "CGPA",
        "masteryGain",
        "attendance",
        "attended",
        "timeCost",
        "time",
        "x",
        "y",
        "venue",
        "userId",
        "enrollment",
        "randomSeed",
        "roll",
        "progression",
        "revision",
      ]) {
        expect(
          academicCommandSchema.safeParse({ ...good, [key]: 100 }).success,
        ).toBe(false);
      }
    }
    for (const minutes of [0, 1, 59, 999999, -1])
      expect(
        academicCommandSchema.safeParse({
          commandId: randomUUID(),
          termId: randomUUID(),
          type: "STUDY",
          courseId: "course",
          minutes,
        }).success,
      ).toBe(false);
    expect(
      academicCommandSchema.safeParse({
        commandId: randomUUID(),
        termId: randomUUID(),
        type: "TRAVEL_TO_VENUE",
        venueId: "<script>",
      }).success,
    ).toBe(false);
  });
  it.each([
    [6999, "B"],
    [7000, "A"],
    [6000, "B"],
    [5999, "C"],
    [5000, "C"],
    [4999, "D"],
    [4500, "D"],
    [4499, "E"],
    [4000, "E"],
    [3999, "F"],
    [0, "F"],
    [10000, "A"],
  ])("grades integer boundary %i as %s", (score, letter) =>
    expect(grade(score as number, gameGradePolicy).letter).toBe(letter),
  );
  it("rejects malformed policies/weights and computes weighted integer scores", () => {
    expect(
      weightedScore(
        { assignment: 10000, test: 5000, exam: 8000 },
        { assignment: 2000, test: 2000, exam: 6000 },
      ),
    ).toBe(7800);
    for (const changes of [
      { version: 0 },
      { passScore: 10001 },
      { bands: [{ minimum: 1, letter: "A", points: 5000 }] },
      {
        bands: [
          { minimum: 5000, letter: "A", points: 5000 },
          { minimum: 5000, letter: "B", points: 4000 },
          { minimum: 0, letter: "F", points: 0 },
        ],
      },
    ])
      expect(() =>
        validatePolicy({ ...gameGradePolicy, ...changes }),
      ).toThrow();
    expect(() =>
      validateCourse({
        ...simulationCourses("engineering", 0, 0)[0]!,
        weights: { assignment: 2000, test: 2000, exam: 5999 },
      }),
    ).toThrow();
    expect(() => grade(10000.5, gameGradePolicy)).toThrow();
  });
  it("combines underlying units/quality points, rather than averaging GPAs", () => {
    const result = (units: number, points: number) => ({
      courseId: randomUUID(),
      code: "CW-CMP-101",
      units,
      points,
      score: 7000,
      grade: "A",
      passed: true,
      policyId: "cw",
      policyVersion: 1,
    });
    const first = aggregateResults([result(2, 5000)], []);
    const history = [{ result: first }] as AcademicHistory[];
    const second = aggregateResults([result(6, 1000)], history);
    expect(second).toMatchObject({
      qualityPoints: 6000,
      cumulativeQualityPoints: 16000,
      cumulativeUnits: 8,
      cgpaScaled: 2000,
      gpaScaled: 1000,
    });
    expect(second.cgpaScaled).not.toBe(3000);
  });
  it("visual teleportation cannot grant attendance and authoritative travel advances time", () => {
    const t = fixtureTerm(),
      c = t.courses[0]!,
      l = c.lectures[0]!;
    processTime(t, l.start);
    const visual = new WorldEngine(createCampusWorld("futa"));
    visual.position = { x: 900, y: 900 };
    expect(() => run(t, { type: "ATTEND_LECTURE", lectureId: l.id })).toThrow(
      "LECTURE_NOT_ELIGIBLE",
    );
    const before = t.minute;
    run(t, { type: "TRAVEL_TO_VENUE", venueId: l.venueId });
    expect(t.minute).toBeGreaterThan(before);
    run(t, { type: "ATTEND_LECTURE", lectureId: l.id });
    expect(l.status).toBe("attended");
    expect(c.mastery).toBe(800);
    expect(() => run(t, { type: "ATTEND_LECTURE", lectureId: l.id })).toThrow();
    expect(() =>
      run(t, { type: "TRAVEL_TO_VENUE", venueId: "unilag-unknown" }),
    ).toThrow();
  });
  it("validates term identity, study venue/duration, effort and submission lifecycle", () => {
    const t = fixtureTerm(),
      c = t.courses[0]!;
    expect(() =>
      applyAcademicCommand(t, {
        commandId: randomUUID(),
        termId: randomUUID(),
        type: "END_DAY",
      }),
    ).toThrow("TERM_REVISION_CONFLICT");
    run(t, { type: "STUDY", courseId: c.id, minutes: 120 });
    const gain = c.mastery;
    run(t, { type: "STUDY", courseId: c.id, minutes: 120 });
    expect(c.mastery - gain).toBeLessThan(gain);
    run(t, { type: "WORK_ON_ASSIGNMENT", courseId: c.id, minutes: 60 });
    expect(c.assignment.effort).toBe(60);
    run(t, { type: "SUBMIT_ASSIGNMENT", courseId: c.id });
    expect(c.assignment.evidence?.strategyVersion).toBe(1);
    expect(() =>
      run(t, { type: "SUBMIT_ASSIGNMENT", courseId: c.id }),
    ).toThrow();
    expect(() =>
      run(t, {
        type: "STUDY",
        courseId: "another-account-course",
        minutes: 30,
      }),
    ).toThrow();
    t.presenceVenueId = t.venues.find((v) => v.type === "lecture_hall")!.id;
    expect(() =>
      run(t, { type: "STUDY", courseId: c.id, minutes: 30 }),
    ).toThrow("STUDY_VENUE_REQUIRED");
  });
  it("server time marks crossed lectures/assignments/tests/exams missed; no early result", () => {
    const t = fixtureTerm(),
      c = t.courses[0]!;
    expect(() => completeResults(t, [])).toThrow("TERM_NOT_READY");
    expect(() => run(t, { type: "TAKE_EXAM", courseId: c.id })).toThrow();
    while (t.minute < t.endMinute) run(t, { type: "END_DAY" });
    expect(c.lectures.every((l) => l.status === "missed")).toBe(true);
    expect(c.assignment.status).toBe("missed");
    expect(c.test.score).toBe(0);
    expect(c.exam.score).toBe(0);
    const results = completeResults(t, []);
    expect(results.courses.every((c) => !c.passed)).toBe(true);
    expect(results.gpaScaled).toBe(0);
    expect(() => completeResults(t, [])).toThrow();
  });
  it("assessment strategy is deterministic, bounded, snapshotted and single attempt", () => {
    const t = fixtureTerm(),
      c = t.courses[0]!;
    expect(() => run(t, { type: "TAKE_TEST", courseId: c.id })).toThrow();
    c.mastery = 9000;
    c.assignment.score = 9000;
    c.assignment.status = "submitted";
    c.lectures.forEach((l) => (l.status = "attended"));
    expect(assessmentScore(t, c)).toBe(9150);
    processTime(t, c.test.start);
    t.presenceVenueId = c.test.venueId;
    run(t, { type: "TAKE_TEST", courseId: c.id });
    expect(c.test.score).toBe(9150);
    expect(() => run(t, { type: "TAKE_TEST", courseId: c.id })).toThrow();
    processTime(t, c.exam.start);
    run(t, { type: "TAKE_EXAM", courseId: c.id });
    expect(c.exam.score).toBe(9150);
    expect(() => run(t, { type: "TAKE_EXAM", courseId: c.id })).toThrow();
    const copy = structuredClone(t.gradePolicy);
    gameGradePolicy.passScore = 5000;
    try {
      expect(t.gradePolicy).toEqual(copy);
    } finally {
      gameGradePolicy.passScore = 4000;
    }
  });
  it("wait checkpoints permit travel and waiting to the attendance window; calendar is action driven", () => {
    const t = fixtureTerm();
    run(t, { type: "WAIT_TO_NEXT_EVENT" });
    expect(t.minute).toBe(t.courses[0]!.lectures[0]!.start - 20);
    run(t, {
      type: "TRAVEL_TO_VENUE",
      venueId: t.courses[0]!.lectures[0]!.venueId,
    });
    run(t, { type: "WAIT_TO_NEXT_EVENT" });
    expect(allowedActions(t).some((c) => c.type === "ATTEND_LECTURE")).toBe(
      true,
    );
    const engine = new WorldEngine(createCampusWorld("futa"));
    engine.academicMinute = t.minute;
    engine.tick(50);
    expect(engine.time.label).toBe(academicClock(t.minute).clock);
  });
  it("rejects unknown venue, bad template references and timetable overlap", () => {
    const t = fixtureTerm();
    t.courses[0]!.lectures[0]!.venueId = "missing";
    expect(() => validateTimetable(t)).toThrow();
    const another = fixtureTerm();
    another.courses[1]!.lectures[0]!.start =
      another.courses[0]!.lectures[0]!.start;
    expect(() => validateTimetable(another)).toThrow("TIMETABLE_OVERLAP");
  });
  it.each(["computing", "engineering"] as const)(
    "plays %s from study/coursework through scheduled assessments to a passing final result",
    (track) => {
      const term = fixtureTerm(track);
      for (const c of term.courses) {
        for (let n = 0; n < 8; n++)
          run(term, { type: "STUDY", courseId: c.id, minutes: 120 });
        for (let n = 0; n < Math.ceil(c.requiredEffort / 60); n++)
          run(term, {
            type: "WORK_ON_ASSIGNMENT",
            courseId: c.id,
            minutes: 60,
          });
        run(term, { type: "SUBMIT_ASSIGNMENT", courseId: c.id });
      }
      run(term, {
        type: "TRAVEL_TO_VENUE",
        venueId: term.courses[0]!.test.venueId,
      });
      for (let n = 0; n < 120 && term.minute < term.endMinute; n++) {
        const action = allowedActions(term).find((c) =>
          ["TAKE_TEST", "TAKE_EXAM", "ATTEND_LECTURE"].includes(c.type),
        );
        if (action) applyAcademicCommand(term, action);
        else run(term, { type: "WAIT_TO_NEXT_EVENT" });
      }
      const result = completeResults(term, []);
      expect(
        term.courses.every(
          (c) =>
            c.assignment.status === "submitted" &&
            c.test.status === "taken" &&
            c.exam.status === "taken",
        ),
      ).toBe(true);
      expect(result.courses.every((c) => c.passed)).toBe(true);
      expect(result.attemptedUnits).toBe(14);
      expect(result.gpaScaled).toBeGreaterThanOrEqual(3000);
    },
  );
  it("allocates nonoverlapping lecture/test/exam slots for every supported carryover load", () => {
    const fixture = fixtureTerm();
    for (let count = 5; count <= 12; count++) {
      const templates = [
        ...simulationCourses("computing", 0, 0),
        ...simulationCourses("computing", 0, 1),
      ].slice(0, count);
      const { courses: _, ...base } = fixture;
      void _;
      const term = createTerm({ ...base, templates });
      validateTimetable(term);
      expect(term.courses).toHaveLength(count);
    }
  });
  it("progresses by explicit stage/semester order, preserves SIWES/project tags and holds at the configured end", () => {
    const term = fixtureTerm();
    processTime(term, term.endMinute);
    completeResults(term, []);
    term.result!.courses.forEach((c) => (c.passed = true));
    const nextStageId = randomUUID(),
      nextSemesterId = randomUUID(),
      secondSemesterId = randomUUID();
    const refs = {
      stages: [
        { id: term.stageId, order: 7, activityTags: [] },
        {
          id: nextStageId,
          order: 42,
          activityTags: ["siwes", "final-project"],
        },
      ],
      semesters: [
        { id: term.semesterId, stageId: term.stageId, order: 0 },
        { id: secondSemesterId, stageId: term.stageId, order: 1 },
        { id: nextSemesterId, stageId: nextStageId, order: 0 },
      ],
    };
    expect(decideProgression(term, refs)).toMatchObject({
      outcome: "progress",
      nextStageId: term.stageId,
      nextSemesterId: secondSemesterId,
    });
    term.semesterId = secondSemesterId;
    expect(decideProgression(term, refs)).toMatchObject({
      outcome: "progress",
      nextStageId,
      nextSemesterId,
      activityTags: ["siwes", "final-project"],
    });
    term.stageId = nextStageId;
    term.semesterId = nextSemesterId;
    expect(decideProgression(term, refs).outcome).toBe("hold");
    term.stageId = refs.stages[0]!.id;
    term.semesterId = refs.semesters[0]!.id;
    term.result!.courses[0]!.passed = false;
    expect(decideProgression(term, refs).outcome).toBe(
      "progress_with_carryovers",
    );
    term.result!.courses.forEach((c) => (c.passed = false));
    expect(decideProgression(term, refs).outcome).toBe("repeat_stage");
    term.progressionPolicy.repeatFailedUnitsBasisPoints = 10000;
    term.result!.courses.at(-1)!.passed = true;
    expect(decideProgression(term, refs).outcome).toBe(
      "progress_with_carryovers",
    );
  });
});
