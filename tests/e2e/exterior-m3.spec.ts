import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { validGuestFixture } from "../../packages/testing/src";
import { exteriorAssets } from "../../packages/game-engine/src";
for (const campus of ["futa", "oau", "unilag"] as const) {
  test(`M3 ${campus}: real exterior, clear Map approach, public atlas, no authority mutation`, async ({
    page,
    context,
  }, info) => {
    test.setTimeout(120000);
    expect(
      (
        await context.request.post("http://localhost:3001/api/guest", {
          headers: { Origin: "http://localhost:3001" },
          data: { ...validGuestFixture, campusId: campus },
        })
      ).ok(),
    ).toBe(true);
    const errors: string[] = [],
      posts: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("request", (r) => {
      if (
        r.method() === "POST" &&
        /\/api\/(academic|life|account)/.test(r.url())
      )
        posts.push(r.url());
    });
    await page.goto(`http://localhost:3001/play?campus=${campus}`);
    const world = page.getByTestId("campus-world");
    await expect(world).toHaveAttribute("data-character-ready", "true", {
      timeout: 15000,
    });
    await expect(world).toHaveAttribute("data-exterior-campus", campus, {
      timeout: 15000,
    });
    await expect(world).toHaveAttribute("data-exterior-ready", "true", {
      timeout: 15000,
    });
    expect(
      Number(await world.getAttribute("data-exterior-objects")),
    ).toBeGreaterThan(30);
    expect(
      Number(await world.getAttribute("data-exterior-decoded-bytes")),
    ).toBe(3145728);
    const asset = await context.request.get(
      `http://localhost:3001${exteriorAssets[campus].path}`,
    );
    expect(asset.ok()).toBe(true);
    expect(asset.headers()["cache-control"]).toContain("immutable");
    expect((await asset.body()).length).toBe(exteriorAssets[campus].bytes);
    for (const version of [1, 2])
      expect(
        (
          await context.request.get(
            `http://localhost:3001/api/world/${campus}/versions/${version}`,
          )
        ).ok(),
      ).toBe(true);
    await page.getByRole("button", { name: "Open virtual phone" }).click();
    await page.getByRole("button", { name: "Campus map", exact: true }).click();
    await page
      .getByRole("button", { name: /Lecture hall.*Set waypoint/ })
      .click();
    await page.getByRole("button", { name: "Walk there", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Enter Lecture hall", exact: true }),
    ).toBeVisible({ timeout: 45000 });
    await mkdir("artifacts/m3-production", { recursive: true });
    await page.screenshot({
      path: `artifacts/m3-production/${campus}-lecture-${info.project.name}.png`,
    });
    const before = JSON.parse((await world.getAttribute("data-position"))!);
    await world.locator("canvas").focus();
    await page.keyboard.down("ArrowDown");
    await page.waitForTimeout(2000);
    await page.keyboard.up("ArrowDown");
    const after = JSON.parse((await world.getAttribute("data-position"))!);
    expect(after.y - before.y).toBeGreaterThan(35);
    expect(after.y - before.y).toBeLessThan(50);
    await expect(world).toHaveAttribute("data-navigation-speed", "22");
    expect(
      Number(await world.getAttribute("data-exterior-peak-objects")),
    ).toBeLessThan(768);
    expect(
      Number(await world.getAttribute("data-character-peak-textures")),
    ).toBeLessThanOrEqual(6);
    expect(
      Number(await world.getAttribute("data-active-npcs")),
    ).toBeLessThanOrEqual(16);
    await page.getByRole("button", { name: "Open virtual phone" }).click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    await page
      .getByRole("combobox", { name: "Weather preview" })
      .selectOption("rain");
    await page.keyboard.press("Escape");
    await expect(
      page.getByText("Rain on campus. Find your favourite shelter.", {
        exact: true,
      }),
    ).toBeVisible();
    await page.screenshot({
      path: `artifacts/m3-production/${campus}-rain-${info.project.name}.png`,
    });
    expect(errors).toEqual([]);
    expect(posts).toEqual([]);
  });
}
for (const [width, height, dpr] of [
  [360, 640, 1],
  [360, 800, 1],
  [390, 844, 2],
  [1280, 900, 1],
] as const) {
  test(`M3 production campus comparisons ${width}x${height} DPR${dpr}`, async ({
    browser,
  }, info) => {
    test.skip(
      info.project.name !== "desktop" || process.env.CAPTURE_VISUALS !== "1",
      "One recorded pass per viewport; all three functional campuses run on both projects.",
    );
    test.setTimeout(180000);
    await mkdir("artifacts/m3-production", { recursive: true });
    for (const campus of ["futa", "oau", "unilag"] as const) {
      const out = "artifacts/m3-production",
        context = await browser.newContext({
          viewport: { width, height },
          deviceScaleFactor: dpr,
          hasTouch: width < 600,
          serviceWorkers: "block",
          recordVideo: { dir: `${out}/video`, size: { width, height } },
        });
      const page = await context.newPage(),
        cdp = await context.newCDPSession(page);
      await cdp.send("Network.enable");
      await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
      let bytes = 0;
      const resources: { url: string; bytes: number }[] = [];
      const requests = new Map<string, string>();
      cdp.on("Network.requestWillBeSent", (e) =>
        requests.set(e.requestId, e.request.url),
      );
      cdp.on("Network.loadingFinished", (e) => {
        bytes += e.encodedDataLength;
        resources.push({
          url: requests.get(e.requestId) ?? "",
          bytes: e.encodedDataLength,
        });
      });
      expect(
        (
          await context.request.post("http://localhost:3001/api/guest", {
            headers: { Origin: "http://localhost:3001" },
            data: { ...validGuestFixture, campusId: campus },
          })
        ).ok(),
      ).toBe(true);
      const start = Date.now();
      await page.goto(`http://localhost:3001/play?campus=${campus}`);
      const world = page.getByTestId("campus-world");
      await expect(world).toHaveAttribute("data-exterior-campus", campus, {
        timeout: 15000,
      });
      await expect(world).toHaveAttribute("data-exterior-ready", "true", {
        timeout: 15000,
      });
      await expect(world).toHaveAttribute("data-character-ready", "true", {
        timeout: 15000,
      });
      const readyMs = Date.now() - start;
      await expect
        .poll(
          async () =>
            Number(await world.getAttribute("data-character-pending")),
          { timeout: 15000 },
        )
        .toBe(0);
      const coldBytes = bytes;
      expect(coldBytes).toBeLessThan(1.5 * 1024 * 1024);
      await page.screenshot({
        path: `${out}/${campus}-${width}x${height}-dpr${dpr}.png`,
      });
      await world.locator("canvas").focus();
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(2300);
      await page.keyboard.up("ArrowRight");
      await page.waitForTimeout(400);
      await page.keyboard.down("ArrowLeft");
      await page.waitForTimeout(2300);
      await page.keyboard.up("ArrowLeft");
      await page.waitForTimeout(10500);
      const metrics = await world.evaluate((el) => ({
        ...(el as HTMLElement).dataset,
      }));
      expect(Number(metrics.exteriorDecodedBytes)).toBeLessThanOrEqual(
        4 * 1024 * 1024,
      );
      expect(Number(metrics.exteriorPeakObjects)).toBeLessThan(768);
      expect(metrics.exteriorFailed).toBe("false");
      const video = page.video();
      await context.close();
      if (video) {
        await video.saveAs(`${out}/${campus}-walking-${width}x${height}.webm`);
        await video.delete();
      }
      await writeFile(
        `${out}/${campus}-${width}x${height}.json`,
        JSON.stringify(
          {
            checkout: execFileSync("git", ["rev-parse", "HEAD"], {
              encoding: "utf8",
            }).trim(),
            campus,
            viewport: { width, height, dpr },
            readyMs,
            coldBytes,
            resources,
            metrics,
            physicalAndroid: "not tested",
            notes:
              "Actual production input/camera, software emulator. HTTP cache disabled/SW blocked only for cold measurement. Raw wall frame intervals include capture overhead; not physical FPS.",
          },
          null,
          2,
        ),
      );
    }
  });
}

test.describe("M3 failure injection context", () => {
  test.use({ serviceWorkers: "block" });
  test("M3 interrupted exterior asset retains marked geometry and cosmetic movement", async ({
    page,
    context,
  }) => {
    await page.route("**/world-assets/exteriors/*.svg", (route) =>
      route.abort("failed"),
    );
    expect(
      (
        await context.request.post("http://localhost:3001/api/guest", {
          headers: { Origin: "http://localhost:3001" },
          data: validGuestFixture,
        })
      ).ok(),
    ).toBe(true);
    await page.goto("http://localhost:3001/play?campus=futa");
    const world = page.getByTestId("campus-world");
    await expect(world).toHaveAttribute("data-character-ready", "true", {
      timeout: 15000,
    });
    await expect(world).toHaveAttribute("data-exterior-fallback", "true");
    expect(
      Number(await world.getAttribute("data-exterior-objects")),
    ).toBeGreaterThan(0);
    await expect
      .poll(
        async () => Number(await world.getAttribute("data-character-pending")),
        { timeout: 15000 },
      )
      .toBe(0);
    const before = JSON.parse((await world.getAttribute("data-position"))!);
    await world.locator("canvas").focus();
    await page.keyboard.down("ArrowRight");
    await page.waitForTimeout(1000);
    await page.keyboard.up("ArrowRight");
    expect(
      JSON.parse((await world.getAttribute("data-position"))!).x,
    ).toBeGreaterThan(before.x + 10);
    expect(
      Number(await world.getAttribute("data-exterior-decoded-bytes")),
    ).toBe(0);
  });
});
