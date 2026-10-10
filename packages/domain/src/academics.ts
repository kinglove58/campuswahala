import { z } from "zod";
/** Private CampusWahala simulation contracts. Never official university curriculum. */
const id = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-zA-Z0-9-]+$/);
const envelope = { commandId: z.string().uuid(), termId: z.string().uuid() };
export const academicCommandSchema = z.discriminatedUnion("type", [
  z
    .object({ commandId: z.string().uuid(), type: z.literal("START_TERM") })
    .strict(),
  z
    .object({ ...envelope, type: z.literal("TRAVEL_TO_VENUE"), venueId: id })
    .strict(),
  z
    .object({ ...envelope, type: z.literal("ATTEND_LECTURE"), lectureId: id })
    .strict(),
  z
    .object({
      ...envelope,
      type: z.literal("STUDY"),
      courseId: id,
      minutes: z.union([z.literal(30), z.literal(60), z.literal(120)]),
    })
    .strict(),
  z
    .object({
      ...envelope,
      type: z.literal("WORK_ON_ASSIGNMENT"),
      courseId: id,
      minutes: z.union([z.literal(30), z.literal(60)]),
    })
    .strict(),
  z
    .object({ ...envelope, type: z.literal("SUBMIT_ASSIGNMENT"), courseId: id })
    .strict(),
  z
    .object({ ...envelope, type: z.literal("TAKE_TEST"), courseId: id })
    .strict(),
  z
    .object({ ...envelope, type: z.literal("TAKE_EXAM"), courseId: id })
    .strict(),
  z.object({ ...envelope, type: z.literal("END_DAY") }).strict(),
  z.object({ ...envelope, type: z.literal("WAIT_TO_NEXT_EVENT") }).strict(),
  z.object({ ...envelope, type: z.literal("COMPLETE_TERM") }).strict(),
]);
export type AcademicCommand = z.infer<typeof academicCommandSchema>;
export interface GradePolicy {
  id: string;
  version: number;
  passScore: number;
  bands: Array<{ minimum: number; letter: string; points: number }>;
  retakes: "all_attempts";
}
export const gameGradePolicy: GradePolicy = {
  id: "cw-five-point",
  version: 1,
  passScore: 4000,
  retakes: "all_attempts",
  bands: [
    { minimum: 7000, letter: "A", points: 5000 },
    { minimum: 6000, letter: "B", points: 4000 },
    { minimum: 5000, letter: "C", points: 3000 },
    { minimum: 4500, letter: "D", points: 2000 },
    { minimum: 4000, letter: "E", points: 1000 },
    { minimum: 0, letter: "F", points: 0 },
  ],
};
export interface ProgressionPolicy {
  id: string;
  version: number;
  repeatFailedUnitsBasisPoints: number;
  maximumUnits: number;
}
export const gameProgressionPolicy: ProgressionPolicy = {
  id: "cw-progression",
  version: 1,
  repeatFailedUnitsBasisPoints: 5000,
  maximumUnits: 36,
};
export interface CourseTemplate {
  id: string;
  code: string;
  title: string;
  version: number;
  units: number;
  difficulty: number;
  requiredEffort: number;
  weights: { assignment: number; test: number; exam: number };
}
export interface AssessmentStrategy {
  id: string;
  version: number;
  assessmentMasteryWeight: number;
  attendanceWeight: number;
  courseworkWeight: number;
  assignmentMasteryWeight: number;
  effortWeight: number;
  studyGainPerMinute: number;
  lectureGain: number;
  workGainPerMinute: number;
}
export const assessmentStrategy: AssessmentStrategy = {
  id: "cw-preparedness",
  version: 1,
  assessmentMasteryWeight: 7500,
  attendanceWeight: 1500,
  courseworkWeight: 1000,
  assignmentMasteryWeight: 4000,
  effortWeight: 6000,
  studyGainPerMinute: 20,
  lectureGain: 800,
  workGainPerMinute: 8,
};
export interface Lecture {
  id: string;
  start: number;
  duration: number;
  venueId: string;
  status: "scheduled" | "attended" | "missed";
  attendedMinute?: number;
}
export interface AssessmentWindow {
  start: number;
  duration: number;
  venueId: string;
  status: "scheduled" | "taken" | "missed";
  score: number | null;
  evidence?: CalculationEvidence;
}
export interface CalculationEvidence {
  strategyId: string;
  strategyVersion: number;
  mastery: number;
  attended: number;
  lectureCount: number;
  effort: number;
  timeliness: number;
  score: number;
}
export interface CourseResult {
  courseId: string;
  code: string;
  units: number;
  score: number;
  grade: string;
  points: number;
  passed: boolean;
  policyId: string;
  policyVersion: number;
}
export interface CourseOffering extends CourseTemplate {
  carryover: boolean;
  mastery: number;
  lectures: Lecture[];
  assignment: {
    release: number;
    due: number;
    effort: number;
    status: "scheduled" | "in_progress" | "submitted" | "missed";
    score: number | null;
    evidence?: CalculationEvidence;
  };
  test: AssessmentWindow;
  exam: AssessmentWindow;
  result: CourseResult | null;
}
export interface TermResult {
  courses: CourseResult[];
  attemptedUnits: number;
  qualityPoints: number;
  gpaScaled: number;
  cumulativeUnits: number;
  cumulativeQualityPoints: number;
  cgpaScaled: number;
}
export interface ProgressionDecision {
  outcome: "progress" | "progress_with_carryovers" | "repeat_stage" | "hold";
  reason: string;
  nextStageId: string;
  nextSemesterId: string;
  activityTags: string[];
  policyId: string;
  policyVersion: number;
}
export interface AcademicTerm {
  schemaVersion: 1;
  id: string;
  sequence: number;
  label: string;
  status: "active" | "completed";
  track: "computing" | "engineering";
  curriculumVersion: number;
  programmeId: string;
  structureId: string;
  structureVersion: number;
  stageId: string;
  semesterId: string;
  entryMode: string;
  activityTags: string[];
  campusId: string;
  worldVersion: number;
  minute: number;
  endMinute: number;
  presenceVenueId: string;
  venues: Array<{
    id: string;
    name: string;
    type: string;
    x: number;
    y: number;
  }>;
  travelPolicy: {
    id: string;
    version: number;
    minimumMinutes: number;
    maximumMinutes: number;
    distancePerMinute: number;
  };
  studyVenueIds: string[];
  courses: CourseOffering[];
  gradePolicy: GradePolicy;
  progressionPolicy: ProgressionPolicy;
  strategy: AssessmentStrategy;
  result: TermResult | null;
  progression: ProgressionDecision | null;
}
export interface AcademicHistory {
  termId: string;
  sequence: number;
  label: string;
  stageId: string;
  semesterId: string;
  result: TermResult;
  progression: ProgressionDecision;
}
export interface AcademicView {
  revision: number;
  term: AcademicTerm | null;
  history: AcademicHistory[];
  carryovers: CourseTemplate[];
  allowedActions: AcademicCommand[];
  notifications: Array<{ id: string; message: string }>;
  position: {
    programme: string;
    stage: string;
    semester: string;
    entryMode: string;
    activityTags: string[];
  };
}
export class AcademicError extends Error {}
const ensure = (test: unknown, code: string): void => {
  if (!test) throw new AcademicError(code);
};
const integer = (n: number, min: number, max: number) =>
  Number.isSafeInteger(n) && n >= min && n <= max;
