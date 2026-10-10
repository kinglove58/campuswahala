import { test, expect } from "@playwright/test";
import { validGuestFixture } from "../../packages/testing/src";
test("world phone controls, focus, waypoint, weather, guide and guest state isolation", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("http://localhost:3001/play?campus=futa");
  await page.getByRole("button", { name: "Continue to academics" }).click();
  await page.getByRole("button", { name: "Create your character" }).click();
  await page
    .getByRole("combobox", { name: "Skin", exact: true })
    .selectOption("deep");
  await page.getByRole("button", { name: "Start my chapter" }).click();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 20000 },
  );
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  const phone = page.getByRole("dialog", { name: "CW Pocket virtual phone" });
  await expect(phone).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close phone", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Account & privacy", exact: true }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Close phone", exact: true }),
  ).toBeFocused();
  if (process.env.CAPTURE_VISUALS === "1") {
    await page.screenshot({
      path: `artifacts/pocket-${test.info().project.name}.png`,
    });
  }
  const box = await phone.boundingBox();
  expect(box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
  expect(box!.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  await page.getByRole("button", { name: "Portal", exact: true }).click();
  await expect(
    page.getByText("Academic simulation coming next."),
  ).toBeVisible();
  await page.getByRole("button", { name: "All apps" }).click();
  await page.getByRole("button", { name: "Guide & feedback" }).click();
  await expect(
    page.getByRole("heading", { name: "Campus guide" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "All apps" }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Weather preview" })
    .selectOption("rain");
  await page.keyboard.press("Escape");
  await expect(phone).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Open virtual phone" }),
  ).toBeFocused();
  await expect(
    page.getByText("Rain on campus. Find your favourite shelter."),
  ).toBeVisible();
  if (process.env.CAPTURE_VISUALS === "1") {
    await page.screenshot({
      path: `artifacts/futa-rain-${test.info().project.name}.png`,
    });
  }
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Account & privacy" }).click();
  await expect(
    page.getByRole("heading", { name: "Save your journey" }),
  ).toBeVisible();
  const denied = await page.request.post(
    "http://localhost:3001/api/account/world",
    {
      headers: { Origin: "http://localhost:3001" },
      data: { campusId: "futa", worldVersion: 1, spawnId: "spawn-arrival" },
    },
  );
  expect(denied.status()).toBe(401);
});
test("all campuses supply cacheable validated manifests and unsafe deep links fail closed", async ({
  request,
}) => {
  for (const campus of ["futa", "oau", "unilag"]) {
    const r = await request.get(
      `http://localhost:3001/api/world/${campus}/versions/1`,
    );
    expect(r.ok()).toBe(true);
    expect(r.headers()["cache-control"]).toContain("immutable");
    expect((await r.json()).campusId).toBe(campus);
    expect(r.headers()["set-cookie"]).toBeUndefined();
  }
  expect(
    (
      await request.get("http://localhost:3001/api/world/unknown/versions/1")
    ).status(),
  ).toBe(404);
  const guest = await request.post("http://localhost:3001/api/guest", {
    headers: { Origin: "http://localhost:3001" },
    data: validGuestFixture,
  });
  expect(guest.ok()).toBe(true);
});
