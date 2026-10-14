import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { exteriorAtlas } from "../../art/exteriors/master.mjs";
const check = process.argv.includes("--check"),
  assets = {};
const source = await readFile("art/exteriors/master.mjs");
const sourceHash = createHash("sha256").update(source).digest("hex");
for (const campus of ["futa", "oau", "unilag"]) {
  const { svg, frames, palette } = exteriorAtlas(campus),
    hash = createHash("sha256").update(svg).digest("hex");
  const path = `/world-assets/exteriors/${campus}-v1.${hash.slice(0, 12)}.svg`;
  if (check) {
    if ((await readFile(`apps/game/public${path}`, "utf8")) !== svg)
      throw Error("EXTERIOR_ASSET_MISMATCH");
  } else {
    await mkdir("apps/game/public/world-assets/exteriors", { recursive: true });
    await writeFile(`apps/game/public${path}`, svg);
  }
  assets[campus] = {
    version: 1,
    worldVersions: [2],
    path,
    hash,
    sourceHash,
    bytes: Buffer.byteLength(svg),
    width: 1024,
    height: 768,
    decodedBytes: 1024 * 768 * 4,
    frames,
    palette,
  };
}
const output = `// Generated from original art/exteriors/master.mjs. Run scripts/art/export-exteriors.mjs.\nexport const exteriorAssets = ${JSON.stringify(assets, null, 2)} as const;\n`;
if (check) {
  if (
    (await readFile("packages/game-engine/src/exterior-assets.ts", "utf8")) !==
    output
  )
    throw Error("EXTERIOR_MANIFEST_MISMATCH");
} else await writeFile("packages/game-engine/src/exterior-assets.ts", output);
console.log(
  "Original exterior v1 source/atlas hashes verified; visual review remains separate.",
);
