"use client";
import {
  academicClock,
  type AcademicCommand,
  type AcademicView,
  type CourseOffering,
} from "@campuswahala/domain";
export const actionLabel = (
  command: AcademicCommand,
  state: AcademicView,
): string => {
  const c =
    "courseId" in command
      ? state.term?.courses.find((c) => c.id === command.courseId)
      : null;
  switch (command.type) {
    case "START_TERM":
      return state.term
        ? "Begin next simulation semester"
        : "Start simulation semester";
    case "TRAVEL_TO_VENUE":
      return `Travel to ${state.term?.venues.find((v) => v.id === command.venueId)?.name ?? command.venueId}`;
    case "ATTEND_LECTURE":
      return `Attend ${state.term?.courses.find((c) => c.lectures.some((l) => l.id === command.lectureId))?.code} lecture`;
    case "STUDY":
      return `Study ${c?.code} · ${command.minutes} min`;
    case "WORK_ON_ASSIGNMENT":
      return `Work on ${c?.code} assignment · ${command.minutes} min`;
    case "SUBMIT_ASSIGNMENT":
      return `Submit ${c?.code} assignment`;
    case "TAKE_TEST":
      return `Take ${c?.code} test`;
    case "TAKE_EXAM":
      return `Write ${c?.code} examination`;
    case "WAIT_TO_NEXT_EVENT":
      return "Wait to next academic event";
    case "END_DAY":
      return "End academic day (unattended events are missed)";
    case "COMPLETE_TERM":
      return "Complete semester and receive results";
  }
};
const decimal = (n: number) => (n / 1000).toFixed(3);
export function AcademicPanel({
  state,
  mode,
  busy,
  online,
  error,
  retry,
  onCommand,
  onRefresh,
  venueId,
}: {
  state: AcademicView | null;
  mode: "portal" | "schedule" | "venue";
  busy: boolean;
  online: boolean;
  error: string;
  retry: boolean;
  onCommand: (c: AcademicCommand) => void;
  onRefresh: () => void;
  venueId?: string;
}) {
  if (!state)
    return (
      <section className="academic-panel">
        <p role="status">{error || "Opening your private simulation…"}</p>
        <button onClick={onRefresh} disabled={!online || busy}>
          Retry academic connection
        </button>
      </section>
    );
  const term = state.term;
  const buttons = (commands: AcademicCommand[]) =>
    commands.map((c) => (
      <button
        key={JSON.stringify(c)}
        disabled={busy || !online || retry}
        onClick={() => onCommand(c)}
      >
        {actionLabel(c, state)}
      </button>
    ));
  const courseActions = (course: CourseOffering) =>
    state.allowedActions.filter(
      (c) =>
        ("courseId" in c && c.courseId === course.id) ||
        (c.type === "ATTEND_LECTURE" &&
          course.lectures.some((l) => l.id === c.lectureId)),
    );
  const time = (minute: number) => {
    const t = academicClock(minute);
    return `Week ${t.week} · ${t.day} ${t.clock}`;
  };
  return (
    <section
      className="academic-panel"
      aria-label="Private academic simulation"
    >
      <p className="fixture">
        CampusWahala simulation {mode === "schedule" ? "schedule" : "courses"} ·
        Private game data · Not official curriculum or a real credential.
      </p>
      {!online && (
        <p role="alert">
          Reconnect to attend, study, submit or advance academic time. No
          actions are queued offline.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {retry && (
        <p>
          Use Retry pending academic command to check the same receipt before
          choosing another action.
        </p>
      )}
      {mode !== "venue" && (
        <>
          <h3>{state.position.programme}</h3>
          <p>
            {state.position.stage} · {state.position.semester} ·{" "}
            {state.position.entryMode.replaceAll("_", " ")}
          </p>
        </>
      )}
      {!term ? (
        <>
          <p>
            Your accelerated four-week semester is ready. Courses and policies
            are snapshotted when you begin.
          </p>
          {buttons(state.allowedActions)}
        </>
      ) : (
        <>
          <p>
            <b>{term.label}</b>
            <br />
            {term.campusId.toUpperCase()} simulation · {time(term.minute)} ·{" "}
            {term.status}
            <br />
            Academic presence:{" "}
            {term.venues.find((v) => v.id === term.presenceVenueId)?.name}
          </p>
          {mode === "venue" && venueId !== term.presenceVenueId && (
            <p>
              Walking on the map is cosmetic. Confirm server travel to use
              academic activities here.
            </p>
          )}
          {mode !== "venue" && (
            <div className="academic-time-actions">
              {buttons(
                state.allowedActions.filter((c) =>
                  [
                    "START_TERM",
                    "WAIT_TO_NEXT_EVENT",
                    "END_DAY",
                    "COMPLETE_TERM",
                  ].includes(c.type),
                ),
              )}
            </div>
          )}
          {mode !== "venue" && state.carryovers.length > 0 && (
            <p>
              Outstanding simulation courses:{" "}
              {state.carryovers.map((c) => c.code).join(", ")}
            </p>
          )}
          {mode !== "venue" && term.result && (
            <>
              <h3>Private simulation results</h3>
              <p>
                GPA {decimal(term.result.gpaScaled)} · CGPA{" "}
                {decimal(term.result.cgpaScaled)}
              </p>
              <p>
                {term.progression?.outcome.replaceAll("_", " ")} ·{" "}
                {term.progression?.reason}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Units</th>
                    <th>Score</th>
                    <th>Grade</th>
                    <th>Points</th>
                  </tr>
                </thead>
                <tbody>
                  {term.result.courses.map((c) => (
                    <tr key={c.courseId}>
                      <td>{c.code}</td>
                      <td>{c.units}</td>
                      <td>{(c.score / 100).toFixed(2)}%</td>
                      <td>
                        {c.grade}
                        {!c.passed ? " · carryover" : ""}
                      </td>
                      <td>{decimal(c.points)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {mode === "schedule" ? (
            <div className="academic-timetable">
              {term.courses
                .flatMap((c) => [
                  ...c.lectures.map((l) => ({
                    ...l,
                    kind: "Lecture",
                    course: c,
                  })),
                  { ...c.test, kind: "Test", course: c },
                  { ...c.exam, kind: "Exam", course: c },
                ])
                .sort((a, b) => a.start - b.start)
                .map((e) => (
                  <article key={`${e.course.id}-${e.kind}-${e.start}`}>
                    <b>
                      {e.course.code} · {e.kind}
                    </b>
                    <p>
                      {time(e.start)} · {e.duration} min · {e.status}
                    </p>
                    <small>
                      {term.venues.find((v) => v.id === e.venueId)?.name}
                    </small>
                    {e.status === "scheduled" &&
                      buttons(
                        state.allowedActions.filter(
                          (c) =>
                            (c.type === "TRAVEL_TO_VENUE" &&
                              c.venueId === e.venueId) ||
                            (c.type === "ATTEND_LECTURE" &&
                              "id" in e &&
                              c.lectureId === e.id) ||
                            ("courseId" in c &&
                              c.courseId === e.course.id &&
                              ((c.type === "TAKE_TEST" && e.kind === "Test") ||
                                (c.type === "TAKE_EXAM" && e.kind === "Exam"))),
                        ),
                      )}
                  </article>
                ))}
            </div>
          ) : (
            <>
              {mode === "venue" &&
                buttons(
                  state.allowedActions.filter(
                    (c) =>
                      c.type === "TRAVEL_TO_VENUE" && c.venueId === venueId,
                  ),
                )}
              {(mode !== "venue" || venueId === term.presenceVenueId) &&
                term.courses.map((course) => (
                  <details className="academic-course" key={course.id}>
                    <summary>
                      {course.code} · {course.title} · {course.units} units
                      {course.carryover ? " · Carryover" : ""}
                    </summary>
                    <p>
                      Simulation template v{course.version} · Mastery{" "}
                      {(course.mastery / 100).toFixed(0)}% · Lectures{" "}
                      {
                        course.lectures.filter((l) => l.status === "attended")
                          .length
                      }
                      /{course.lectures.length}
                    </p>
                    <p>
                      Assignment {course.assignment.status}:{" "}
                      {course.assignment.effort}/{course.requiredEffort} min
                      <br />
                      Due {time(course.assignment.due)}
                    </p>
                    <p>
                      Test: {course.test.status} · Exam: {course.exam.status} ·
                      Result:{" "}
                      {course.result
                        ? `${course.result.grade} ${(course.result.score / 100).toFixed(2)}%`
                        : "not finalized"}
                    </p>
                    {buttons(courseActions(course))}
                  </details>
                ))}
              {mode === "portal" && term.status === "active" && (
                <details>
                  <summary>Academic travel destinations</summary>
                  <p>
                    Server travel consumes game time. Waypoints and visual
                    position grant no academic credit.
                  </p>
                  {buttons(
                    state.allowedActions.filter(
                      (c) => c.type === "TRAVEL_TO_VENUE",
                    ),
                  )}
                </details>
              )}
            </>
          )}
        </>
      )}
      {mode === "portal" && state.history.length > 0 && (
        <details>
          <summary>Semester history ({state.history.length})</summary>
          {state.history.map((h) => (
            <article key={h.termId}>
              <b>{h.label}</b>
              <p>
                GPA {decimal(h.result.gpaScaled)} · CGPA{" "}
                {decimal(h.result.cgpaScaled)} ·{" "}
                {h.progression.outcome.replaceAll("_", " ")}
              </p>
            </article>
          ))}
        </details>
      )}
    </section>
  );
}
