/** Run after pnpm build. Disposable local memory servers only; never signs in. */
import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath, URL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
const root = fileURLToPath(new URL("../../", import.meta.url));
const out = "art/characters/proof/baseline";
const env = {
  ...process.env,
  APP_ENV: "local",
  PLAYER_STORE: "memory",
  AUTH_PROVIDER: "disabled",
  API_INTERNAL_URL: "http://127.0.0.1:4000",
  GAME_ORIGIN: "http://localhost:3001",
};
const children = [
  spawn(process.execPath, ["apps/api/dist/main.js"], {
    cwd: root,
    env,
    stdio: "ignore",
  }),
  spawn(process.execPath, ["scripts/start-web.mjs", "game", "3001"], {
    cwd: root,
    env,
    stdio: "ignore",
  }),
];
let browser;
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try {
      ready =
        (await fetch("http://127.0.0.1:4000/health/live")).ok &&
        (await fetch("http://127.0.0.1:3001")).ok;
    } catch {
      ready = false;
    }
    if (ready) break;
    await delay(500);
  }
  if (!ready)
    throw new Error("Local disposable baseline servers did not start.");
  browser = await chromium.launch({
    executablePath: process.env.CW_CHROMIUM_EXECUTABLE || undefined,
    args: [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
  await mkdir(out, { recursive: true });
  const rows = [];
  for (const [width, height] of [
    [360, 640],
    [360, 800],
    [390, 844],
    [1280, 900],
  ]) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    const textures = [];
    const readTextures = [];
    page.on("response", (response) => {
      if (response.url().includes("/world-assets/"))
        readTextures.push(
          response.body().then((body) =>
            textures.push({
              path: new URL(response.url()).pathname,
              bodyBytes: body.length,
            }),
          ),
        );
    });
    const guest = await context.request.post(
      "http://127.0.0.1:3001/api/guest",
      {
        headers: { Origin: "http://localhost:3001" },
        data: {
          campusId: "futa",
          programmeId: "computing-demo",
          level: 200,
          durationYears: 4,
          nickname: "Campus Explorer",
          avatar: "lime",
        },
      },
    );
    if (!guest.ok())
      throw new Error(`Guest baseline failed: ${guest.status()}`);
    await page.goto("http://127.0.0.1:3001/play?campus=futa");
    await page
      .locator('[data-testid="campus-world"][data-ready="true"]')
      .waitFor({ timeout: 30000 });
    // A short visual-settle interval, not performance evidence.
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${out}/futa-${width}x${height}.png` });
    await Promise.all(readTextures);
    const canvas = await page.locator("canvas").boundingBox();
    const defaultZoom = width < 600 ? 0.88 : 1.05;
    // Current crop hair top=-32.5, shoes bottom=20. Source estimate, not a pixel-detected bound.
    const sourceAvatarHeight = 52.5;
    rows.push({
      width,
      height,
      canvas,
      defaultZoom,
      sourceAvatarHeight,
      calculatedAvatarHeight: sourceAvatarHeight * defaultZoom,
      percentCanvasHeight:
        ((sourceAvatarHeight * defaultZoom) / canvas.height) * 100,
      textures,
    });
    await context.close();
  }
  await writeFile(
    `${out}/measurements.json`,
    JSON.stringify(
      {
        browser: await browser.version(),
        method:
          "Local software rendering, DPR 1. Canvas dimensions measured; avatar extent calculated from current source, not pixel segmentation. Not physical-device evidence.",
        rows,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(JSON.stringify(rows));
} finally {
  await browser?.close();
  children.forEach((child) => child.kill());
}
