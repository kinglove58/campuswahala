import { createServer } from "node:http";
import { createRequire } from "node:module";
import { readFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { directions } from "../../art/characters/m1/student.mjs";
const require = createRequire(import.meta.url);
/** Fixed-whitelist, loopback, non-runtime art laboratory. No account/API paths. */
export async function startProof({
  masterFirst = false,
  treatment = null,
  paintedCampus = false,
} = {}) {
  if (treatment !== null && !["a", "b"].includes(treatment))
    throw new Error("INVALID_M1_SELECTION_TREATMENT");
  const exportRoot = paintedCampus
    ? masterFirst
      ? "artifacts/m1-painted-master/export"
      : "art/characters/m1/painted-campus/export"
    : treatment
      ? `art/characters/m1/treatments/${treatment}/export`
      : masterFirst
        ? "artifacts/m1-master-first/export"
        : "art/characters/m1/export";
  const {
    createCampusWorld,
    validateWorld,
  } = require("../../packages/game-engine/dist");
  const esbuild = createRequire(require.resolve("tsx/package.json"))("esbuild");
  await mkdir("artifacts/m1-proof/dist", { recursive: true });
  await esbuild.build({
    entryPoints: ["art/characters/m1/proof-client.mjs"],
    bundle: true,
    format: "esm",
    platform: "browser",
    outfile: "artifacts/m1-proof/dist/proof.js",
  });
  const spec = JSON.parse(
    await readFile(`${exportRoot}/manifest.json`, "utf8"),
  );
  spec.world = validateWorld(createCampusWorld("futa"));
  spec.directions = directions;
  const lookOptions = paintedCampus
    ? spec.selectionProof
      ? '<option value="0">B master</option>'
      : '<option value="0">Crop / lime</option><option value="1">Braids / blue</option><option value="2">Covered / clay</option><option value="3">Afro / blue</option>'
    : treatment
      ? `<option value="0">Master ${treatment.toUpperCase()}</option>`
      : '<option value="0">Crop / lime</option><option value="1">Braids / blue</option><option value="2">Covered / clay</option><option value="3">Afro / blue</option>';
  const files = new Map([
    ["/proof.js", ["artifacts/m1-proof/dist/proof.js", "text/javascript"]],
    [
      "/phaser.js",
      [
        require.resolve("phaser/dist/phaser.min.js", { paths: ["apps/game"] }),
        "text/javascript",
      ],
    ],
    ...spec.atlases.map((a) => [
      `/atlas/${a.path}`,
      [`${exportRoot}/${a.path}`, "image/png"],
    ]),
    ...spec.world.assetBundles.map((a) => [
      a.path,
      [`apps/game/public${a.path}`, "image/svg+xml"],
    ]),
  ]);
  const markup = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>CW M1 Phaser art laboratory — unapproved</title><style>html,body{margin:0;background:#172b26;font:12px system-ui;color:#fff}header{height:69px;box-sizing:border-box;padding:5px 8px;background:#213d33}strong{display:block;font-size:11px;white-space:nowrap}select{font:12px system-ui;margin:4px 3px 2px 0;max-width:110px;background:#faf1dc;color:#203c31;border:0;border-radius:3px;padding:3px}#metrics{font-size:10px;color:#dfdfb5}canvas{display:block}</style><header><strong>CampusWahala · M1 ${paintedCampus ? "B Painted" : treatment ? treatment.toUpperCase() + " selection" : "art"} lab · NOT production</strong><label>Look <select id="look">${lookOptions}</select></label><label>Face <select id="direction">${directions.map((d) => `<option>${d}</option>`).join("")}</select></label><label>Pose <select id="motion"><option>idle</option><option>walk</option></select></label><div id="metrics">Opening original art proof…</div></header><main id="world" aria-label="Phaser M1 cosmetic character proof; arrow keys or tap to move"></main><script src="/phaser.js"></script><script type="module" src="/proof.js"></script></html>`;
  const server = createServer(async (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'",
    );
    try {
      if (req.method !== "GET") {
        res.writeHead(405);
        res.end();
        return;
      }
      if (req.url === "/") {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end(markup);
        return;
      }
      if (req.url === "/spec.json") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(spec));
        return;
      }
      const asset = files.get(req.url);
      if (!asset) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.setHeader("Content-Type", asset[1]);
      res.end(await readFile(asset[0]));
    } catch {
      res.writeHead(500);
      res.end("PROOF_ASSET_UNAVAILABLE");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    server,
    port: server.address().port,
    spec,
    scriptDirectory: dirname(import.meta.url),
  };
}
