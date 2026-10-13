import { test, expect } from "@playwright/test";
import { validGuestFixture } from "../../packages/testing/src";
test("M2 actual B world: walking, touch, Pocket map, saved guest appearance and bounded textures", async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const response = await context.request.post(
    "http://localhost:3001/api/guest",
    { headers: { Origin: "http://localhost:3001" }, data: validGuestFixture },
  );
  expect(response.ok()).toBe(true);
  await page.goto("http://localhost:3001/play?campus=futa");
  const world = page.getByTestId("campus-world");
  await expect(world).toHaveAttribute("data-character-ready", "true");
  await expect(world).toHaveAttribute("data-camera-profile", "m2-b-camera-1");
  const metrics = await world.evaluate((e) => ({
    ...(e as HTMLElement).dataset,
  }));
  const ratio = Number(metrics.bodyHeight) / Number(metrics.canvasHeight);
  expect(ratio).toBeGreaterThanOrEqual(0.08);
  expect(ratio).toBeLessThanOrEqual(0.12);
  expect(Number(metrics.cameraZoom)).toBeGreaterThan(1.05);
  const mutations: string[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST" && /\/api\/(academic|life|account)/.test(r.url()))
      mutations.push(r.url());
  });
  const canvas = world.locator("canvas");
  await canvas.focus();
  const before = JSON.parse((await world.getAttribute("data-position"))!);
  await page.keyboard.down("ArrowRight");
  await expect(world).toHaveAttribute("data-character-frame", /^right-walk-/);
  await expect
    .poll(
      async () =>
        JSON.parse((await world.getAttribute("data-position"))!).x - before.x,
    )
    .toBeGreaterThan(3);
  await page.keyboard.up("ArrowRight");
  await expect(world).toHaveAttribute("data-character-frame", /^right-idle-/);
  const footBefore = JSON.parse((await world.getAttribute("data-position"))!);
  const bounds = (await canvas.boundingBox())!;
  const destination = {
    position: { x: bounds.width / 2 + 60, y: bounds.height / 2 + 30 },
  };
  if (test.info().project.name === "mobile") await canvas.tap(destination);
  else await canvas.click(destination);
  await expect
    .poll(async () => {
      const p = JSON.parse((await world.getAttribute("data-position"))!);
      return Math.hypot(p.x - footBefore.x, p.y - footBefore.y);
    })
    .toBeGreaterThan(2);
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  const paused = await world.getAttribute("data-position");
  const zoom = await world.getAttribute("data-camera-zoom");
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "CW Pocket virtual phone" }),
  ).toBeVisible();
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(200);
  await page.keyboard.up("ArrowDown");
  expect(await world.getAttribute("data-position")).toBe(paused);
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/m2-pocket-map-${test.info().project.name}.png`,
    });
  await page.keyboard.press("Escape");
  expect(await world.getAttribute("data-camera-zoom")).toBe(zoom);
  expect(mutations).toEqual([]);
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "My chapter", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Hair", exact: true })
    .selectOption("covered");
  await page
    .getByRole("combobox", { name: "Top", exact: true })
    .selectOption("clay");
  await page
    .getByRole("combobox", { name: "Bottom", exact: true })
    .selectOption("skirt");
  await page
    .getByRole("button", { name: "Keep this look", exact: true })
    .click();
  await page.keyboard.press("Escape");
  await expect(world).toHaveAttribute(
    "data-appearance",
    /covered-black-clay-skirt/,
  );
  await page.reload();
  await expect(world).toHaveAttribute("data-character-ready", "true");
  await expect(world).toHaveAttribute(
    "data-appearance",
    /covered-black-clay-skirt/,
  );
  expect(
    Number(await world.getAttribute("data-character-textures")),
  ).toBeLessThanOrEqual(6);
  expect(
    Number(await world.getAttribute("data-character-peak-textures")),
  ).toBeLessThanOrEqual(6);
  if (process.env.CAPTURE_VISUALS === "1")
    await page.screenshot({
      path: `artifacts/m2-world-${test.info().project.name}.png`,
    });
  expect(errors).toEqual([]);
});
test.describe("M2 forced network failure", () => {
  test.use({ serviceWorkers: "block" }); // Route interception cannot see service-worker requests.
  test("M2 reduced motion and approved-source fallback when PNG is unavailable", async ({
    page,
    context,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.route("**/character-assets/**", (route) => route.abort());
    await context.request.post("http://localhost:3001/api/guest", {
      headers: { Origin: "http://localhost:3001" },
      data: validGuestFixture,
    });
    await page.goto("http://localhost:3001/play?campus=futa");
    const world = page.getByTestId("campus-world");
    await expect(world).toHaveAttribute("data-character-ready", "true");
    await expect(world).toHaveAttribute("data-character-frame", "down-idle-0");
    await page.waitForTimeout(700);
    await expect(world).toHaveAttribute("data-character-frame", "down-idle-0");
    await page.getByRole("button", { name: "Open virtual phone" }).click();
    await page.getByRole("button", { name: "My chapter", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Shoes", exact: true })
      .selectOption("white");
    await page.keyboard.press("Escape");
    await expect(world).toHaveAttribute("data-appearance", /white-backpack$/);
    expect(
      Number(await world.getAttribute("data-character-failures")),
    ).toBeGreaterThan(0);
    expect(
      Number(await world.getAttribute("data-character-generated")),
    ).toBeGreaterThan(0);
  });
});
