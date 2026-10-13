/* global window, structuredClone */
import assert from "node:assert/strict";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { startProof } from "./m1-proof-server.mjs";
const out = "art/characters/m1/painted-campus/evidence";
await mkdir(out, { recursive: true });
const { server, port, spec } = await startProof({ paintedCampus: true });
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
          if (state === "idle") {
            const foot = await page.evaluate(() => window.__cwM1.screenFoot);
            await page.screenshot({
              path: `${out}/native-master-${dir}-crop.png`,
              clip: {
                x: Math.max(0, Math.floor(foot.x - 55)),
                y: Math.max(69, Math.floor(69 + foot.y - 95)),
                width: 110,
                height: 115,
              },
            });
          }
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
      try {
        await page.waitForFunction(
          (old) => window.__cwM1.position.x > old.x + 4,
          before,
          { timeout: 5000 },
        );
      } finally {
        await page.keyboard.up("ArrowRight");
      }
      const after = await page.evaluate(() => ({ ...window.__cwM1.position }));
      assert(after.x > before.x);
      assert.equal(await page.evaluate(() => window.__cwM1.direction), "right");
      await page.screenshot({ path: `${out}/keyboard-movement-360x800.png` });
      await page.locator("canvas").click({ position: { x: 150, y: 390 } });
      await page.waitForFunction(
        (old) =>
          Math.hypot(
            window.__cwM1.position.x - old.x,
            window.__cwM1.position.y - old.y,
          ) > 4,
        after,
        { timeout: 5000 },
      );
      const tapped = await page.evaluate(() => ({ ...window.__cwM1.position }));
      assert(Math.hypot(tapped.x - after.x, tapped.y - after.y) > 0);
      initial.interaction = {
        before,
        after,
        tapped,
        kind: "existing WorldEngine cosmetic keyboard/pointer movement only",
      };
      const played = [];
      for (const [key, dir, axis, sign] of [
        ["ArrowRight", "right", "x", 1],
        ["ArrowDown", "down", "y", 1],
        ["ArrowLeft", "left", "x", -1],
        ["ArrowUp", "up", "y", -1],
      ]) {
        await page.locator("canvas").focus();
        await page.evaluate(() => {
          window.__cwM1.locomotion = [];
        });
        const start = await page.evaluate(() => ({
          ...window.__cwM1.position,
        }));
        await page.keyboard.down(key);
        try {
          await page.waitForFunction(
            ({ start, axis, sign, dir }) =>
              (window.__cwM1.position[axis] - start[axis]) * sign >=
                window.__cwM1.pace.worldUnitsPerSecond * 1.25 &&
              new Set(
                window.__cwM1.locomotion
                  .filter((sample) => sample.direction === dir)
                  .map((sample) => sample.frame),
              ).size === 8,
            { start, axis, sign, dir },
            { timeout: 10000 },
          );
          const walking = await page.evaluate(() =>
            structuredClone(window.__cwM1),
          );
          assert.equal(walking.direction, dir);
          assert.equal(walking.state, "walk");
          assert.equal(walking.pace.productionSpeedChanged, false);
          assert.equal(walking.gaitClock, "actual cosmetic distance");
          assert(walking.bodyPercent >= 8 && walking.bodyPercent <= 12);
          assert.equal(walking.pace.cycleSeconds, 1);
          const motionSamples = walking.locomotion.filter(
            (sample) => sample.direction === dir,
          );
          const plantDrift = [];
          for (let i = 1; i < motionSamples.length; i++) {
            const a = motionSamples[i - 1],
              b = motionSamples[i];
            const ai = Number(a.frame.split("-").at(-1)),
              bi = Number(b.frame.split("-").at(-1));
            if (
              a.plant &&
              b.plant &&
              a.plant.leg === b.plant.leg &&
              bi === (ai + 1) % 8
            ) {
              const drift = Math.hypot(
                b.plant.world.x - a.plant.world.x,
                b.plant.world.y - a.plant.world.y,
              );
              assert(
                drift <= b.plant.maxQuantizationWorldUnits + 0.5,
                "Planted-foot motion must stay within one baked-pose interval",
              );
              plantDrift.push({
                from: a.frame,
                to: b.frame,
                worldDrift: drift,
                bound: b.plant.maxQuantizationWorldUnits + 0.5,
              });
            }
          }
          assert(
            plantDrift.length >= 2,
            "Two adjacent planted transitions must be observed per facing",
          );
          played.push({
            plantDrift,
            direction: dir,
            start,
            end: walking.position,
            pace: walking.pace,
            samples: motionSamples,
          });
          await page.screenshot({
            path: `${out}/played-walk-${dir}-360x800.png`,
          });
        } finally {
          await page.keyboard.up(key);
        }
      }
      initial.playedFourDirections = played;
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
  const dprContext = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 2,
  });
  const dprPage = await dprContext.newPage();
  await dprPage.goto(`http://127.0.0.1:${port}`);
  await dprPage.waitForFunction(
    () => window.__cwM1?.ready && window.__cwM1?.canvas?.width === 360,
  );
  const dpr2 = await dprPage.evaluate(() => structuredClone(window.__cwM1));
  assert.equal(dpr2.canvas.width, 360);
  assert.equal(dpr2.canvas.height, 731);
  assert.equal(dpr2.loadedAtlases.length, 3);
  await dprPage.screenshot({ path: `${out}/futa-360x800-dpr2.png` });
  await dprContext.close();
  await writeFile(
    `${out}/measurements.json`,
    JSON.stringify(
      {
        status:
          "B selected M1 actual Phaser; final human visual approval pending",
        browser: await browser.version(),
        renderer: "Phaser CANVAS software Chromium; DPR1; not physical Android",
        worldVersion: spec.world.version,
        sourceRevision: spec.world.sourceRevision,
        scaleMethod:
          "exported body alpha bounds × live sprite scale × live camera zoom / measured canvas height; excludes ground shadow",
        productionRuntimeChanged: false,
        groundComposition:
          "read-only adaptation of existing v2 CampusScene floor/buildings/decorations; separate UI and two art-proof NPCs; no M3 asset upgrade",
        capturedPlayerLooks: [0, 1, 2, 3],
        style:
          "B selected, final M1 approval open; all six current B-source examples",
        sourceHash: spec.sourceHash,
        authoring: spec.authoring,
        rows,
        dpr2,
        reduced,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `M1 actual Phaser proof passed: ${rows.length} viewports, eight states, B only: four player looks, two current NPCs, movement, bounded textures and reduced motion. Visual approval pending.`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
