import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { createCampusWorld } = require("../packages/game-engine/dist");
for (const campus of ["futa", "oau", "unilag"]) {
  const w = createCampusWorld(campus),
    size = Buffer.byteLength(JSON.stringify(w));
  if (size > 160000) throw new Error("Manifest budget exceeded");
  for (const a of w.assetBundles) {
    const bytes = await readFile(`apps/game/public${a.path}`);
    if (
      bytes.length !== a.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== a.hash
    )
      throw new Error("Asset integrity mismatch");
  }
  console.log(
    `${campus}: manifest ${size} bytes; initial art ${w.assetBundles[0].bytes} bytes`,
  );
}
async function jsFiles(dir) {
  let files = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) files = files.concat(await jsFiles(p));
    else if (p.endsWith(".js")) files.push(p);
  }
  return files;
}
const marketing = await jsFiles("apps/marketing/.next/static");
for (const f of marketing) {
  if (/Phaser\.Game|Phaser v|phaser\.io/.test(await readFile(f, "utf8")))
    throw new Error("Phaser leaked into marketing");
}
const world = await readFile("apps/game/app/world.tsx", "utf8");
if (!/import\(['"]phaser['"]\)/.test(world))
  throw new Error("Phaser must remain dynamically imported");
console.log(
  "Marketing has no Phaser runtime; game imports Phaser lazily. FPS is not benchmarked by this check.",
);
