import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import {
  svg,
  layers,
  pose,
  layerNames,
  looks,
  choices,
  authoring,
  combinations,
  validateLook,
  gait,
  geometry,
  directions,
} from "../../art/characters/m1/painted-campus/student.mjs";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const { parseAppearance } = require("../../packages/game-engine/dist");
const root = "art/characters/m1/painted-campus",
  hash = (b) => createHash("sha256").update(b).digest("hex");
const spec = JSON.parse(await readFile(`${root}/export/manifest.json`, "utf8"));
const sourceFiles = await Promise.all(
  ["student.mjs", "appearance.mjs"].map(async (path) => ({
    path,
    hash: hash(
      (await readFile(`${root}/${path}`, "utf8")).replace(/\r\n/g, "\n"),
    ),
  })),
);
assert.deepEqual(spec.sourceFiles, sourceFiles);
assert.equal(spec.sourceHash, hash(JSON.stringify(sourceFiles)));
assert.deepEqual(spec.authoring, authoring);
assert.equal(authoring.direction, "B - Painted Campus");
assert.equal(authoring.finalVisualApproval, false);
assert.equal(authoring.runtimeIntegrated, false);
assert.equal(spec.paintedCampus, true);
assert.equal(spec.selectionProof, false);
assert.deepEqual(spec.choices, choices);
assert.deepEqual(spec.geometry, geometry);
assert.deepEqual(spec.gait, gait);
assert.equal(spec.atlases.length, 6);
assert.equal(looks.length, 6);
assert.throws(() => svg({ ...looks[0], hair: "unknown" }));
assert.throws(() => svg({ ...looks[0], extra: 1 }));
assert.throws(() => svg(looks[0], "diagonal"));
assert.throws(() => svg(looks[0], "down", "walk", 8));
assert.equal(pose("right", "walk", 0).near.lift, 0);
assert.equal(pose("right", "walk", 4).far.lift, 0);
assert(pose("right", "walk", 6).near.knee >= 15);
for (let frame = 0; frame < 3; frame++)
  assert.equal(gait.travel[frame] - gait.travel[frame + 1], 8);
