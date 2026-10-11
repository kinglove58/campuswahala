import {
  academicClock,
  type AcademicView,
  type LifeView,
} from "@campuswahala/domain";
/** Presentation only: private server snapshots in, short copy out. No effects or clock writes. */
export function campusLifeContext(
  academic: AcademicView | null,
  life: LifeView | null,
) {
  const term = academic?.term;
  if (!academic || !term || term.status !== "active") return null;
  const events = term.courses
    .flatMap((course) => [
      ...course.lectures.map((event) => ({
        ...event,
        code: course.code,
        kind: "lecture",
      })),
      { ...course.test, code: course.code, kind: "test" },
      { ...course.exam, code: course.code, kind: "examination" },
    ])
    .filter(
      (event) => event.status === "scheduled" && event.start >= term.minute,
    )
    .sort(
      (a, b) =>
        a.start - b.start ||
        a.code.localeCompare(b.code) ||
        a.kind.localeCompare(b.kind),
    );
  const next = events[0];
  const clock = next ? academicClock(next.start) : null;
  const state = life?.state;
  const suggestion = life?.pending
    ? "A campus situation is waiting. Explore the choices, or leave it for now."
    : next && next.start - term.minute <= 60
      ? "Your next activity is approaching — consider heading to its venue."
      : state && state.metrics.satiety < state.policy.lowSatiety
        ? "You're getting hungry — consider food before your next activity."
        : state && state.metrics.energy < 3500
          ? "Energy is low — consider a rest at home."
          : "No urgent academic event — you have some free campus time.";
  return {
    venue:
      term.venues.find((v) => v.id === term.presenceVenueId)?.name ??
      "Venue unavailable",
    next:
      next && clock
        ? `${next.code} ${next.kind} · Week ${clock.week}, ${clock.day} ${clock.clock} · ${term.venues.find((v) => v.id === next.venueId)?.name ?? "Venue unavailable"}`
        : "No upcoming scheduled academic event.",
    carryovers: [...new Set(academic.carryovers.map((c) => c.code))].sort(),
    suggestion,
  };
}
