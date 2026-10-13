import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { validGuestFixture } from "../../packages/testing/src";
import { characterAssets } from "../../apps/game/app/character-assets";

for (const [width, height, dpr] of [
  [360, 640, 1],
  [360, 800, 1],
  [390, 844, 2],
  [1280, 900, 1],
] as const) {
  test(`M2 production evidence ${width}x${height} DPR${dpr}: played walk, looks and map`, async ({
    browser,
  }, info) => {
    test.skip(
      info.project.name !== "desktop" || process.env.CAPTURE_VISUALS !== "1",
      "One evidence pass per viewport; functional coverage runs on both projects.",
    );
    test.setTimeout(180000);
    const out = "artifacts/m2-production";
    await mkdir(out, { recursive: true });
    const measurements: unknown[] = [];
    const native = width === 360 && height === 800;
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: dpr,
      hasTouch: width < 600,
      ...(native
        ? { recordVideo: { dir: `${out}/video`, size: { width, height } } }
        : {}),
    });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Network.enable");
    let wireBytes = 0;
    cdp.on("Network.loadingFinished", (event) => {
      wireBytes += event.encodedDataLength;
    });
    const errors: string[] = [],
      mutations: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const response = await context.request.post(
      "http://localhost:3001/api/guest",
      { headers: { Origin: "http://localhost:3001" }, data: validGuestFixture },
    );
    expect(response.ok()).toBe(true);
    const boot = Date.now();
    await page.goto("http://localhost:3001/play?campus=futa");
    const world = page.getByTestId("campus-world"),
      canvas = world.locator("canvas");
    await expect(world).toHaveAttribute("data-character-ready", "true", {
      timeout: 15000,
    });
    const readyMs = Date.now() - boot;
    const playerReadyWireBytes = wireBytes;
    await expect
      .poll(
        async () => Number(await world.getAttribute("data-character-pending")),
        {
          timeout: 15000,
          message:
            "Finish the bounded player/NPC atlas queue before visual capture",
        },
      )
      .toBe(0);
    const atlasReadyMs = Date.now() - boot;
    const atlasesReadyWireBytes = wireBytes;
    page.on("request", (r) => {
      if (
        r.method() === "POST" &&
        /\/api\/(academic|life|account)/.test(r.url())
      )
        mutations.push(r.url());
    });
    await page.screenshot({
      path: `${out}/production-${width}x${height}-dpr${dpr}.png`,
    });
    const phases: Record<string, number[]> = {};
    if (native) {
      // Actual input and displacement; no scene setter, mock game or frame injection.
      for (const [dir, key] of [
        ["right", "ArrowRight"],
        ["left", "ArrowLeft"],
        ["up", "ArrowUp"],
        ["down", "ArrowDown"],
      ] as const) {
        await canvas.focus();
        await page.keyboard.down(key);
        await expect(world).toHaveAttribute(
          "data-character-frame",
          new RegExp(`^${dir}-walk-`),
        );
        const seen = await world.evaluate(async (element) => {
          const samples = new Set<number>();
          for (let i = 0; i < 40; i++) {
            const frame = (element as HTMLElement).dataset.characterFrame ?? "";
            if (frame.includes("-walk-"))
              samples.add(Number(frame.split("-").at(-1)));
            await new Promise((resolve) => setTimeout(resolve, 60));
          }
          return [...samples].sort();
        });
        phases[dir] = seen;
        expect(seen).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
        await page.screenshot({
          path: `${out}/production-${dir}-walk-360x800.png`,
        });
        await page.keyboard.up(key);
        await expect(world).toHaveAttribute(
          "data-character-frame",
          new RegExp(`^${dir}-idle-`),
        );
        await page.waitForTimeout(650);
        await page.screenshot({
          path: `${out}/production-${dir}-idle-360x800.png`,
        });
      }
      for (const [index, asset] of characterAssets.slice(0, 4).entries()) {
        await page.getByRole("button", { name: "Open virtual phone" }).click();
        await page
          .getByRole("button", { name: "My chapter", exact: true })
          .click();
        for (const [field, label] of [
          ["skin", "Skin"],
          ["hair", "Hair"],
          ["hairColour", "Hair colour"],
          ["top", "Top"],
          ["bottom", "Bottom"],
          ["shoes", "Shoes"],
          ["accessory", "Accessory"],
        ] as const)
          await page
            .getByRole("combobox", { name: label, exact: true })
            .selectOption(asset.appearance[field]);
        await page
          .getByRole("button", { name: "Keep this look", exact: true })
          .click();
        await page.keyboard.press("Escape");
        await expect(world).toHaveAttribute(
          "data-appearance",
          Object.values(asset.appearance).join("-"),
        );
        await page.waitForTimeout(700);
        await page.screenshot({
          path: `${out}/production-player-${index}-360x800.png`,
        });
      }
      const bounds = (await canvas.boundingBox())!;
      await canvas.tap({
        position: { x: bounds.width / 2 + 60, y: bounds.height / 2 + 30 },
      });
      await expect(world).toHaveAttribute("data-character-frame", /-walk-/);
      await page.waitForTimeout(700);
      await page.screenshot({
        path: `${out}/production-touch-walk-360x800.png`,
      });
      await page.getByRole("button", { name: "Open virtual phone" }).click();
      await page
        .getByRole("button", { name: "Campus map", exact: true })
        .click();
      await page.screenshot({
        path: `${out}/production-pocket-map-360x800.png`,
      });
      await page.keyboard.press("Escape");
    }
    // A timed production sample, including idle NPC animation; emulator only.
    await page.waitForTimeout(native ? 1000 : 10500);
    const sample = await world.evaluate((element) => ({
      characterPeakTextures: (element as HTMLElement).dataset
        .characterPeakTextures,
      bodyHeight: (element as HTMLElement).dataset.bodyHeight,
      canvasHeight: (element as HTMLElement).dataset.canvasHeight,
      activeNpcs: (element as HTMLElement).dataset.activeNpcs,
      metrics: { ...(element as HTMLElement).dataset },
      resources: performance
        .getEntriesByType("resource")
        .map((r) => {
          const p = r as PerformanceResourceTiming;
          return {
            name: p.name,
            encoded: p.encodedBodySize,
            transfer: p.transferSize,
            decoded: p.decodedBodySize,
            duration: p.duration,
          };
        })
        .filter(
          (r) =>
            r.name.includes("character-assets") ||
            r.name.includes("/_next/static"),
        ),
    }));
    expect(Number(sample.characterPeakTextures)).toBeLessThanOrEqual(6);
    expect(
      Number(sample.bodyHeight) / Number(sample.canvasHeight),
    ).toBeGreaterThanOrEqual(0.08);
    expect(
      Number(sample.bodyHeight) / Number(sample.canvasHeight),
    ).toBeLessThanOrEqual(0.12);
    expect(Number(sample.activeNpcs)).toBeGreaterThan(0);
    expect(errors).toEqual([]);
    expect(mutations).toEqual([]);
    const initialCanvasHeight = Number(
      await world.getAttribute("data-canvas-height"),
    );
    await page.setViewportSize({ width: width + 30, height: height + 40 });
    await expect
      .poll(async () => Number(await world.getAttribute("data-canvas-height")))
      .toBeGreaterThan(initialCanvasHeight);
    const resizedRatio =
      Number(await world.getAttribute("data-body-height")) /
      Number(await world.getAttribute("data-canvas-height"));
    expect(resizedRatio).toBeGreaterThanOrEqual(0.08);
    expect(resizedRatio).toBeLessThanOrEqual(0.12);
    await page.setViewportSize({ width, height });
    await expect(world).toHaveAttribute(
      "data-canvas-height",
      String(initialCanvasHeight),
    );
    measurements.push({
      viewport: { width, height, dpr },
      readyMs,
      atlasReadyMs,
      playerReadyWireBytes,
      atlasesReadyWireBytes,
      sessionWireBytes: wireBytes,
      canvasDOM: await canvas.boundingBox(),
      phases,
      sample,
      errors,
      authorityMutations: mutations,
      resizedRatio,
    });
    const video = page.video();
    await context.close();
    if (video) {
      await video.saveAs(`${out}/production-walking-map-looks-360x800.webm`);
      await video.delete();
    }
    await writeFile(
      `${out}/production-metrics-${width}x${height}-dpr${dpr}.json`,
      JSON.stringify(
        {
          productionURL: "http://localhost:3001/play?campus=futa",
          checkoutCommit: execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
          ciEvent: process.env.GITHUB_EVENT_NAME ?? "local",
          ciRun: process.env.GITHUB_RUN_ID ?? null,
          input:
            "Real API guest + keyboard + existing UI; no injected authority/scene/frame",
          physicalAndroid: "not tested",
          transferNote:
            "CDP encodedDataLength covers browser-page traffic, excluding APIRequest guest setup. ResourceTiming sizes and nominal PNG bytes are reported separately; SW/cache entries may have zero transferSize.",
          measurements,
        },
        null,
        2,
      ),
    );
  });
}
