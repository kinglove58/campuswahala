import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  choices,
  directions,
  svg,
  geometry,
  looks,
  validateLook,
} from "../../art/characters/m1/student.mjs";
import { gait, pose } from "../../art/characters/m1/forms.mjs";
const require = createRequire(import.meta.url);
const { parseAppearance } = require("../../packages/game-engine/dist");
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const spec = JSON.parse(
  await readFile("art/characters/m1/export/manifest.json", "utf8"),
);
const hash = (data) => createHash("sha256").update(data).digest("hex");
const sourceFiles = await Promise.all(
  ["student.mjs", "forms.mjs"].map(async (path) => ({
    path,
    hash: hash(
      (await readFile(`art/characters/m1/${path}`, "utf8")).replace(
        /\r\n/g,
        "\n",
      ),
    ),
  })),
);
assert.deepEqual(spec.sourceFiles, sourceFiles);
assert.equal(spec.sourceHash, hash(JSON.stringify(sourceFiles)));
assert.deepEqual(spec.gait, gait);
assert.equal(pose("walk", 0).near.phase, "contact");
assert.equal(pose("walk", 4).far.phase, "contact");
assert(pose("walk", 6).near.bend >= 15 && pose("walk", 6).near.lift >= 11);
for (let frame = 0; frame < 4; frame++)
  assert.equal(
    pose("walk", frame).near.travel - pose("walk", frame + 1).near.travel,
    9,
  );
assert.deepEqual(choices, spec.choices);
assert.deepEqual(geometry, spec.geometry);
let combinations = [{}];
for (const [key, values] of Object.entries(choices))
  combinations = combinations.flatMap((look) =>
    values.map((value) => ({ ...look, [key]: value })),
  );
for (const look of combinations) {
  assert.deepEqual(validateLook(look), parseAppearance(look));
  for (const direction of directions)
    for (const [state, frame] of [
      ["idle", 1],
      ["walk", 3],
    ]) {
      const data = svg(look, direction, state, frame);
      assert(!/undefined|NaN|<script|<foreignObject|https:\/\//.test(data));
      assert(
        data.includes('id="head-and-face"') && data.includes('id="near-arm"'),
      );
    }
}
assert.throws(() => svg({ ...looks[0], hair: "unknown" }));
assert.throws(() => svg(looks[0], "diagonal"));
assert.throws(() => svg(looks[0], "walk", 8));
assert.throws(() => svg(looks[0], "down", "idle", 0, true, "untrusted"));
let byteCount = 0;
for (const atlas of spec.atlases) {
  assert.deepEqual(atlas.appearance, looks[atlas.look]);
  const bytes = await readFile(`art/characters/m1/export/${atlas.path}`);
  const image = await sharp(bytes).metadata();
  assert.equal(hash(bytes), atlas.hash);
  assert.equal(bytes.length, atlas.bytes);
  assert.equal(image.width, atlas.width);
  assert.equal(image.height, atlas.height);
  assert(image.hasAlpha);
  const actualCellHashes = [];
  for (const f of atlas.frames)
    actualCellHashes.push(
      hash(
        await sharp(bytes)
          .extract({ left: f.x, top: f.y, width: f.width, height: f.height })
          .ensureAlpha()
          .raw()
          .toBuffer(),
      ),
    );
  assert.equal(
    new Set(actualCellHashes).size,
    40,
    "Packed atlas must contain 40 distinct actual RGBA cells",
  );
  assert.equal(atlas.frames.length, 40);
  assert.equal(
    new Set(atlas.frames.map((f) => f.rgbaHash)).size,
    40,
    "No repeated complete body poses",
  );
  for (const f of atlas.frames) {
    assert(f.x + f.width <= atlas.width && f.y + f.height <= atlas.height);
    assert(
      f.bodyAlpha.y > 0 && f.bodyAlpha.y + f.bodyAlpha.height < geometry.height,
    );
    assert(
      f.bodyAlpha.x > 0 && f.bodyAlpha.x + f.bodyAlpha.width < geometry.width,
    );
  }
  byteCount += atlas.bytes;
}
console.log(
  JSON.stringify({
    status: "technical proof only; visual approval pending",
    appearances: combinations.length,
    facings: 4,
    states: 8,
    framesPerLook: 40,
    looks: 6,
    atlasBytes: byteCount,
    allDecodedBytes: 6 * 1024 * 960 * 4,
    pivot: geometry.foot,
  }),
);

const intakeRoot = "art/characters/inhouse-candidate/proof";
const intake = JSON.parse(
  await readFile(`${intakeRoot}/IMPORT-MANIFEST.json`, "utf8"),
);
assert.equal(
  intake.sourceZipSha256,
  "54a95d22452eb84ee7b88ffaef6e4c346091d20cd351badcd0035d951bac164b",
);
for (const item of intake.files) {
  const bytes = await readFile(`${intakeRoot}/${item.name}`);
  assert.equal(hash(bytes), item.sha256);
  assert.equal(bytes.length, item.bytes);
  if (/cw-student-(down|up|left|right)-walk-\d+\.png/.test(item.name))
    assert((await sharp(bytes).metadata()).hasAlpha);
}
const intakeAtlas = await sharp(
  `${intakeRoot}/cw-student-m1-candidate-atlas.png`,
).metadata();
assert.equal(intakeAtlas.width, 640);
assert.equal(intakeAtlas.height, 720);
console.log(
  `Original intake: ${intake.files.length} retained files verified; standalone room HTML absent from runtime.`,
);