export function validatePolicy(policy: GradePolicy) {
  ensure(
    policy.retakes === "all_attempts" &&
      integer(policy.version, 1, 1000) &&
      integer(policy.passScore, 1, 10000),
    "INVALID_GRADE_POLICY",
  );
  ensure(
    policy.bands.length >= 2 && policy.bands.at(-1)?.minimum === 0,
    "INVALID_GRADE_POLICY",
  );
  let previous = 10001,
    previousPoints = 5001;
  for (const b of policy.bands) {
    ensure(
      integer(b.minimum, 0, 10000) &&
        b.minimum < previous &&
        integer(b.points, 0, 5000) &&
        b.points < previousPoints &&
        /^[A-Z]{1,2}$/.test(b.letter),
      "INVALID_GRADE_POLICY",
    );
    previous = b.minimum;
    previousPoints = b.points;
  }
}
export function validateCourse(course: CourseTemplate) {
  ensure(
    /^CW-(CMP|ENG)-[0-9]{3}$/.test(course.code) &&
      integer(course.version, 1, 1000) &&
      integer(course.units, 1, 6) &&
      integer(course.difficulty, 0, 3000) &&
      integer(course.requiredEffort, 30, 240),
    "INVALID_COURSE_TEMPLATE",
  );
  const weights = Object.values(course.weights);
  ensure(
    weights.every((w) => integer(w, 1, 10000)) &&
      weights.reduce((a, b) => a + b, 0) === 10000,
    "INVALID_ASSESSMENT_WEIGHTS",
  );
}
export function grade(score: number, policy: GradePolicy) {
  validatePolicy(policy);
  ensure(integer(score, 0, 10000), "INVALID_SCORE");
  return policy.bands.find((b) => score >= b.minimum)!;
}
export function weightedScore(
  scores: CourseTemplate["weights"],
  weights: CourseTemplate["weights"],
) {
  ensure(
    Object.values(scores).every((n) => integer(n, 0, 10000)) &&
      Object.values(weights).every((n) => integer(n, 1, 10000)) &&
      Object.values(weights).reduce((a, b) => a + b, 0) === 10000,
    "INVALID_ASSESSMENT_WEIGHTS",
  );
  return Math.floor(
    (scores.assignment * weights.assignment +
      scores.test * weights.test +
      scores.exam * weights.exam) /
      10000,
  );
}
export function aggregateResults(
  courses: CourseResult[],
  history: AcademicHistory[],
): TermResult {
  const attemptedUnits = courses.reduce((a, c) => a + c.units, 0);
  const qualityPoints = courses.reduce((a, c) => a + c.units * c.points, 0);
  const cumulativeUnits =
    attemptedUnits + history.reduce((a, t) => a + t.result.attemptedUnits, 0);
  const cumulativeQualityPoints =
    qualityPoints + history.reduce((a, t) => a + t.result.qualityPoints, 0);
  ensure(
    attemptedUnits > 0 && Number.isSafeInteger(cumulativeQualityPoints),
    "INVALID_RESULT_COMPONENTS",
  );
  return {
    courses,
    attemptedUnits,
    qualityPoints,
    gpaScaled: Math.floor(
      (qualityPoints * 2 + attemptedUnits) / (attemptedUnits * 2),
    ),
    cumulativeUnits,
    cumulativeQualityPoints,
    cgpaScaled: Math.floor(
      (cumulativeQualityPoints * 2 + cumulativeUnits) / (cumulativeUnits * 2),
    ),
  };
}
export function simulationCourses(
  track: AcademicTerm["track"],
  stageOrder: number,
  semesterOrder: number,
): CourseTemplate[] {
  ensure(
    integer(stageOrder, 0, 20) && integer(semesterOrder, 0, 4),
    "UNSUPPORTED_ACADEMIC_POSITION",
  );
  const titles =
    track === "computing"
      ? [
          "Computational Thinking",
          "Programming Workshop",
          "Data and Logic",
          "Digital Systems",
          "Software Design Studio",
          "Technical Communication",
        ]
      : [
          "Engineering Mathematics",
          "Applied Mechanics",
          "Materials Workshop",
          "Circuit Fundamentals",
          "Engineering Design Studio",
          "Technical Communication",
        ];
  return titles.map((title, i) => ({
    id: `${track}-s${stageOrder}-t${semesterOrder}-c${i + 1}`,
    code: `CW-${track === "computing" ? "CMP" : "ENG"}-${(stageOrder + 1) * 100 + semesterOrder * 20 + i + 1}`,
    title,
    version: 1,
    units: [3, 3, 2, 3, 2, 1][i]!,
    difficulty: [0, 300, 600, 900, 500, 0][i]!,
    requiredEffort: [60, 90, 60, 120, 90, 60][i]!,
    weights:
      i === 4
        ? { assignment: 4000, test: 1000, exam: 5000 }
        : { assignment: 2000, test: 2000, exam: 6000 },
  }));
}
export function academicClock(minute: number) {
  const dayIndex = Math.floor(minute / 1440),
    hour = Math.floor((minute % 1440) / 60),
    minutes = minute % 60;
  return {
    week: Math.floor(dayIndex / 7) + 1,
    day: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ][dayIndex % 7]!,
    clock: `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    hour,
    period:
      hour < 6
        ? "night"
        : hour < 12
          ? "morning"
          : hour < 17
            ? "afternoon"
            : hour < 20
              ? "evening"
              : "night",
  };
}
export function createTerm(
  input: Omit<
    AcademicTerm,
    | "schemaVersion"
    | "status"
    | "curriculumVersion"
    | "minute"
    | "endMinute"
    | "courses"
    | "gradePolicy"
    | "progressionPolicy"
    | "strategy"
    | "result"
    | "progression"
    | "travelPolicy"
  > & { templates: CourseTemplate[] },
): AcademicTerm {
  const { templates, ...base } = input;
  ensure(
    templates.length >= 5 &&
      templates.length <= 12 &&
      new Set(templates.map((c) => c.id)).size === templates.length,
    "INVALID_ENROLLMENT",
  );
  templates.forEach(validateCourse);
  ensure(
    templates.reduce((a, c) => a + c.units, 0) <=
      gameProgressionPolicy.maximumUnits,
    "UNIT_LIMIT_EXCEEDED",
  );
  const hall = base.venues.find((v) => v.type === "lecture_hall");
  ensure(
    hall &&
      base.studyVenueIds.length > 0 &&
      base.venues.some((v) => v.id === base.presenceVenueId),
    "ACADEMIC_VENUES_UNAVAILABLE",
  );
  const courses = templates.map(
    (c, i): CourseOffering => ({
      ...structuredClone(c),
      carryover: false,
      mastery: 0,
      lectures: [0, 1, 2].map((week) => ({
        id: `lecture-${i}-${week}`,
        start: (week * 7 + Math.floor(i / 3)) * 1440 + (9 + (i % 3) * 2) * 60,
        duration: 60,
        venueId: hall!.id,
        status: "scheduled",
      })),
      assignment: {
        release: 420,
        due: 11 * 1440 + 17 * 60,
        effort: 0,
        status: "scheduled",
        score: null,
      },
      test: {
        start: (18 + Math.floor(i / 6)) * 1440 + 9 * 60 + (i % 6) * 60,
        duration: 60,
        venueId: hall!.id,
        status: "scheduled",
        score: null,
      },
      exam: {
        start: (21 + Math.floor(i / 6)) * 1440 + 9 * 60 + (i % 6) * 90,
        duration: 90,
        venueId: hall!.id,
        status: "scheduled",
        score: null,
      },
      result: null,
    }),
  );
  const term: AcademicTerm = {
    ...base,
    schemaVersion: 1,
    status: "active",
    curriculumVersion: 1,
    minute: 420,
    endMinute: 28 * 1440 + 420,
    courses,
    gradePolicy: structuredClone(gameGradePolicy),
    progressionPolicy: structuredClone(gameProgressionPolicy),
    strategy: structuredClone(assessmentStrategy),
    travelPolicy: {
      id: "cw-compressed-walk",
      version: 1,
      minimumMinutes: 5,
      maximumMinutes: 20,
      distancePerMinute: 180,
    },
    result: null,
    progression: null,
  };
  validateTimetable(term);
  return term;
}
export function validateTimetable(term: AcademicTerm) {
  const events = term.courses
    .flatMap((c) => [...c.lectures, c.test, c.exam])
    .sort((a, b) => a.start - b.start);
  for (let i = 0; i < events.length; i++) {
    const event = events[i]!;
    ensure(
      term.venues.some((v) => v.id === event.venueId) &&
        integer(event.start, 420, term.endMinute) &&
        integer(event.duration, 1, 120),
      "INVALID_TIMETABLE",
    );
    if (i > 0)
      ensure(
        events[i - 1]!.start + events[i - 1]!.duration <= event.start,
        "TIMETABLE_OVERLAP",
      );
  }
}
export function processTime(term: AcademicTerm, target: number) {
  ensure(integer(target, term.minute, term.endMinute), "INVALID_TIME_ADVANCE");
  term.minute = target;
  for (const c of term.courses) {
    for (const lecture of c.lectures)
      if (lecture.status === "scheduled" && target > lecture.start + 15)
        lecture.status = "missed";
    for (const a of [c.test, c.exam])
      if (a.status === "scheduled" && target > a.start + 15) {
        a.status = "missed";
        a.score = 0;
      }
    if (c.assignment.status !== "submitted" && target > c.assignment.due) {
      c.assignment.status = "missed";
      c.assignment.score = 0;
    }
  }
}
export function travelMinutes(term: AcademicTerm, venueId: string) {
  const from = term.venues.find((v) => v.id === term.presenceVenueId),
    to = term.venues.find((v) => v.id === venueId);
  ensure(from && to && from.id !== to.id, "INVALID_TRAVEL");
  return Math.max(
    term.travelPolicy.minimumMinutes,
    Math.min(
      term.travelPolicy.maximumMinutes,
      Math.ceil(
        Math.hypot(to!.x - from!.x, to!.y - from!.y) /
          term.travelPolicy.distancePerMinute,
      ),
    ),
  );
}
function evidence(
  term: AcademicTerm,
  c: CourseOffering,
  score: number,
): CalculationEvidence {
  return {
    strategyId: term.strategy.id,
    strategyVersion: term.strategy.version,
    mastery: c.mastery,
    attended: c.lectures.filter((l) => l.status === "attended").length,
    lectureCount: c.lectures.length,
    effort: c.assignment.effort,
    timeliness: term.minute <= c.assignment.due ? 10000 : 0,
    score,
  };
}
export function assessmentScore(term: AcademicTerm, c: CourseOffering) {
  const attendance = Math.floor(
    (c.lectures.filter((l) => l.status === "attended").length * 10000) /
      c.lectures.length,
  );
  const strategy = term.strategy;
  return Math.max(
    0,
    Math.min(
      10000,
      Math.floor(
        (c.mastery * strategy.assessmentMasteryWeight +
          attendance * strategy.attendanceWeight +
          (c.assignment.score ?? 0) * strategy.courseworkWeight) /
          10000,
      ) - c.difficulty,
    ),
  );
}
/** Mutates a transaction-local copy only. Controllers and Phaser have no grading logic. */
export function applyAcademicCommand(
  term: AcademicTerm,
  command: AcademicCommand,
) {
  ensure(term.status === "active", "TERM_NOT_ACTIVE");
  ensure(
    command.type !== "START_TERM" && command.termId === term.id,
    "TERM_REVISION_CONFLICT",
  );
  const advance = (minutes: number) => processTime(term, term.minute + minutes);
  if (command.type === "TRAVEL_TO_VENUE") {
    advance(travelMinutes(term, command.venueId));
    term.presenceVenueId = command.venueId;
    return;
  }
  if (command.type === "END_DAY") {
    ensure(term.minute < term.endMinute, "TERM_NOT_READY_FOR_ACTION");
    processTime(
      term,
      Math.min(
        term.endMinute,
        (Math.floor(term.minute / 1440) + 1) * 1440 + 420,
      ),
    );
    return;
  }
  if (command.type === "WAIT_TO_NEXT_EVENT") {
    ensure(term.minute < term.endMinute, "TERM_NOT_READY_FOR_ACTION");
    const upcoming = term.courses
      .flatMap((c) => [
        ...c.lectures.filter((l) => l.status === "scheduled"),
        ...[c.test, c.exam].filter((a) => a.status === "scheduled"),
      ])
      .map((e) => (e.start - 20 > term.minute ? e.start - 20 : e.start))
      .filter((t) => t > term.minute)
      .sort((a, b) => a - b);
    processTime(term, upcoming[0] ?? term.endMinute);
    return;
  }
  if (command.type === "ATTEND_LECTURE") {
    const c = term.courses.find((c) =>
      c.lectures.some((l) => l.id === command.lectureId),
    );
    const l = c?.lectures.find((l) => l.id === command.lectureId);
    ensure(
      c &&
        l &&
        l.status === "scheduled" &&
        term.minute >= l.start &&
        term.minute <= l.start + 15 &&
        term.presenceVenueId === l.venueId,
      "LECTURE_NOT_ELIGIBLE",
    );
    l!.attendedMinute = term.minute;
    l!.status = "attended";
    c!.mastery = Math.min(10000, c!.mastery + term.strategy.lectureGain);
    processTime(term, l!.start + l!.duration);
    return;
  }
  if (command.type === "COMPLETE_TERM" || command.type === "START_TERM")
    throw new AcademicError("INVALID_TERM_COMMAND");
  const c = term.courses.find((c) => c.id === command.courseId);
  ensure(c, "COURSE_NOT_ENROLLED");
  const course = c!;
  if (command.type === "STUDY" || command.type === "WORK_ON_ASSIGNMENT") {
    ensure(
      term.studyVenueIds.includes(term.presenceVenueId),
      "STUDY_VENUE_REQUIRED",
    );
    if (command.type === "STUDY") {
      advance(command.minutes);
      course.mastery = Math.min(
        10000,
        course.mastery +
          Math.max(
            1,
            Math.floor(
              (command.minutes *
                term.strategy.studyGainPerMinute *
                (10000 - course.mastery)) /
                10000,
            ),
          ),
      );
    } else {
      ensure(
        term.minute >= course.assignment.release &&
          term.minute + command.minutes <= course.assignment.due &&
          ["scheduled", "in_progress"].includes(course.assignment.status),
        "ASSIGNMENT_NOT_ELIGIBLE",
      );
      ensure(
        course.assignment.effort < course.requiredEffort,
        "ASSIGNMENT_EFFORT_COMPLETE",
      );
      const creditedMinutes = Math.min(
        command.minutes,
        course.requiredEffort - course.assignment.effort,
      );
      advance(command.minutes);
      course.assignment.effort = Math.min(
        course.requiredEffort,
        course.assignment.effort + command.minutes,
      );
      course.assignment.status = "in_progress";
      course.mastery = Math.min(
        10000,
        course.mastery + creditedMinutes * term.strategy.workGainPerMinute,
      );
    }
    return;
  }
  if (command.type === "SUBMIT_ASSIGNMENT") {
    const a = course.assignment;
    ensure(
      term.minute >= a.release &&
        term.minute <= a.due &&
        a.status === "in_progress" &&
        a.effort > 0,
      "ASSIGNMENT_NOT_ELIGIBLE",
    );
    a.score = Math.floor(
      (course.mastery * term.strategy.assignmentMasteryWeight +
        Math.floor((a.effort * 10000) / course.requiredEffort) *
          term.strategy.effortWeight) /
        10000,
    );
    a.evidence = evidence(term, course, a.score);
    a.status = "submitted";
    return;
  }
  const a = command.type === "TAKE_TEST" ? course.test : course.exam;
  ensure(
    a.status === "scheduled" &&
      term.minute >= a.start &&
      term.minute <= a.start + 15 &&
      term.presenceVenueId === a.venueId,
    "ASSESSMENT_NOT_ELIGIBLE",
  );
  a.score = assessmentScore(term, course);
  a.evidence = evidence(term, course, a.score);
  a.status = "taken";
  processTime(term, a.start + a.duration);
}
export function completeResults(
  term: AcademicTerm,
  history: AcademicHistory[],
) {
  ensure(
    term.status === "active" && term.minute === term.endMinute,
    "TERM_NOT_READY",
  );
  for (const c of term.courses) {
    const score = weightedScore(
        {
          assignment: c.assignment.score ?? 0,
          test: c.test.score ?? 0,
          exam: c.exam.score ?? 0,
        },
        c.weights,
      ),
      band = grade(score, term.gradePolicy);
    c.result = {
      courseId: c.id,
      code: c.code,
      units: c.units,
      score,
      grade: band.letter,
      points: band.points,
      passed: score >= term.gradePolicy.passScore,
      policyId: term.gradePolicy.id,
      policyVersion: term.gradePolicy.version,
    };
  }
  term.result = aggregateResults(
    term.courses.map((c) => c.result!),
    history,
  );
  term.status = "completed";
  return term.result;
}
/** Actual valid intents for semantic phone/world UI. Server revalidates each command. */
export function allowedActions(term: AcademicTerm | null): AcademicCommand[] {
  const commandId = "00000000-0000-4000-8000-000000000000";
  const termId = term?.id ?? commandId;
  if (!term) return [{ commandId, type: "START_TERM" }];
  if (term.status !== "active") return [{ commandId, type: "START_TERM" }];
  const candidates: AcademicCommand[] = [
    { commandId, termId, type: "END_DAY" },
    { commandId, termId, type: "WAIT_TO_NEXT_EVENT" },
  ];
  for (const v of term.venues)
    if (v.id !== term.presenceVenueId)
      candidates.push({
        commandId,
        termId,
        type: "TRAVEL_TO_VENUE",
        venueId: v.id,
      });
  for (const c of term.courses) {
    for (const l of c.lectures)
      candidates.push({
        commandId,
        termId,
        type: "ATTEND_LECTURE",
        lectureId: l.id,
      });
    for (const minutes of [30, 60, 120] as const)
      candidates.push({
        commandId,
        termId,
        type: "STUDY",
        courseId: c.id,
        minutes,
      });
    for (const minutes of [30, 60] as const)
      candidates.push({
        commandId,
        termId,
        type: "WORK_ON_ASSIGNMENT",
        courseId: c.id,
        minutes,
      });
    for (const type of ["SUBMIT_ASSIGNMENT", "TAKE_TEST", "TAKE_EXAM"] as const)
      candidates.push({ commandId, termId, type, courseId: c.id });
  }
  const actions = candidates.filter((c) => {
    try {
      applyAcademicCommand(structuredClone(term), c);
      return true;
    } catch {
      return false;
    }
  });
  if (term.minute === term.endMinute)
    return [{ commandId, termId, type: "COMPLETE_TERM" }];
  return actions;
}
export function academicNotifications(term: AcademicTerm | null) {
  if (!term)
    return [
      {
        id: "start",
        message: "Start your private CampusWahala semester in Portal.",
      },
    ];
  if (term.status === "completed")
    return [
      {
        id: "results",
        message:
          "Results ready. Your semester and progression decision are saved.",
      },
      ...(term.courses.some((c) => c.result && !c.result.passed)
        ? [
            {
              id: "carryovers",
              message: "Carryovers recorded. View your private results.",
            },
          ]
        : []),
    ];
  const out: Array<{ id: string; message: string }> = [];
  for (const c of term.courses) {
    if (
      term.minute >= c.assignment.release &&
      term.minute <= c.assignment.due &&
      c.assignment.status !== "submitted"
    )
      out.push({
        id: `assignment-${c.id}`,
        message: `${c.code}: assignment ${c.assignment.due - term.minute <= 1440 ? "deadline near" : "released"}.`,
      });
    for (const [kind, events] of [
      ["Lecture", c.lectures],
      ["Test", [c.test]],
      ["Exam", [c.exam]],
    ] as const)
      for (const e of events)
        if (
          e.status === "scheduled" &&
          e.start >= term.minute &&
          e.start - term.minute <= 1440
        )
          out.push({
            id: `${kind}-${c.id}-${e.start}`,
            message: `${c.code}: ${kind.toLowerCase()} upcoming · ${academicClock(e.start).day} ${academicClock(e.start).clock}.`,
          });
  }
  return out.slice(0, 24);
}

/** Canonical ordered programme references are supplied by the server catalogue. */
export function decideProgression(
  term: AcademicTerm,
  catalogue: {
    stages: Array<{ id: string; order: number; activityTags: string[] }>;
    semesters: Array<{ id: string; stageId: string | null; order: number }>;
  },
): ProgressionDecision {
  ensure(term.status === "completed" && term.result, "RESULT_REQUIRED");
  const stage = catalogue.stages.find((s) => s.id === term.stageId),
    semesters = catalogue.semesters
      .filter((s) => s.stageId === term.stageId)
      .sort((a, b) => a.order - b.order),
    semester = semesters.find((s) => s.id === term.semesterId);
  ensure(stage && semester, "ACADEMIC_POSITION_UNAVAILABLE");
  const failed = term.result!.courses.filter((c) => !c.passed),
    failedUnits = failed.reduce((n, c) => n + c.units, 0);
  const nextSemester = semesters.find((s) => s.order > semester!.order),
    nextStage = catalogue.stages
      .filter((s) => s.order > stage!.order)
      .sort((a, b) => a.order - b.order)[0];
  const repeat =
    failedUnits * 10000 >=
    term.result!.attemptedUnits *
      term.progressionPolicy.repeatFailedUnitsBasisPoints;
  const targetStage = repeat ? stage : nextSemester ? stage : nextStage;
  const targetSemester = repeat
    ? semesters[0]
    : (nextSemester ??
      catalogue.semesters
        .filter((s) => s.stageId === nextStage?.id)
        .sort((a, b) => a.order - b.order)[0]);
  return {
    outcome:
      !targetStage || !targetSemester
        ? "hold"
        : repeat
          ? "repeat_stage"
          : failed.length
            ? "progress_with_carryovers"
            : "progress",
    reason:
      !targetStage || !targetSemester
        ? "Configured programme stages completed; future activity review required."
        : repeat
          ? "Failed-unit threshold reached under CampusWahala simulation rules."
          : failed.length
            ? "Continue with outstanding simulation courses."
            : "Simulation term passed.",
    nextStageId: targetStage?.id ?? term.stageId,
    nextSemesterId: targetSemester?.id ?? term.semesterId,
    activityTags: targetStage?.activityTags ?? stage!.activityTags,
    policyId: term.progressionPolicy.id,
    policyVersion: term.progressionPolicy.version,
  };
}
