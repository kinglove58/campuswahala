import { test, expect, type APIResponse } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { PrismaClient } from "../../packages/database/src";
import { validGuestFixture } from "../../packages/testing/src";
import type { AcademicView, LifeView } from "../../packages/domain/src";
const origin = "http://localhost:3001";
test("non-neutral food queue choice advances shared time once and survives retry and resume", async ({
  page,
  context,
}) => {
  test.setTimeout(300000);
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

  const started = await academics();
  const food = started.term!.venues.find((v) => v.type === "food")!;
  const traveled = await academic({
    type: "TRAVEL_TO_VENUE",
    venueId: food.id,
  });
  const before = await life();
  const occurrence = before.pending!;
  // Ordinary early travel produces food-queue as the sole eligible event.
  // No DB academic/life state, template selection or RNG is injected.
  expect(occurrence.template.id).toBe("cw-food-queue");
  expect(occurrence.context.eligibleIds).toEqual(["cw-food-queue"]);
  const choice = occurrence.template.choices.find((c) => c.id === "take-time")!;
  expect(choice.minutes).toBe(45);
  await page.getByRole("button", { name: "← All apps", exact: true }).click();
  await page.getByRole("button", { name: "Campus life", exact: true }).click();
  await page
    .getByRole("button", { name: "Refresh campus life", exact: true })
    .click();
  await expect(page.getByTestId("life-current-venue")).toHaveText(
    `Current: ${food.name}`,
    { timeout: 80000 },
  );
  await expect(page.getByTestId("life-next-event")).toContainText("lecture");
  await expect(page.getByTestId("life-next-event")).toContainText(
    "Week 1, Monday",
  );
  await expect(page.getByTestId("life-suggestion")).toHaveCount(1);
  await expect(
    page.getByText(occurrence.template.title, { exact: true }),
  ).toBeVisible();
  const label = `${choice.label} · ${choice.minutes} min`;
  await expect(
    page.getByRole("button", { name: label, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Leave it for now · 0 min", exact: true }),
  ).toBeVisible();
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/wahala-pending-options-${test.info().project.name}.png`,
    });
  await page.locator(".wahala-story").scrollIntoViewIfNeeded();
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/wahala-pending-situation-${test.info().project.name}.png`,
    });
  await page
    .getByRole("button", { name: label, exact: true })
    .scrollIntoViewIfNeeded();
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/wahala-choice-options-${test.info().project.name}.png`,
    });
  const keys: string[] = [];
  let committedReceipt: unknown;
  let lost = false;
  await page.route("**/api/life/commands", async (route) => {
    const command = route.request().postDataJSON();
    expect(command.type).toBe("RESOLVE_WAHALA");
    expect(command.occurrenceId).toBe(occurrence.id);
    expect(command.choiceId).toBe(choice.id);
    keys.push(command.commandId);
    if (!lost) {
      // A reused transport socket can reset before an HTTP response (CI trace:
      // socket hang up). Retry only Playwright's ECONNRESET case, at most twice,
      // with this exact intercepted request/body and commandId. HTTP errors and
      // quotas still reach the assertions below; only a confirmed committed
      // receipt may trigger the deliberate response loss.
      const response = await route.fetch({ maxRetries: 2 });
      if (response.status() === 429) {
        await route.fulfill({ response });
        return;
      }
      expect(response.ok()).toBe(true);
      committedReceipt = (await response.json()).receipt;
      lost = true;
      await route.abort("failed");
    } else await route.continue();
  });
  await page.getByRole("button", { name: label, exact: true }).click();
  const retryButton = page.getByRole("button", {
    name: "Retry pending life command",
    exact: true,
  });
  await expect(retryButton).toBeVisible();
  if (!lost) {
    await life(); // respect a real quota; explicit same-ID retry only
    await retryButton.click();
    await expect.poll(() => lost).toBe(true);
    await expect(retryButton).toBeEnabled();
  }
  const committed = await life();
  const afterAcademic = await academics();
  const after = committed.state!;
  expect(afterAcademic.term!.minute).toBe(
    traveled.term!.minute + choice.minutes,
  );
  expect(after.revision).toBe(before.state!.revision + 1);
  expect(after.lastProcessedMinute).toBe(afterAcademic.term!.minute);
  expect(after.metrics.satiety).toBeGreaterThan(before.state!.metrics.satiety);
  expect(after.metrics.energy).toBeGreaterThan(before.state!.metrics.energy);
  expect(after.metrics.mood).toBeGreaterThan(before.state!.metrics.mood);
  // Choice has zero wellbeing effect: its decrease proves passive decay ran.
  expect(choice.effects.wellbeing).toBe(0);
  expect(after.metrics.wellbeing).toBeLessThan(before.state!.metrics.wellbeing);
  expect(Object.values(after.metrics).every((n) => n >= 0 && n <= 10000)).toBe(
    true,
  );
  const resolved = committed.recent.find((h) => h.id === occurrence.id)!;
  expect(resolved.status).toBe("resolved");
  expect(resolved.chosenChoiceId).toBe(choice.id);
  expect(resolved.effect).toEqual(choice.effects);
  expect(resolved.resolvedMinute).toBe(afterAcademic.term!.minute);
  expect(committed.pending?.id).not.toBe(occurrence.id);
  let retryResponse;
  for (let attempt = 0; attempt < 3; attempt++) {
    await life();
    const [r] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/life/commands") &&
          r.request().method() === "POST",
      ),
      retryButton.click(),
    ]);
    if (r.status() === 429) continue;
    retryResponse = r;
    break;
  }
  expect(retryResponse?.ok()).toBe(true);
  expect((await retryResponse!.json()).receipt).toEqual(committedReceipt);
  expect(new Set(keys).size).toBe(1);
  await expect(retryButton).toHaveCount(0);
  const retried = await life();
  expect(retried.state).toEqual(committed.state);
  expect((await academics()).term!.minute).toBe(afterAcademic.term!.minute);
  expect(retried.recent.find((h) => h.id === occurrence.id)).toEqual(resolved);
  await page.unroute("**/api/life/commands");
  await page.reload();
  await page
    .getByRole("button", { name: "Open virtual phone" })
    .click({ timeout: 80000 });
  await page.getByRole("button", { name: "Campus life", exact: true }).click();
  await page
    .getByRole("button", { name: "Refresh campus life", exact: true })
    .click();
  await expect(page.getByTestId("life-current-venue")).toHaveText(
    `Current: ${food.name}`,
    { timeout: 80000 },
  );
  await page.getByTestId("life-current-venue").scrollIntoViewIfNeeded();
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/campus-life-today-resolved-${test.info().project.name}.png`,
    });
  await page.getByText("Recent campus stories", { exact: true }).click();
  await page
    .getByText(`${occurrence.template.title} · resolved · ${choice.label}`, {
      exact: true,
    })
    .scrollIntoViewIfNeeded();
  await expect(
    page.getByText(
      `${occurrence.template.title} · resolved · ${choice.label}`,
      { exact: true },
    ),
  ).toBeVisible();
  expect((await life()).recent.find((h) => h.id === occurrence.id)).toEqual(
    resolved,
  );
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/wahala-resolved-today-${test.info().project.name}.png`,
    });
  const evidence = test.info().outputPath("wahala-consequence.json");
  await writeFile(
    evidence,
    JSON.stringify(
      {
        template: occurrence.template.id,
        choice: choice.id,
        minutesBefore: traveled.term!.minute,
        minutesAfter: afterAcademic.term!.minute,
        revisionBefore: before.state!.revision,
        revisionAfter: after.revision,
        metricsBefore: before.state!.metrics,
        metricsAfter: after.metrics,
        effect: resolved.effect,
        status: resolved.status,
        chosenChoice: resolved.chosenChoiceId,
        sameKeyRetry: new Set(keys).size === 1,
      },
      null,
      2,
    ),
  );
  await test.info().attach("wahala-consequence-evidence", {
    contentType: "application/json",
    path: evidence,
  });
});
