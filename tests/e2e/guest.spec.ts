import { test, expect } from "@playwright/test";
import { validGuestFixture } from "../../packages/testing/src";
test("BFF isolates creation buckets and discards browser trust-header spoofing", async ({
  playwright,
}) => {
  const first = await playwright.request.newContext();
  const second = await playwright.request.newContext();
  const headers = {
    Origin: "http://localhost:3001",
    "X-CW-Context": "forged",
    "X-CW-Client": "forged",
    "X-Forwarded-For": "203.0.113.1",
    "X-CW-Edge-Context": "forged",
  };
  try {
    for (let i = 0; i < 10; i++)
      expect(
        (
          await first.post("http://localhost:3001/api/guest", {
            headers,
            data: validGuestFixture,
          })
        ).status(),
      ).toBe(200);
    expect(
      (
        await first.post("http://localhost:3001/api/guest", {
          headers,
          data: validGuestFixture,
        })
      ).status(),
    ).toBe(429);
    expect(
      (
        await second.post("http://localhost:3001/api/guest", {
          headers,
          data: validGuestFixture,
        })
      ).status(),
    ).toBe(200);
    const cookies = (await first.storageState()).cookies;
    expect(cookies.find((c) => c.name === "cw_client")?.httpOnly).toBe(true);
    expect(
      (
        await second.post("http://localhost:3001/api/guest", {
          headers,
          data: { ...validGuestFixture, level: 700, durationYears: 12 },
        })
      ).status(),
    ).toBe(400);
    expect(
      (
        await second.post("http://localhost:3001/api/guest", {
          headers,
          data: { value: "x".repeat(9000) },
        })
      ).status(),
    ).toBe(413);
  } finally {
    await first.dispose();
    await second.dispose();
  }
});
test("landing → guest onboarding → world → phone → resume → revoke", async ({
  page,
  context,
}, testInfo) => {
  // Larger campus walking is real UI work; keep the traversal assertion bounded separately.
  test.setTimeout(120000);
  const scripts: Promise<string>[] = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "script")
      scripts.push(r.text().catch(() => ""));
  });
  await page.goto("http://localhost:3100");
  await expect(
    page.getByRole("heading", { name: /Small campus/ }),
  ).toBeVisible();
  expect((await Promise.all(scripts)).some((s) => s.includes("Phaser"))).toBe(
    false,
  );
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/landing-${testInfo.project.name}.png`,
      fullPage: true,
    });
  await page.getByRole("link", { name: "Start your campus story" }).click();
  await page.getByRole("button", { name: /OAU Obafemi/ }).click();
  await page.getByRole("button", { name: "Continue to academics" }).click();
  await page
    .getByRole("combobox", { name: "Programme", exact: true })
    .selectOption("engineering-demo");
  await page
    .getByRole("combobox", { name: "Duration (years)", exact: true })
    .selectOption("6");
  await page
    .getByRole("combobox", { name: "Current level", exact: true })
    .selectOption("600");
  await page.getByRole("button", { name: "Create your character" }).click();
  await page.getByRole("button", { name: "blue avatar" }).click();
  const result = page.waitForResponse(
    (r) => r.url().endsWith("/api/guest") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Start my chapter" }).click();
  const response = await result;
  expect(response.ok()).toBe(true);
  expect((await response.json()).token).toBeUndefined();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 15000 },
  );
  await expect(page.locator("canvas")).toBeVisible();
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/world-${testInfo.project.name}.png`,
    });
  const cookie = (await context.cookies()).find((c) => c.name === "cw_guest");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  await page
    .getByRole("button", { name: /Lecture hall.*Set waypoint/ })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Lecture hall" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Walk there", exact: true }).click();
  await page
    .getByRole("button", { name: "Enter Lecture hall", exact: true })
    .click({ timeout: 45000 });
  await expect(
    page.getByRole("dialog", { name: "Lecture hall", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to campus", exact: true })
    .click();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await expect(
    page.getByRole("dialog", { name: "CW Pocket virtual phone" }),
  ).toBeVisible();
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/phone-${testInfo.project.name}.png`,
    });
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  await expect(
    page.getByText(/Stylized fixture geometry, not real navigation/),
  ).toBeVisible();
  await page.getByRole("button", { name: "All apps" }).click();
  await page.getByRole("button", { name: "My chapter" }).click();
  await expect(page.getByText("600L", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Close phone" }).click();
  await page.reload();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 15000 },
  );
  await page.getByRole("button", { name: "End guest session" }).click();
  await expect(
    page.getByRole("heading", { name: "Which campus?" }),
  ).toBeVisible();
  expect(
    (await context.cookies()).find((c) => c.name === "cw_guest"),
  ).toBeUndefined();
});
test("onboarding shows an actionable API failure and does not enter world", async ({
  page,
}) => {
  await page.goto("http://localhost:3001");
  await page.getByRole("button", { name: "Continue to academics" }).click();
  await page.getByRole("button", { name: "Create your character" }).click();
  await page.route("**/api/guest", (r) =>
    r.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":{"code":"API_UNAVAILABLE"}}',
    }),
  );
  await page.getByRole("button", { name: "Start my chapter" }).click();
  await expect(
    page.getByRole("alert").filter({ hasText: "Could not enter campus" }),
  ).toBeVisible();
  await expect(page.getByTestId("campus-world")).toHaveCount(0);
});
test("private shell is noindex and cross-origin guest mutation is rejected", async ({
  request,
}) => {
  const game = await request.get("http://localhost:3001");
  expect(await game.text()).toContain("noindex");
  const r = await request.post("http://localhost:3001/api/guest", {
    headers: { Origin: "https://evil.test" },
    data: {},
  });
  expect(r.status()).toBe(403);
});
