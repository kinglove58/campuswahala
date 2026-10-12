/* global window, structuredClone */
import assert from "node:assert/strict";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { startProof } from "./m1-proof-server.mjs";
const out = "art/characters/m1/evidence";
await mkdir(out, { recursive: true });
const { server, port, spec } = await startProof();
const browser = await chromium.launch({
  executablePath: process.env.CW_CHROMIUM_EXECUTABLE || undefined,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
const rows = [];
try {
  for (const [width, height] of [
    [360, 640],
    [360, 800],
    [390, 844],
    [1280, 900],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      ...(width === 360 && height === 800
        ? {
            recordVideo: {
              dir: "artifacts/m1-proof/video",
              size: { width, height },
            },
          }
        : {}),
    });
    const page = await context.newPage();
    const issues = [],
      responses = [],
      requests = [];
    page.on("pageerror", (error) => issues.push(error.message));
    page.on("request", (req) => requests.push(req.url()));
    page.on("response", (response) => {
      if (response.url().includes("/atlas/"))
        responses.push(
          response
            .body()
            .then((body) => ({ url: response.url(), bytes: body.length })),
        );
    });
    await page.goto(`http://127.0.0.1:${port}`);
    await page.waitForFunction(() => window.__cwM1?.ready, { timeout: 30000 });
    await page.waitForTimeout(1000);
    const initial = await page.evaluate(() => structuredClone(window.__cwM1));
    const canvasDOM = await page.locator("canvas").boundingBox();
    assert.equal(initial.canvas.height, canvasDOM.height);
    assert.equal(initial.canvas.width, canvasDOM.width);
    initial.canvasDOM = canvasDOM;
    assert.equal(initial.activeNpcCount, 2);
    assert(initial.bodyPercent >= 8 && initial.bodyPercent <= 12);
    assert.equal(initial.loadedAtlases.length, 3);
    assert.equal(
      initial.foot.originY,
      spec.geometry.foot.y / spec.geometry.height,
    );
    await page.screenshot({ path: `${out}/futa-${width}x${height}.png` });
    if (width === 360 && height === 800) {
      for (const dir of spec.directions)
        for (const state of ["idle", "walk"]) {
          await page.selectOption("#direction", dir);
          await page.selectOption("#motion", state);
          await page.waitForFunction(
            ({ dir, state }) =>
              (window.__cwM1.seen[`0-${dir}-${state}`]?.length ?? 0) ===
              (state === "idle" ? 2 : 8),
            { dir, state },
            { timeout: 5000 },
          );
          await page.screenshot({ path: `${out}/${dir}-${state}-360x800.png` });
        }
      await page.selectOption("#motion", "idle");
      await page.selectOption("#direction", "down");
      for (const look of [1, 2, 3, 0]) {
        await page.selectOption("#look", String(look));
        await page.waitForFunction(
          (id) => window.__cwM1.look === id && !window.__cwM1.switching,
          look,
        );
        assert.equal(
          await page.evaluate(() => window.__cwM1.loadedAtlases.length),
          3,
        );
        await page.screenshot({ path: `${out}/look-${look}-360x800.png` });
      }
      await page.locator("canvas").focus();
      const before = await page.evaluate(() => ({ ...window.__cwM1.position }));
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(220);
      await page.keyboard.up("ArrowRight");
      const after = await page.evaluate(() => ({ ...window.__cwM1.position }));
      assert(after.x > before.x);
      assert.equal(await page.evaluate(() => window.__cwM1.direction), "right");
      await page.screenshot({ path: `${out}/keyboard-movement-360x800.png` });
      await page.locator("canvas").click({ position: { x: 150, y: 390 } });
      await page.waitForTimeout(450);
      const tapped = await page.evaluate(() => ({ ...window.__cwM1.position }));
      assert(Math.hypot(tapped.x - after.x, tapped.y - after.y) > 0);
      initial.interaction = {
        before,
        after,
        tapped,
        kind: "existing WorldEngine cosmetic keyboard/pointer movement only",
      };
    }
    assert.deepEqual(issues, []);
    assert(!requests.some((url) => url.includes("/api/")));
    const metrics = await page.evaluate(() => structuredClone(window.__cwM1));
    assert.deepEqual(metrics.errors, []);
    rows.push({
      width,
      height,
      initial,
      final: metrics,
      atlasResponses: await Promise.all(responses),
      authorityRequests: 0,
    });
    const video = page.video();
    await context.close();
    if (video)
      await copyFile(
        await video.path(),
        `${out}/walk-and-movement-360x800.webm`,
      );
  }
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:${port}`);
  await page.waitForFunction(() => window.__cwM1?.ready);
  await page.selectOption("#motion", "walk");
  await page.waitForTimeout(1300);
  const reduced = await page.evaluate(() => structuredClone(window.__cwM1));
  assert.deepEqual(reduced.seen["0-down-walk"], ["down-walk-0"]);
  await page.screenshot({ path: `${out}/reduced-motion-360x800.png` });
  await context.close();
  await writeFile(
    `${out}/measurements.json`,
    JSON.stringify(
      {
        status:
          "M1 isolated actual Phaser candidate; human art approval pending",
        browser: await browser.version(),
        renderer: "Phaser CANVAS software Chromium; DPR1; not physical Android",
        worldVersion: spec.world.version,
        sourceRevision: spec.world.sourceRevision,
        scaleMethod:
          "exported body alpha bounds × live sprite scale × live camera zoom / measured canvas height; excludes ground shadow",
        productionRuntimeChanged: false,
        rows,
        reduced,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `M1 actual Phaser proof passed: ${rows.length} viewports, eight states, four player looks, two NPCs, movement, bounded textures and reduced motion. Visual approval pending.`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
