import {
  test,
  expect,
  type BrowserContext,
  type Page,
  type APIResponse,
} from "@playwright/test";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../packages/database/src";
import { validGuestFixture } from "../../packages/testing/src";
import type { AcademicView, CourseOffering } from "../../packages/domain/src";

const origin = "http://localhost:3001";
// This driver only uses the real BFF and browser-context HttpOnly cookies.
// Poll only a genuine 429 until the unchanged production quotas permit work;
// never advance DB time, relax a limiter, inject academic state or queue offline.
class AcademicJourney {
  state!: AcademicView;
  constructor(readonly context: BrowserContext) {}
  async request(send: () => Promise<APIResponse>) {
    let response = await send();
    if (response.status() === 429) {
      await expect
        .poll(
          async () => {
            response = await send();
            return response.status();
          },
          {
            timeout: 75000,
            intervals: [1000, 2000],
            message: "Wait for the real BFF academic rate window",
          },
        )
        .not.toBe(429);
    }
    expect(response.headers()["cache-control"]).toContain("no-store");
    return response;
  }
  async read() {
    const response = await this.request(() =>
      this.context.request.get(`${origin}/api/academic/state`),
    );
    expect(response.ok()).toBe(true);
    this.state = await response.json();
    return this.state;
  }
  async raw(intent: Record<string, unknown>) {
    const command = {
      commandId: randomUUID(),
      termId: this.state.term?.id,
      ...intent,
    };
    if (intent.type === "START_TERM") delete command.termId;
    return this.request(() =>
      this.context.request.post(`${origin}/api/academic/commands`, {
        headers: { Origin: origin },
        data: command,
      }),
    );
  }
  async send(intent: Record<string, unknown>) {
    const response = await this.raw(intent);
    expect(response.ok(), `${intent.type} HTTP ${response.status()}`).toBe(
      true,
    );
    this.state = (await response.json()).state;
    return this.state;
  }
}

