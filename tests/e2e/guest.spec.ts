import { test, expect } from "@playwright/test";
test("landing → guest onboarding → world → phone → resume → revoke", async ({
  page,
  context,
}, testInfo) => {
  const scripts: Promise<string>[] = [];
  page.on("response", (r) => {
    if (r.request().resourceType() === "script")
      scripts.push(r.text().catch(() => ""));
  });
  await page.goto("http://localhost:3000");
  await expect(
    page.getByRole("heading", { name: /Small campus/ }),
  ).toBeVisible();
  expect((await Promise.all(scripts)).some((s) => s.includes("Phaser"))).toBe(
    false,
  );
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
  );
  await expect(page.locator("canvas")).toBeVisible();
  await page.screenshot({
    path: `artifacts/world-${testInfo.project.name}.png`,
  });
  const cookie = (await context.cookies()).find((c) => c.name === "cw_guest");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.sameSite).toBe("Strict");
  const canvasBox = await page.locator("canvas").boundingBox();
  if (!canvasBox) throw new Error("Campus canvas has no layout");
  await page.locator("canvas").click({
    position: {
      x: (canvasBox.width * 700) / 960,
      y: (canvasBox.height * 240) / 640,
    },
  });
  await page.getByRole("button", { name: "Explore Lecture hall" }).click();
  await expect(
    page.getByRole("dialog", { name: "Lecture hall", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to campus" }).click();
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await expect(
    page.getByRole("dialog", { name: "CW Pocket virtual phone" }),
  ).toBeVisible();
  await page.screenshot({
    path: `artifacts/phone-${testInfo.project.name}.png`,
  });
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  await expect(
    page.getByText("Stylized fixture geometry, not real navigation."),
  ).toBeVisible();
  await page.getByRole("button", { name: "All apps" }).click();
  await page.getByRole("button", { name: "My chapter" }).click();
  await expect(page.getByText("600L", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Close phone" }).click();
  await page.reload();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
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
