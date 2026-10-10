import { readFile, readdir } from "node:fs/promises";
import { gzipSync } from "node:zlib";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { createCampusWorld } = require("../packages/game-engine/dist");
for (const campus of ["futa", "oau", "unilag"]) {
  const w = createCampusWorld(campus),
    size = Buffer.byteLength(JSON.stringify(w));
  const compressed = gzipSync(JSON.stringify(w)).length;
  if (compressed > 100 * 1024)
    throw new Error("Compressed manifest budget exceeded");
  let artGzip = 0;
  if (size > 160000) throw new Error("Manifest budget exceeded");
  for (const a of w.assetBundles) {
    const bytes = await readFile(`apps/game/public${a.path}`);
    const gz = gzipSync(bytes).length;
    artGzip += gz;
    if (gz > 350 * 1024) throw new Error("Lazy zone budget exceeded");
    if (
      bytes.length !== a.bytes ||
      createHash("sha256").update(bytes).digest("hex") !== a.hash
    )
      throw new Error("Asset integrity mismatch");
  }
  if (artGzip > 400 * 1024) throw new Error("Art budget exceeded");
  console.log(
    `${campus}: manifest ${size} raw / ${compressed} gzip bytes; all zone art ${artGzip} gzip bytes (conservative initial upper bound)`,
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

const gameFiles = await jsFiles("apps/game/.next/static");
let gameGzip = 0;
for (const file of gameFiles) gameGzip += gzipSync(await readFile(file)).length;
console.log(
  `All game static JavaScript: ${gameGzip} gzip bytes; conservative upper bound including lazy chunks. This is not measured browser transfer.`,
);
if (gameGzip > 650 * 1024)
  throw new Error("Game JavaScript upper-bound budget exceeded");
if (gameGzip + 100 * 1024 + 400 * 1024 > 1.5 * 1024 * 1024)
  throw new Error("First campus budget envelope exceeded");
