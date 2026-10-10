import { test, expect, type APIResponse } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../../packages/database/src";
import { validGuestFixture } from "../../packages/testing/src";
import type { AcademicView, LifeView } from "../../packages/domain/src";
const origin = "http://localhost:3001";
test("campus daily routine uses real venue authority, life choices, shared academic clock, explicit lost-response retry and offline refusal", async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  test.skip(!process.env.TEST_DATABASE_URL, "Disposable PostgreSQL required");
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
  const request = async (send: () => Promise<APIResponse>) => {
    let r = await send();
    if (r.status() === 429)
      await expect
        .poll(
          async () => {
            r = await send();
            return r.status();
          },
          { timeout: 75000, intervals: [1000, 2000] },
        )
        .not.toBe(429);
    expect(r.headers()["cache-control"]).toContain("no-store");
    return r;
  };
  const academics = async (): Promise<AcademicView> => {
    const r = await request(() =>
      context.request.get(`${origin}/api/academic/state`),
    );
    expect(r.ok()).toBe(true);
    return r.json();
  };
  const life = async (): Promise<LifeView> => {
    const r = await request(() =>
      context.request.get(`${origin}/api/life/state`),
    );
    expect(r.ok()).toBe(true);
    return r.json();
  };
  const academic = async (intent: Record<string, unknown>) => {
    const state = await academics(),
      data = { ...intent, commandId: randomUUID(), termId: state.term!.id };
    const r = await request(() =>
      context.request.post(`${origin}/api/academic/commands`, {
        headers: { Origin: origin },
        data,
      }),
    );
    expect(r.ok()).toBe(true);
    return (await r.json()).state as AcademicView;
  };
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
  await page
    .getByRole("button", { name: "Account & privacy", exact: true })
    .click();
  await page.getByRole("button", { name: "Continue to sign in" }).click();
  await page.waitForURL((u) => u.searchParams.get("saved") === "1");
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  await page
    .getByRole("button", { name: "Start simulation semester", exact: true })
    .click();
  await expect(
    page.getByText("Academic presence:", { exact: false }),
  ).toBeVisible();
  let av = await academics(),
    lv = await life();
  expect(lv.state!.lastProcessedMinute).toBe(av.term!.minute);
  expect(lv.state!.homeVenueId).toBe(av.term!.presenceVenueId);
  const food = av.term!.venues.find((v) => v.type === "food")!;
  await page.getByRole("button", { name: "← All apps", exact: true }).click();
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  await page
    .locator(".destination-list button")
    .filter({ hasText: food.name })
    .click();
  await page.getByRole("button", { name: "Walk there", exact: true }).click();
  await page
    .getByRole("button", { name: `Enter ${food.name}`, exact: true })
    .click({ timeout: 45000 });
  const venue = page.getByRole("dialog", { name: food.name, exact: true });
  await expect(
    venue.getByRole("button", {
      name: "Rice & stew · proper meal · 30 min",
      exact: true,
    }),
  ).toHaveCount(0);
  expect((await life()).state!.metrics).toEqual(lv.state!.metrics);
  expect((await academics()).term!.presenceVenueId).not.toBe(food.id);
  const denied = await request(() =>
    context.request.post(`${origin}/api/life/commands`, {
      headers: { Origin: origin },
      data: {
        type: "EAT",
        optionId: "proper-meal",
        commandId: randomUUID(),
        termId: av.term!.id,
      },
    }),
  );
  expect(denied.status()).toBe(409);
  await venue
    .getByRole("button", { name: `Travel to ${food.name}`, exact: true })
    .click();
  await expect(
    venue.getByRole("button", {
      name: "Rice & stew · proper meal · 30 min",
      exact: true,
    }),
  ).toBeVisible();
  const beforeEat = await life(),
    beforeMinute = (await academics()).term!.minute;
  await venue
    .getByRole("button", {
      name: "Rice & stew · proper meal · 30 min",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => (await life()).state!.revision)
    .toBe(beforeEat.state!.revision + 1);
  lv = await life();
  av = await academics();
  expect(av.term!.minute).toBe(beforeMinute + 30);
  expect(lv.state!.lastProcessedMinute).toBe(av.term!.minute);
  expect(lv.state!.metrics.satiety).toBeGreaterThan(
    beforeEat.state!.metrics.satiety,
  );
  await page
    .getByRole("button", { name: "Back to campus", exact: true })
    .click();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Campus life", exact: true }).click();
  await expect(
    page.getByRole("meter", { name: "energy", exact: true }),
  ).toBeVisible();
  if (lv.pending) {
    await expect(
      page.getByText(lv.pending.template.title, { exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Leave it for now · 0 min", exact: true })
      .click();
    await expect
      .poll(
        async () =>
          (await life()).recent.find((h) => h.id === lv.pending!.id)?.status,
      )
      .toBe("dismissed");
  }
  // Commit a meal but lose only its response; explicit retry keeps the same key.
  const committedBefore = await life();
  const keys: string[] = [];
  await page.route("**/api/life/commands", async (route) => {
    keys.push(route.request().postDataJSON().commandId);
    if (keys.length === 1) {
      const response = await route.fetch();
      expect(response.ok()).toBe(true);
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", {
      name: "Bread & egg · quick bite · 15 min",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retry pending life command",
      exact: true,
    }),
  ).toBeVisible();
  const committed = await life();
  expect(committed.state!.revision).toBe(committedBefore.state!.revision + 1);
  await page
    .getByRole("button", { name: "Retry pending life command", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retry pending life command",
      exact: true,
    }),
  ).toHaveCount(0);
  expect(keys).toHaveLength(2);
  expect(keys[1]).toBe(keys[0]);
  expect((await life()).state!.revision).toBe(committed.state!.revision);
  await page.unroute("**/api/life/commands");
  // Academic study processes the same life interval; travel home and sleep misses class.
  const studyVenue = (await academics()).term!.venues.find(
    (v) => v.type === "library",
  )!;
  await academic({ type: "TRAVEL_TO_VENUE", venueId: studyVenue.id });
  av = await academics();
  const studyBefore = await life();
  await academic({
    type: "STUDY",
    courseId: av.term!.courses[0]!.id,
    minutes: 60,
  });
  expect((await life()).state!.metrics.energy).toBeLessThan(
    studyBefore.state!.metrics.energy,
  );
  await academic({ type: "TRAVEL_TO_VENUE", venueId: lv.state!.homeVenueId });
  await page.reload();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Campus life", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Sleep · 6 hours", exact: true }),
  ).toBeVisible();
  const restMinute = (await academics()).term!.minute;
  await page
    .getByRole("button", { name: "Rest · 30 min", exact: true })
    .click();
  await expect
    .poll(async () => (await academics()).term!.minute)
    .toBe(restMinute + 30);
  await page
    .getByRole("button", {
      name: "Spend time in the common area · 30 min",
      exact: true,
    })
    .click();
  await expect
    .poll(async () => (await academics()).term!.minute)
    .toBe(restMinute + 60);
  const sleepMinute = (await academics()).term!.minute;
  await page
    .getByRole("button", { name: "Sleep · 6 hours", exact: true })
    .click();
  await expect
    .poll(async () => (await academics()).term!.minute)
    .toBe(sleepMinute + 360);
  av = await academics();
  expect(
    av.term!.courses.some((c) => c.lectures.some((l) => l.status === "missed")),
  ).toBe(true);
  expect((await life()).state!.lastProcessedMinute).toBe(av.term!.minute);
  await context.setOffline(true);
  await expect(
    page.getByRole("button", { name: "Sleep · 6 hours", exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByText("Reconnect before life actions.", { exact: false }),
  ).toBeVisible();
  await context.setOffline(false);
  await expect(
    page.getByRole("button", { name: "Sleep · 6 hours", exact: true }),
  ).toBeEnabled();
  const cached = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const key of await caches.keys())
      for (const r of await (await caches.open(key)).keys()) urls.push(r.url);
    return urls;
  });
  expect(
    cached.some(
      (u) => u.includes("/api/life/") || u.includes("/api/academic/"),
    ),
  ).toBe(false);
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/campus-life-${test.info().project.name}.png`,
    });
});
