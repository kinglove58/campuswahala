/* global window, structuredClone */
import assert from "node:assert/strict";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { URL } from "node:url";
import { startProof } from "./m1-proof-server.mjs";
const browser = await chromium.launch({
  executablePath: process.env.CW_CHROMIUM_EXECUTABLE || undefined,
  args: [
    "--no-sandbox",
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  for (const treatment of ["a", "b"]) {
    const out = `art/characters/m1/treatments/${treatment}/evidence`;
    await mkdir(out, { recursive: true });
    const { server, port, spec } = await startProof({ treatment });
    try {
      const context = await browser.newContext({
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 1,
        recordVideo: {
          dir: "artifacts/m1-selection/video",
          size: { width: 360, height: 800 },
        },
      });
      const page = await context.newPage(),
        issues = [],
        requests = [];
      page.on("pageerror", (e) => issues.push(e.message));
      page.on("request", (r) => requests.push(new URL(r.url()).pathname));
      await page.goto(`http://127.0.0.1:${port}`);
      await page.waitForFunction(() => window.__cwM1?.ready);
      await page.waitForTimeout(700);
      const initial = await page.evaluate(() => structuredClone(window.__cwM1));
      const dom = await page.locator("canvas").boundingBox();
      assert.deepEqual(initial.canvas, { width: 360, height: 731 });
      assert.equal(dom.width, 360);
      assert.equal(dom.height, 731);
      assert.equal(initial.activeNpcCount, 0);
      assert.deepEqual(initial.loadedAtlases, ["look-0"]);
      assert.equal(initial.peakAtlasCount, 1);
      assert.equal(initial.foot.originY, 177 / 192);
      assert(initial.bodyPercent >= 8 && initial.bodyPercent <= 12);
      assert.equal(await page.locator("#look option").count(), 1);
      for (const direction of spec.directions) {
        await page.selectOption("#direction", direction);
        await page.selectOption("#motion", "idle");
        await page.waitForFunction(
          (dir) =>
            window.__cwM1.direction === dir &&
            window.__cwM1.frame === `${dir}-idle-0`,
          direction,
        );
        await page.screenshot({ path: `${out}/${direction}-idle-360x800.png` });
        const foot = await page.evaluate(() => window.__cwM1.screenFoot);
        await page.screenshot({
          path: `${out}/${direction}-native-crop.png`,
          clip: {
            x: Math.floor(foot.x - 55),
            y: Math.floor(69 + foot.y - 95),
            width: 110,
            height: 115,
          },
        });
        await page.selectOption("#motion", "walk");
        await page.waitForFunction(
          (dir) => (window.__cwM1.seen[`0-${dir}-walk`] || []).length === 8,
          direction,
          { timeout: 10000 },
        );
        await page.screenshot({ path: `${out}/${direction}-walk-360x800.png` });
      }
      await page.selectOption("#motion", "idle");
      const played = [];
      for (const [key, direction, axis, sign] of [
        ["ArrowRight", "right", "x", 1],
        ["ArrowDown", "down", "y", 1],
        ["ArrowLeft", "left", "x", -1],
        ["ArrowUp", "up", "y", -1],
      ]) {
        await page.locator("canvas").focus();
        const start = await page.evaluate(() => ({
          ...window.__cwM1.position,
        }));
        // Separate samples for each held-key leg; preview animation alone is insufficient.
        await page.evaluate(() => {
          window.__cwM1.locomotion = [];
        });
        await page.keyboard.down(key);
        try {
          await page.waitForFunction(
            ({ start, axis, sign, direction }) => {
              const o = window.__cwM1;
              return (
                (o.position[axis] - start[axis]) * sign >=
                  o.pace.worldUnitsPerSecond * 1.25 &&
                new Set(
                  o.locomotion
                    .filter((s) => s.direction === direction)
                    .map((s) => s.frame),
                ).size === 8
              );
            },
            { start, axis, sign, direction },
            { timeout: 10000 },
          );
          const walking = await page.evaluate(() =>
            structuredClone(window.__cwM1),
          );
          assert.equal(walking.direction, direction);
          assert.equal(walking.state, "walk");
          assert.equal(walking.pace.productionSpeedChanged, false);
          assert.equal(walking.pace.cycleSeconds, 1);
          assert(walking.bodyPercent >= 8 && walking.bodyPercent <= 12);
          played.push({
            direction,
            start,
            end: walking.position,
            pace: walking.pace,
            samples: walking.locomotion,
          });
          await page.screenshot({
            path: `${out}/${direction}-played-360x800.png`,
          });
        } finally {
          await page.keyboard.up(key);
        }
      }
      const before = await page.evaluate(() => ({ ...window.__cwM1.position }));
      await page.locator("canvas").click({ position: { x: 150, y: 390 } });
      await page.waitForFunction(
        (old) =>
          Math.hypot(
            window.__cwM1.position.x - old.x,
            window.__cwM1.position.y - old.y,
          ) > 4,
        before,
        { timeout: 5000 },
      );
      const final = await page.evaluate(() => structuredClone(window.__cwM1));
      assert.deepEqual(issues, []);
      assert.deepEqual(final.errors, []);
      assert.equal(requests.filter((p) => p.startsWith("/atlas/")).length, 1);
      assert.equal(
        requests.find((p) => p.includes("/api/")),
        undefined,
      );
      assert(requests.includes("/atlas/master.png"));
      assert(
        !requests.some((p) => p.includes("look-") || p.includes("inhouse")),
      );
      const video = page.video();
      await context.close();
      await copyFile(
        await video.path(),
        `${out}/walk-and-movement-360x800.webm`,
      );
      const reducedContext = await browser.newContext({
        viewport: { width: 360, height: 800 },
        deviceScaleFactor: 1,
        reducedMotion: "reduce",
      });
      const reducedPage = await reducedContext.newPage();
      await reducedPage.goto(`http://127.0.0.1:${port}`);
      await reducedPage.waitForFunction(() => window.__cwM1?.ready);
      await reducedPage.selectOption("#motion", "walk");
      await reducedPage.waitForTimeout(1300);
      const reduced = await reducedPage.evaluate(() =>
        structuredClone(window.__cwM1),
      );
      assert.deepEqual(reduced.seen["0-down-walk"], ["down-walk-0"]);
      assert.deepEqual(reduced.loadedAtlases, ["look-0"]);
      await reducedPage.screenshot({
        path: `${out}/reduced-motion-360x800.png`,
      });
      await reducedContext.close();
      await writeFile(
        `${out}/measurements.json`,
        JSON.stringify(
          {
            status: "A/B master selection pending; no art approval",
            treatment,
            sourceHash: spec.sourceHash,
            browser: await browser.version(),
            renderer:
              "Phaser CANVAS, software Chromium, DPR1; not physical-device performance",
            frameCap: 30,
            animationFps: 8,
            ground: "existing FUTA v2, read-only drawBaselineGround",
            worldVersion: spec.world.version,
            sourceRevision: spec.world.sourceRevision,
            productionRuntimeChanged: false,
            appearancePermutationsGenerated: 0,
            npcAtlasesGenerated: 0,
            canvasDOM: dom,
            initial,
            playedFourDirections: played,
            final,
            reduced,
            requests,
            authorityRequests: 0,
            nativeCrop:
              "110x115 exact screenshot pixels, no resizing, centered on measured foot; full viewports 360x800",
            scaleMethod:
              "body alpha (shadow excluded) x sprite scale x camera zoom / measured 731px canvas height",
          },
          null,
          2,
        ) + "\n",
      );
      console.log(
        `${treatment.toUpperCase()}: native 360x800, four facings, all eight moving frames per direction, pointer/reduced motion, single atlas, zero authority requests.`,
      );
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  }
} finally {
  await browser.close();
}
