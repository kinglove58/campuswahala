import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { validGuestFixture } from "../../packages/testing/src";

test("M2 played production Map route: fast traversal, natural approach and cosmetic authority", async ({
  browser,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || process.env.CAPTURE_VISUALS !== "1",
    "One native route video; retained journey tests cover both projects.",
  );
  test.setTimeout(90000);
  const out = "artifacts/m2-production";
  await mkdir(out, { recursive: true });
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 1,
    hasTouch: true,
    recordVideo: { dir: `${out}/video`, size: { width: 360, height: 800 } },
  });
  const page = await context.newPage();
  const errors: string[] = [],
    mutations: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
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
    page.on("request", (r) => {
      if (
        r.method() === "POST" &&
        /\/api\/(academic|life|account)/.test(r.url())
      )
        mutations.push(r.url());
    });
    await page.getByRole("button", { name: "Open virtual phone" }).click();
    await page.getByRole("button", { name: "Campus map", exact: true }).click();
    await page
      .getByRole("button", { name: /Lecture hall.*Set waypoint/ })
      .click();
    const start = Date.now();
    await page.getByRole("button", { name: "Walk there", exact: true }).click();
    await expect(world).toHaveAttribute("data-fast-route", "true");
    await expect(page.locator(".route-pace-label")).toBeVisible();
    await page.screenshot({
      path: `${out}/production-fast-map-route-360x800.png`,
    });
    await expect(world).toHaveAttribute("data-fast-route", "false", {
      timeout: 45000,
    });
    await expect(world).toHaveAttribute("data-character-frame", /-walk-/);
    await page.screenshot({
      path: `${out}/production-natural-route-approach-360x800.png`,
    });
    await expect(
      page.getByRole("button", { name: "Enter Lecture hall", exact: true }),
    ).toBeVisible({ timeout: 45000 });
    const elapsedMs = Date.now() - start;
    expect(elapsedMs).toBeLessThan(45000);
    expect(errors).toEqual([]);
    expect(mutations).toEqual([]);
    await writeFile(
      `${out}/production-map-route.json`,
      JSON.stringify(
        {
          checkoutCommit: execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
          viewport: "360x800 DPR1",
          elapsedMs,
          mode: "Existing fast time-compressed Map route; final96 world units use natural B pace; actual engine path and unchanged proximity/clock/authority",
          errors,
          authorityPosts: mutations,
        },
        null,
        2,
      ),
    );
    const video = page.video();
    await context.close();
    if (video) {
      await video.saveAs(
        `${out}/production-map-route-and-approach-360x800.webm`,
      );
      await video.delete();
    }
  } finally {
    await context.close();
  }
});
