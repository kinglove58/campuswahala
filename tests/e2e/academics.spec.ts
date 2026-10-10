import { test, expect } from "@playwright/test";
import { PrismaClient } from "../../packages/database/src";
import { validGuestFixture } from "../../packages/testing/src";
import type { AcademicView } from "../../packages/domain/src";
import { randomUUID } from "node:crypto";

test("guest tutorial is explicitly ephemeral and does not write academic state", async ({
  page,
  context,
}) => {
  await context.request.post("http://localhost:3001/api/guest", {
    headers: { Origin: "http://localhost:3001" },
    data: { ...validGuestFixture, level: 100 },
  });
  await page.goto("http://localhost:3001");
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  await page.getByRole("button", { name: "Try academic tutorial" }).click();
  for (const name of [
    "Demo: study for 60 minutes",
    "Demo: travel to lecture hall",
    "Demo: wait near lecture",
    "Demo: wait until lecture starts",
    "Demo: attend lecture",
  ])
    await page.getByRole("button", { name, exact: true }).click();
  await expect(
    page.getByText("Tutorial complete.", { exact: false }),
  ).toBeVisible();
  expect(
    (
      await context.request.get("http://localhost:3001/api/academic/state")
    ).status(),
  ).toBe(401);
  await page.reload();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Try academic tutorial" }),
  ).toBeVisible();
});

test("private academic semester, phone schedule, offline refusal, retry receipt, results and account resume", async ({
  page,
  context,
}) => {
  test.skip(!process.env.TEST_DATABASE_URL, "Requires disposable PostgreSQL.");
  test.setTimeout(180000);
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
  await context.request.post("http://localhost:3001/api/guest", {
    headers: { Origin: "http://localhost:3001" },
    data: { ...validGuestFixture, level: 100 },
  });
  await page.goto("http://localhost:3001");
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
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  await page
    .getByRole("button", { name: "Start simulation semester", exact: true })
    .click();
  await expect(
    page.getByText("Academic presence:", { exact: false }),
  ).toBeVisible();
  expect(
    (
      await context.request.get("http://localhost:3001/api/academic/state")
    ).headers()["cache-control"],
  ).toContain("no-store");
  await page
    .getByText("CW-CMP-101 · Computational Thinking · 3 units", { exact: true })
    .click();
  await page
    .getByRole("button", { name: "Study CW-CMP-101 · 60 min", exact: true })
    .click();
  await expect(page.getByText("Mastery 12%", { exact: false })).toBeVisible();
  await context.setOffline(true);
  await expect(
    page.getByText("Reconnect to attend, study", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Study CW-CMP-101 · 60 min",
      exact: true,
    }),
  ).toBeDisabled();
  await context.setOffline(false);
  await expect(
    page.getByRole("button", {
      name: "Study CW-CMP-101 · 60 min",
      exact: true,
    }),
  ).toBeEnabled();
  // Lose the response after the API commits; explicit retry must reuse its ID.
  let lost = false;
  await page.route("**/api/academic/commands", async (route) => {
    if (!lost) {
      lost = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await page
    .getByRole("button", { name: "Study CW-CMP-101 · 60 min", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retry pending academic command",
      exact: true,
    }),
  ).toBeVisible();
  const beforeRetry: AcademicView = await (
    await context.request.get("http://localhost:3001/api/academic/state")
  ).json();
  await page
    .getByRole("button", {
      name: "Retry pending academic command",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Retry pending academic command",
      exact: true,
    }),
  ).toHaveCount(0);
  const afterRetry: AcademicView = await (
    await context.request.get("http://localhost:3001/api/academic/state")
  ).json();
  expect(afterRetry.revision).toBe(beforeRetry.revision);
  await page.unroute("**/api/academic/commands");
  await page.getByRole("button", { name: "← All apps", exact: true }).click();
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  await expect(
    page.getByText("CampusWahala simulation schedule", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByText("CW-CMP-101 · Lecture", { exact: true }).first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Open virtual phone" }),
  ).toBeFocused();
  await page.reload();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  await expect(
    page.getByText("Academic presence:", { exact: false }),
  ).toBeVisible();
  // Complete a deliberately neglected semester. Functional UI assertions use
  // server commands rather than introducing a client/test clock shortcut.
  let state: AcademicView = afterRetry;
  for (let i = 0; i < 29 && state.term!.minute < state.term!.endMinute; i++) {
    const response = await context.request.post(
      "http://localhost:3001/api/academic/commands",
      {
        headers: { Origin: "http://localhost:3001" },
        data: {
          commandId: randomUUID(),
          termId: state.term!.id,
          type: "END_DAY",
        },
      },
    );
    expect(response.ok(), await response.text()).toBe(true);
    state = (await response.json()).state;
  }
  const completed = await context.request.post(
    "http://localhost:3001/api/academic/commands",
    {
      headers: { Origin: "http://localhost:3001" },
      data: {
        commandId: randomUUID(),
        termId: state.term!.id,
        type: "COMPLETE_TERM",
      },
    },
  );
  expect(completed.ok(), await completed.text()).toBe(true);
  await page.reload();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Private simulation results" }),
  ).toBeVisible();
  await expect(
    page.getByText("GPA 0.000 · CGPA 0.000", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "repeat stage · Failed-unit threshold reached under CampusWahala simulation rules.",
      { exact: true },
    ),
  ).toBeVisible();
  if (process.env.CAPTURE_VISUALS) {
    await page.screenshot({
      path: `artifacts/academic-results-${test.info().project.name}.png`,
    });
  }
  const cachePaths = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      urls.push(...(await cache.keys()).map((r) => r.url));
    }
    return urls;
  });
  expect(cachePaths.some((url) => url.includes("/api/academic/"))).toBe(false);
});