function assertBodyBounds(data) {
  let x = 128,
    y = 192,
    r = -1,
    b = -1;
  for (let j = 0; j < 192; j++)
    for (let i = 0; i < 128; i++)
      if (data[(j * 128 + i) * 4 + 3] >= 16) {
        x = Math.min(x, i);
        y = Math.min(y, j);
        r = Math.max(r, i);
        b = Math.max(b, j);
      }
  assert(
    x > 0 && y > 0 && r < 127 && b < 191 && b - y > 120,
    "Head, hands, bag or swing foot clipped / empty figure",
  );
  return { x, y, width: r - x + 1, height: b - y + 1 };
}
const all = combinations();
assert.equal(all.length, 768);
// All current values are rendered and alpha-checked in all four facings, without
// writing 768 atlases. An additional swing pose checks source assembly per value.
for (let offset = 0; offset < all.length; offset += 8)
  await Promise.all(
    all.slice(offset, offset + 8).map(async (look) => {
      assert.deepEqual(validateLook(look), parseAppearance(look));
      for (const dir of directions) {
        for (const [state, index] of [
          ["idle", 0],
          ["walk", 3],
        ]) {
          const text = svg(look, dir, state, index, false);
          assert(!/undefined|NaN|<script|<foreignObject|https:\/\//.test(text));
          assert.equal(
            (text.match(/inkscape:groupmode="layer"/g) || []).length,
            13,
          );
        }
        const data = await sharp(Buffer.from(svg(look, dir, "idle", 0, false)))
          .ensureAlpha()
          .raw()
          .toBuffer();
        assertBodyBounds(data);
      }
    }),
  );
let bytes = 0;
const atlases = [];
for (const atlas of spec.atlases) {
  assert.deepEqual(atlas.appearance, looks[atlas.look]);
  assert.equal(atlas.frames.length, 40);
  assert.equal(
    atlas.role,
    atlas.look < 4 ? "player-proof" : "fictional-npc-proof",
  );
  const png = await readFile(`${root}/export/${atlas.path}`),
    meta = await sharp(png).metadata();
  assert.equal(hash(png), atlas.hash);
  assert.equal(png.length, atlas.bytes);
  bytes += png.length;
  assert.equal(meta.width, 1024);
  assert.equal(meta.height, 960);
  assert(meta.hasAlpha);
  const cells = [];
  for (const frame of atlas.frames) {
    const { direction, state, index, x, y, width, height } = frame;
    const actual = await sharp(png)
      .extract({ left: x, top: y, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    const authoredPng = await sharp(
      Buffer.from(svg(atlas.appearance, direction, state, index)),
    )
      .png()
      .toBuffer();
    const authored = await sharp({
      create: { width: 128, height: 192, channels: 4, background: "#00000000" },
    })
      .composite([{ input: authoredPng, left: 0, top: 0 }])
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(
      hash(actual),
      hash(authored),
      "Packed pixels must equal selected B source through the documented PNG packing step",
    );
    const body = await sharp(
      Buffer.from(svg(atlas.appearance, direction, state, index, false)),
    )
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(hash(body), frame.rgbaHash);
    assert.deepEqual(assertBodyBounds(body), frame.bodyAlpha);
    cells.push(hash(actual));
    if (state === "walk") {
      assert.equal(frame.contacts.length, 2);
      assert(
        frame.contacts.some((c) => c.planted) || index === 3 || index === 7,
      );
    }
  }
  assert.equal(new Set(cells).size, 40);
  assert.equal(new Set(atlas.frames.map((f) => f.rgbaHash)).size, 40);
  atlases.push(atlas.hash);
}
assert.equal(new Set(atlases).size, 6);
const noBag = layers({ ...looks[0], accessory: "none" });
assert.equal(noBag["back-accessory"], "");
assert.equal(noBag["backpack-or-straps"], "");
assert.notEqual(
  layers({ ...looks[0], hair: "afro" })["hair-or-covering"],
  layers({ ...looks[0], hair: "braids" })["hair-or-covering"],
);
const shadow = layers(looks[0], "right", "walk", 0)["ground-shadow"];
assert(shadow.startsWith('<ellipse cx="64" cy="177"'));
assert.notEqual(shadow, layers(looks[0], "right", "walk", 6)["ground-shadow"]);
assert.equal(layerNames.length, 13);
execFileSync(
  process.env.CW_PYTHON_EXECUTABLE || "python",
  [
    "-c",
    String.raw`
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import hashlib,json
r=Path("art/characters/m1/painted-campus/source")
with ZipFile(r/"master.ora") as z:
 assert z.read("mimetype")==b"image/openraster" and z.infolist()[0].compress_type==0
 assert len(ET.fromstring(z.read("stack.xml")).findall(".//layer"))==52
 for item in json.loads((r/"openraster-manifest.json").read_text())["files"]:
  data=z.read(item["path"])
  assert hashlib.sha256(data).hexdigest()==item["sha256"]
  assert data==(r/Path(item["path"]).name).read_bytes()
 assert z.read("mergedimage.png")== (r/"down-merged.png").read_bytes()
`,
  ],
  { stdio: "pipe" },
);
console.log(
  JSON.stringify({
    status: "B technical integrity PASS; final M1 visual approval OPEN",
    appearances: 768,
    rgbaFacingChecks: 3072,
    assembledPoseChecks: 6144,
    playerLooks: 4,
    npcLooks: 2,
    distinctExportedPoses: 240,
    semanticOraLayers: 52,
    atlasBytes: bytes,
    sourceHash: spec.sourceHash,
    decodedSteady: 11796480,
    decodedSwitchPeak: 15728640,
    foot: geometry.foot,
  }),
);
