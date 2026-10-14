/** Compare exact reviewer-rejected commit exports with the current SAME source rig.
 * This is a labeled authoring sheet, never a generated/fake gameplay screenshot.
 */
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const root = "art/characters/m1";
const before = JSON.parse(
  await readFile(`${root}/comparison/before-manifest.json`, "utf8"),
);
for (const file of before.files) {
  const data = await readFile(`${root}/comparison/${file.path}`);
  assert.equal(data.length, file.bytes);
  assert.equal(createHash("sha256").update(data).digest("hex"), file.sha256);
}
const banner = (width, before, after) =>
  Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="44"><rect width="100%" height="44" fill="#e7e5da"/><g font-family="sans-serif" font-size="18" fill="#26392f"><text x="18" y="29">${before}</text><text x="${width / 2 + 18}" y="29">${after}</text></g></svg>`,
  );
await writeFile(
  `${root}/comparison/face-before-after.png`,
  await sharp({
    create: { width: 1024, height: 812, channels: 4, background: "#e7e5da" },
  })
    .composite([
      {
        input: banner(
          1024,
          "BEFORE: rejected 12248aa",
          "AFTER: M1 candidate, approval pending",
        ),
        left: 0,
        top: 0,
      },
      {
        input: `${root}/comparison/before-master-close-up.png`,
        left: 0,
        top: 44,
      },
      { input: `${root}/export/close-up.png`, left: 512, top: 44 },
    ])
    .png()
    .toBuffer(),
);
await writeFile(
  `${root}/comparison/walk-before-after.png`,
  await sharp({
    create: { width: 4096, height: 1580, channels: 4, background: "#e7e5da" },
  })
    .composite([
      {
        input: banner(
          4096,
          "BEFORE: rejected 12248aa; down / up / left / right",
          "AFTER: contact / plant / passing / push-off / opposite contact / lift / passing / lower",
        ),
        left: 0,
        top: 0,
      },
      { input: `${root}/comparison/before-walk-board.png`, left: 0, top: 44 },
      { input: `${root}/export/walk-board.png`, left: 2048, top: 44 },
    ])
    .png()
    .toBuffer(),
);
console.log(
  "M1 before/after face and four-direction contact sheets: prior byte hashes verified; authoring comparisons, not game captures.",
);