async function signIn(page: Page, context: BrowserContext) {
  test.skip(!process.env.TEST_DATABASE_URL, "Requires disposable PostgreSQL.");
  // Only reset the local-development identity fixture. No academic rows, grades,
  // mastery, minutes or snapshots are seeded/edited by these scenarios.
  const db = new PrismaClient({
    datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
  });
  await db.user.deleteMany({
    where: {
      identities: {
        some: { provider: "local-development", subject: "local-explorer" },
      },
    },
  });
  await db.$disconnect();
  expect(
    (
      await context.request.post(`${origin}/api/guest`, {
        headers: { Origin: origin },
        data: { ...validGuestFixture, level: 100 },
      })
    ).ok(),
  ).toBe(true);
  await page.goto(`${origin}/play?campus=futa`);
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Account & privacy" }).click();
  await page.getByRole("button", { name: "Continue to sign in" }).click();
  await page.waitForURL((u) => u.searchParams.get("saved") === "1");
  await expect(
    page.getByRole("button", { name: "Account", exact: true }),
  ).toBeVisible();
  const journey = new AcademicJourney(context);
  await portal(page);
  await page
    .getByRole("button", { name: "Start simulation semester", exact: true })
    .click();
  await expect(
    page.getByText("Academic presence:", { exact: false }),
  ).toBeVisible();
  await journey.read();
  expect(journey.state.term!.courses).toHaveLength(6);
  await expect(
    page.getByText(journey.state.term!.label, { exact: true }),
  ).toBeVisible();
  for (const c of journey.state.term!.courses)
    await expect(
      page.locator("summary").filter({ hasText: c.code }),
    ).toBeVisible();
  return journey;
}
async function portal(page: Page, reload = false) {
  if (reload) await page.reload();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
}
async function prepare(
  journey: AcademicJourney,
  course: CourseOffering,
  race = false,
) {
  for (let i = 0; i < 3; i++)
    await journey.send({ type: "STUDY", courseId: course.id, minutes: 120 });
  for (let i = 0; i < Math.ceil(course.requiredEffort / 60); i++)
    await journey.send({
      type: "WORK_ON_ASSIGNMENT",
      courseId: course.id,
      minutes: 60,
    });
  if (race) {
    const before = journey.state.revision;
    const responses = await Promise.all([
      journey.raw({ type: "SUBMIT_ASSIGNMENT", courseId: course.id }),
      journey.raw({ type: "SUBMIT_ASSIGNMENT", courseId: course.id }),
    ]);
    expect(responses.map((r) => r.status()).sort()).toEqual([200, 409]);
    await journey.read();
    expect(journey.state.revision).toBe(before + 1);
  } else await journey.send({ type: "SUBMIT_ASSIGNMENT", courseId: course.id });
}
async function day(journey: AcademicJourney, target: number) {
  while (Math.floor(journey.state.term!.minute / 1440) < target)
    await journey.send({ type: "END_DAY" });
}
async function assessments(
  journey: AcademicJourney,
  kind: "test" | "exam",
  failedId?: string,
  page?: Page,
) {
  const courses = [...journey.state.term!.courses].sort(
    (a, b) => a[kind].start - b[kind].start,
  );
  await day(journey, Math.floor(courses[0]![kind].start / 1440));
  let usedUi = false;
  for (const course of courses) {
    if (course.id === failedId) {
      // The intentionally neglected offering is last in the first-term timetable.
      // Ending that day genuinely misses it; no score/snapshot manipulation.
      expect(course.id).toBe(courses.at(-1)!.id);
      await journey.send({ type: "END_DAY" });
      continue;
    }
    while (journey.state.term!.minute < course[kind].start)
      await journey.send({ type: "WAIT_TO_NEXT_EVENT" });
    if (page && !usedUi) {
      await portal(page, true);
      await page.locator("summary").filter({ hasText: course.code }).click();
      const action = page.getByRole("button", {
        name:
          kind === "test"
            ? `Take ${course.code} test`
            : `Write ${course.code} examination`,
        exact: true,
      });
      // A definite 429 has not executed the action. Retry the real UI only
      // while that response is rate-limited; never retry an uncertain commit.
      let accepted = false;
      await expect
        .poll(
          async () => {
            const [response] = await Promise.all([
              page.waitForResponse(
                (r) =>
                  r.url().endsWith("/api/academic/commands") &&
                  r.request().method() === "POST",
              ),
              action.click(),
            ]);
            expect((await response.allHeaders())["cache-control"]).toContain(
              "no-store",
            );
            accepted = response.ok();
            return response.status();
          },
          {
            timeout: 75000,
            intervals: [1000, 2000],
            message: "Retry the UI assessment only after a definite 429",
          },
        )
        .not.toBe(429);
      expect(accepted).toBe(true);
      await expect(
        page.getByText(`${kind === "test" ? "Test" : "Exam"}: taken`, {
          exact: false,
        }),
      ).toBeVisible();
      await journey.read();
      expect(
        journey.state.term!.courses.find((c) => c.id === course.id)![kind]
          .status,
      ).toBe("taken");
      usedUi = true;
    } else
      await journey.send({
        type: kind === "test" ? "TAKE_TEST" : "TAKE_EXAM",
        courseId: course.id,
      });
  }
}
async function finish(
  journey: AcademicJourney,
  page: Page,
  failedId?: string,
  useAssessmentUi = false,
) {
  const hall = journey.state.term!.venues.find(
    (v) => v.type === "lecture_hall",
  )!;
  await journey.send({ type: "TRAVEL_TO_VENUE", venueId: hall.id });
  await assessments(
    journey,
    "test",
    failedId,
    useAssessmentUi ? page : undefined,
  );
  await assessments(
    journey,
    "exam",
    failedId,
    useAssessmentUi ? page : undefined,
  );
  await journey.send({ type: "WAIT_TO_NEXT_EVENT" });
  expect(journey.state.term!.minute).toBe(journey.state.term!.endMinute);
  await portal(page, true);
  await page
    .getByRole("button", {
      name: "Complete semester and receive results",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Private simulation results" }),
  ).toBeVisible();
  await journey.read();
  expect(journey.state.term!.status).toBe("completed");
  const result = journey.state.term!.result!;
  expect(result.gpaScaled).toBeGreaterThan(0);
  expect(result.cgpaScaled).toBeGreaterThan(0);
  await expect(
    page.getByText(
      `GPA ${(result.gpaScaled / 1000).toFixed(3)} · CGPA ${(result.cgpaScaled / 1000).toFixed(3)}`,
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("CampusWahala simulation courses", { exact: false }),
  ).toBeVisible();
  for (const c of result.courses) {
    const row = page.getByRole("row").filter({ hasText: c.code });
    await expect(row).toBeVisible();
    await expect(
      row.getByRole("cell", {
        name: c.passed ? c.grade : `${c.grade} · carryover`,
        exact: true,
      }),
    ).toBeVisible();
  }
}
async function capture(page: Page, name: string) {
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/${name}-${test.info().project.name}.png`,
    });
}
async function resultCapture(page: Page, name: string) {
  await capture(page, name);
  // Scroll the actual Pocket content to show the result table, rather than
  // changing layout or academic state for screenshots.
  await page.locator(".phone-content").evaluate((el) => {
    const heading = Array.from(el.querySelectorAll("h3")).find(
      (h) => h.textContent === "Private simulation results",
    );
    if (heading)
      el.scrollTop +=
        heading.getBoundingClientRect().top -
        el.getBoundingClientRect().top -
        12;
  });
  await capture(page, `${name}-table`);
}
async function evidence(journey: AcademicJourney, name: string) {
  // Synthetic local-development test results only; no tokens/account identifiers.
  await test.info().attach(name, {
    contentType: "application/json",
    body: JSON.stringify(
      {
        history: journey.state.history.map((h) => ({
          result: h.result,
          progression: h.progression.outcome,
        })),
        carryovers: journey.state.carryovers.map((c) => c.code),
        currentResult: journey.state.term!.result,
      },
      null,
      2,
    ),
  });
}
async function privacy(page: Page, context: BrowserContext) {
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const key of await caches.keys())
      for (const request of await (await caches.open(key)).keys())
        urls.push(request.url);
    return urls;
  });
  expect(cached.some((url) => url.includes("/api/academic/"))).toBe(false);
  for (const url of [
    `${origin}/api/guide?campus=futa`,
    "http://localhost:3100",
    "http://localhost:3100/universities/futa",
  ]) {
    const response = await context.request.get(url);
    expect(response.ok()).toBe(true);
    expect(await response.text()).not.toMatch(
      /gpaScaled|cgpaScaled|presenceVenueId|AcademicCommandReceipt|CW-CMP-101/,
    );
  }
  // No public profile/share feature exists. Ordinary private profile responses
  // also omit grade history; academics have their own private endpoint.
  const profile = await new AcademicJourney(context).request(() =>
    context.request.get(`${origin}/api/account/me`),
  );
  expect(profile.ok()).toBe(true);
  expect(await profile.text()).not.toMatch(
    /gpaScaled|cgpaScaled|qualityPoints/,
  );
}

test("successful semester through CW Pocket and actual lecture venue; visual movement grants no academic presence", async ({
  page,
  context,
}) => {
  test.setTimeout(300000);
  const journey = await signIn(page, context);
  const first = journey.state.term!.courses[0]!;
  await page.getByRole("button", { name: "← All apps", exact: true }).click();
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(
    page.getByText("CampusWahala simulation schedule", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText(`${first.code} · Lecture`, { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Week 1 · Monday 09:00 · 60 min · scheduled", {
      exact: true,
    }),
  ).toBeVisible();
  await journey.send({ type: "WAIT_TO_NEXT_EVENT" });
  await journey.send({ type: "WAIT_TO_NEXT_EVENT" });
  const visualOnly = structuredClone(journey.state);
  const hall = journey.state.term!.venues.find(
    (v) => v.type === "lecture_hall",
  )!;
  await page.reload();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  await page
    .locator(".destination-list button")
    .filter({ hasText: hall.name })
    .click();
  await page.getByRole("button", { name: "Walk there", exact: true }).click();
  await page
    .getByRole("button", { name: `Enter ${hall.name}`, exact: true })
    .click({ timeout: 45000 });
  const venue = page.getByRole("dialog", { name: hall.name, exact: true });
  await expect(
    venue.getByText("Walking on the map is cosmetic.", { exact: false }),
  ).toBeVisible();
  await expect(
    venue.getByRole("button", {
      name: `Attend ${first.code} lecture`,
      exact: true,
    }),
  ).toHaveCount(0);
  await journey.read();
  expect(journey.state.revision).toBe(visualOnly.revision);
  expect(journey.state.term!.minute).toBe(first.lectures[0]!.start);
  expect(journey.state.term!.presenceVenueId).toBe(
    visualOnly.term!.presenceVenueId,
  );
  expect(journey.state.term!.presenceVenueId).not.toBe(hall.id);
  const denied = await journey.raw({
    type: "ATTEND_LECTURE",
    lectureId: first.lectures[0]!.id,
  });
  expect(denied.status()).toBe(409);
  expect((await denied.json()).error.code).toBe("LECTURE_NOT_ELIGIBLE");
  await venue
    .getByRole("button", { name: `Travel to ${hall.name}`, exact: true })
    .click();
  await venue.locator("summary").filter({ hasText: first.code }).click();
  await expect(
    venue.getByRole("button", {
      name: `Attend ${first.code} lecture`,
      exact: true,
    }),
  ).toBeVisible();
  await venue
    .getByRole("button", { name: `Attend ${first.code} lecture`, exact: true })
    .click();
  await expect(venue.getByText("Lectures 1/3", { exact: false })).toBeVisible();
  await journey.read();
  expect(journey.state.term!.presenceVenueId).toBe(hall.id);
  expect(journey.state.term!.courses[0]!.lectures[0]!.status).toBe("attended");
  expect(journey.state.revision).toBe(visualOnly.revision + 2);
  await capture(page, "academic-venue-attended");
  await page
    .getByRole("button", { name: "Back to campus", exact: true })
    .click();
  const library = journey.state.term!.venues.find((v) => v.type === "library")!;
  await journey.send({ type: "TRAVEL_TO_VENUE", venueId: library.id });
  await portal(page, true);
  await page.locator("summary").filter({ hasText: first.code }).click();
  await page
    .getByRole("button", { name: `Study ${first.code} · 120 min`, exact: true })
    .click();
  await expect
    .poll(async () => (await journey.read()).term!.courses[0]!.mastery)
    .toBeGreaterThan(800);
  await journey.read();
  for (let i = 0; i < 2; i++)
    await journey.send({ type: "STUDY", courseId: first.id, minutes: 120 });
  await page
    .getByRole("button", {
      name: `Work on ${first.code} assignment · 60 min`,
      exact: true,
    })
    .click();
  await page
    .getByRole("button", {
      name: `Submit ${first.code} assignment`,
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Assignment submitted:", { exact: false }),
  ).toBeVisible();
  await journey.read();
  expect(journey.state.term!.courses[0]!.assignment.status).toBe("submitted");
  for (const course of journey.state.term!.courses.slice(1))
    await prepare(journey, course);
  await finish(journey, page, undefined, true);
  expect(journey.state.term!.result!.courses.every((c) => c.passed)).toBe(true);
  expect(journey.state.carryovers).toHaveLength(0);
  expect(journey.state.term!.progression!.outcome).toBe("progress");
  await expect(
    page.getByText("progress · Simulation term passed.", { exact: true }),
  ).toBeVisible();
  await resultCapture(page, "academic-success-results");
  await evidence(journey, "successful-semester-evidence");
  await privacy(page, context);
});

test("one genuine carryover retakes once, passes, clears and retains immutable failed history and weighted CGPA", async ({
  page,
  context,
}) => {
  test.setTimeout(420000);
  const journey = await signIn(page, context);
  const failed = journey.state.term!.courses.at(-1)!;
  for (const [i, course] of journey.state.term!.courses.slice(0, -1).entries())
    await prepare(journey, course, i === 0);
  await finish(journey, page, failed.id);
  expect(
    journey.state.term!.result!.courses.filter((c) => !c.passed),
  ).toHaveLength(1);
  expect(journey.state.carryovers.map((c) => c.id)).toEqual([failed.id]);
  const failedResult = journey.state.term!.result!.courses.find(
    (c) => c.courseId === failed.id,
  )!;
  expect(failedResult.score).toBe(0);
  expect(failedResult.grade).toBe("F");
  expect(journey.state.term!.progression!.outcome).toBe(
    "progress_with_carryovers",
  );
  await expect(
    page.getByText(
      "progress with carryovers · Continue with outstanding simulation courses.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText(`Outstanding simulation courses: ${failed.code}`, {
      exact: true,
    }),
  ).toBeVisible();
  await resultCapture(page, "academic-carryover-results");
  const originalHistory = structuredClone(journey.state.history[0]!);
  await page
    .getByRole("button", {
      name: "Begin next simulation semester",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Current GPA: not finalized", { exact: false }),
  ).toBeVisible();
  await journey.read();
  expect(
    journey.state.term!.courses.filter((c) => c.id === failed.id),
  ).toHaveLength(1);
  expect(
    journey.state.term!.courses.find((c) => c.id === failed.id)!.carryover,
  ).toBe(true);
  await expect(
    page
      .locator("summary")
      .filter({ hasText: `${failed.code} · ${failed.title}` }),
  ).toContainText("Carryover");
  await capture(page, "academic-carryover-enrolled");
  await page.getByRole("button", { name: "← All apps", exact: true }).click();
  await page.getByRole("button", { name: "Campus life", exact: true }).click();
  await expect(page.getByTestId("life-carryovers")).toHaveText(
    `Carryover: ${failed.code}`,
  );
  await capture(page, "campus-life-carryover-context");
  await page.getByRole("button", { name: "← All apps", exact: true }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  for (const course of journey.state.term!.courses)
    await prepare(journey, course);
  await finish(journey, page);
  const term = journey.state.term!,
    result = term.result!;
  expect(result.courses.every((c) => c.passed)).toBe(true);
  expect(result.courses.find((c) => c.courseId === failed.id)!.passed).toBe(
    true,
  );
  expect(journey.state.carryovers).toHaveLength(0);
  expect(journey.state.history).toHaveLength(2);
  expect(journey.state.history[0]).toEqual(originalHistory);
  expect(
    journey.state.history[0]!.result.courses.find(
      (c) => c.courseId === failed.id,
    ),
  ).toEqual(failedResult);
  const units = journey.state.history.reduce(
    (n, h) => n + h.result.attemptedUnits,
    0,
  );
  const quality = journey.state.history.reduce(
    (n, h) => n + h.result.qualityPoints,
    0,
  );
  expect(result.cumulativeUnits).toBe(units);
  expect(result.cumulativeQualityPoints).toBe(quality);
  expect(result.cgpaScaled).toBe(
    Math.floor((quality * 2 + units) / (units * 2)),
  );
  expect(term.gradePolicy.retakes).toBe("all_attempts");
  await expect(
    page.getByText("Outstanding simulation courses:", { exact: false }),
  ).toHaveCount(0);
  await page
    .locator("summary")
    .filter({ hasText: "Semester history (2)" })
    .click();
  await expect(
    page.getByText(
      `GPA ${(originalHistory.result.gpaScaled / 1000).toFixed(3)} · CGPA ${(originalHistory.result.cgpaScaled / 1000).toFixed(3)} · progress with carryovers`,
      { exact: true },
    ),
  ).toBeVisible();
  await capture(page, "academic-retake-passed");
  await evidence(journey, "carryover-retake-evidence");
  await privacy(page, context);
});
