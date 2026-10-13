/* global window */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve("tsx/package.json"))("esbuild");
const out = "artifacts/m2-production";
await mkdir(`${out}/staging/dist`, { recursive: true });
await esbuild.build({
  entryPoints: ["scripts/art/m2-staging-client.mjs"],
  bundle: true,
  format: "esm",
  platform: "browser",
  outfile: `${out}/staging/dist/client.js`,
  alias: { "@campuswahala/game-engine": "./packages/game-engine/src/index.ts" },
});
const files = new Map([
  ["/client.js", [`${out}/staging/dist/client.js`, "text/javascript"]],
  [
    "/phaser.js",
    [
      require.resolve("phaser/dist/phaser.min.js", { paths: ["apps/game"] }),
      "text/javascript",
    ],
  ],
]);
const manifest = JSON.parse(
  await readFile(
    "art/characters/m1/painted-campus/export/manifest.json",
    "utf8",
  ),
);
for (const a of manifest.atlases)
  files.set(
    `/character-assets/b-${manifest.sourceHash.slice(0, 12)}/${a.path}`,
    [
      `apps/game/public/character-assets/b-${manifest.sourceHash.slice(0, 12)}/${a.path}`,
      "image/png",
    ],
  );
const server = createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'none'; base-uri 'none'; frame-ancestors 'none'",
  );
  try {
    if (req.method !== "GET") {
      res.writeHead(405);
      res.end();
      return;
    }
    if (req.url === "/") {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(
        '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width,initial-scale=1"><title>M2 indoor camera TEST STAGING</title><style>body{margin:0;background:#243a30;color:#fff;font:12px system-ui}header{height:48px;padding:6px 10px;box-sizing:border-box}canvas{display:block}</style><header><strong>M2 INDOOR CAMERA TEST STAGING</strong><br>Not production gameplay. No M4 room or authority.</header><main id="stage"></main><script src="/phaser.js"></script><script type="module" src="/client.js"></script></html>',
      );
      return;
    }
    const file = files.get(req.url);
    if (!file) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.setHeader("Content-Type", file[1]);
    res.end(await readFile(file[0]));
  } catch {
    res.writeHead(500);
    res.end("STAGING_ASSET_UNAVAILABLE");
  }
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", resolve);
});
const browser = await chromium.launch();
try {
  const page = await browser.newPage({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 1,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.waitForFunction(() => window.__cwM2stage?.ready);
  const sample = await page.evaluate(() => window.__cwM2stage);
  const ratio = sample.bodyPixels / sample.canvas.height;
  assert(ratio >= 0.1 && ratio <= 0.14);
  assert.deepEqual(errors, []);
  sample.canvasDOM = await page.locator("canvas").boundingBox();
  await page.screenshot({
    path: `${out}/indoor-camera-test-staging-360x800.png`,
  });
  await writeFile(
    `${out}/indoor-camera-test-staging.json`,
    JSON.stringify(sample, null, 2),
  );
  console.log(
    `M2 indoor camera staging: ${(ratio * 100).toFixed(2)}% body/canvas; production renderer, no M4 room.`,
  );
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
