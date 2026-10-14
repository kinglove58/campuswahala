import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
);
const sharp = nextRequire("sharp");
const metadata = JSON.parse(
  await readFile("art/characters/export/student-proof.json", "utf8"),
);
const source = await Promise.all(
  ["student-rig.mjs", "composite.mjs"].map((p) =>
    readFile(`art/characters/${p}`),
  ),
);
assert.equal(
  createHash("sha256").update(Buffer.concat(source)).digest("hex"),
  metadata.sourceHash,
  "Source/export drift",
);
const png = await readFile(
  `art/characters/export/student-proof.${metadata.hash.slice(0, 12)}.png`,
);
assert.equal(
  createHash("sha256").update(png).digest("hex"),
  metadata.hash,
  "PNG integrity",
);
assert.equal(png.length, metadata.bytes);
const image = await sharp(png).metadata();
assert.equal(image.width, 1024);
assert.equal(image.height, 640);
assert.equal(image.hasAlpha, true);
assert.equal(metadata.frames.length, 32);
assert.equal(
  new Set(metadata.frames.map((f) => `${f.direction}-${f.state}`)).size,
  8,
);
assert.equal(
  new Set(metadata.frames.map((f) => `${f.direction}-${f.state}-${f.index}`))
    .size,
  32,
);
for (let i = 0; i < 32; i++) {
  const cell = await sharp(png)
    .extract({
      left: (i % 8) * 128,
      top: Math.floor(i / 8) * 160,
      width: 128,
      height: 160,
    })
    .ensureAlpha()
    .raw()
    .toBuffer();
  let count = 0,
    last = -1;
  for (let p = 3; p < cell.length; p += 4)
    if (cell[p] > 32) {
      count++;
      last = Math.floor(p / 4 / 128);
    }
  assert(count > 900, `Empty/near-empty frame ${i}`);
  assert(last >= 144 && last <= 154, `Ground anchor drift frame ${i}: ${last}`);
}
console.log(
  "Proof integrity, alpha, 32 frames / 8 states and bounded ground anchors passed. This does not establish visual quality or runtime acceptance.",
);
