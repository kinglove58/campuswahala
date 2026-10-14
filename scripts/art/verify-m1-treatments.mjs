import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import {
  svg,
  pose,
  layers,
  layerNames,
  geometry,
  directions,
  gait,
  appearance,
} from "../../art/characters/m1/treatments/master.mjs";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const { parseAppearance } = require("../../packages/game-engine/dist");
const root = "art/characters/m1/treatments",
  hash = (d) => createHash("sha256").update(d).digest("hex");
assert.deepEqual(parseAppearance(appearance), appearance);
assert.throws(() => svg("untrusted"));
assert.throws(() => svg("a", "diagonal"));
assert.throws(() => svg("a", "down", "walk", 8));
assert.throws(() => svg("a", "down", "idle", 0, true, "unknown"));
assert.deepEqual(geometry.foot, { x: 64, y: 177 });
assert.equal(gait.fps, 8);
for (const direction of directions) {
  assert.equal(pose(direction, "walk", 0).near.lift, 0);
  assert.equal(pose(direction, "walk", 4).far.lift, 0);
  assert(pose(direction, "walk", 6).near.lift >= 11);
  for (let frame = 0; frame < 3; frame++)
    assert.equal(
      pose(direction, "walk", frame).near.travel -
        pose(direction, "walk", frame + 1).near.travel,
      8,
    );
}
const sourceFiles = [
  {
    path: "master.mjs",
    hash: hash(
      (await readFile(`${root}/master.mjs`, "utf8")).replace(/\r\n/g, "\n"),
    ),
  },
];
let bytes = 0;
const optionHashes = [];
for (const option of ["a", "b"]) {
  const spec = JSON.parse(
    await readFile(`${root}/${option}/export/manifest.json`, "utf8"),
  );
  assert.equal(spec.selectionProof, true);
  assert.equal(spec.treatment, option);
  assert.deepEqual(spec.sourceFiles, sourceFiles);
  assert.equal(spec.sourceHash, hash(JSON.stringify(sourceFiles)));
  assert.deepEqual(spec.geometry, geometry);
  assert.deepEqual(spec.gait, gait);
  assert.equal(spec.atlases.length, 1, "No variants before master selection");
  const atlas = spec.atlases[0],
    png = await readFile(`${root}/${option}/export/${atlas.path}`);
  assert.equal(atlas.path, "master.png");
  assert.deepEqual(atlas.appearance, appearance);
  assert.equal(hash(png), atlas.hash);
  assert.equal(png.length, atlas.bytes);
  const meta = await sharp(png).metadata();
  assert(meta.hasAlpha);
  assert.equal(meta.width, 1024);
  assert.equal(meta.height, 960);
  assert.equal(atlas.frames.length, 40);
  bytes += png.length;
  const cellHashes = [];
  for (const frame of atlas.frames) {
    const { direction, state, index, x, y, width, height } = frame;
    assert.equal(frame.name, `${direction}-${state}-${index}`);
    const text = svg(option, direction, state, index);
    assert(!/undefined|NaN|<script|<foreignObject|https:\/\//.test(text));
    assert.equal((text.match(/inkscape:groupmode="layer"/g) || []).length, 13);
    assert.deepEqual(Object.keys(layers(option, direction, state, index)), [
      "defs",
      ...layerNames,
    ]);
    const actual = await sharp(png)
      .extract({ left: x, top: y, width, height })
      .ensureAlpha()
      .raw()
      .toBuffer();
    cellHashes.push(hash(actual));
    // Match the documented PNG src-over packing step. Direct SVG raw pixels have
    // different RGB rounding under translucent edges (premultiplied alpha).
    const authoredPng = await sharp(Buffer.from(text)).png().toBuffer();
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
      "Committed cell must match current editable source pixels",
    );
    const body = await sharp(
      Buffer.from(svg(option, direction, state, index, false)),
    )
      .ensureAlpha()
      .raw()
      .toBuffer();
    assert.equal(hash(body), frame.rgbaHash);
    const b = frame.bodyAlpha;
    assert(
      b.x > 0 && b.y > 0 && b.x + b.width < 128 && b.y + b.height < 192,
      "No cropped hands, head or swing foot",
    );
    for (let i = 3; i < actual.length; i += 4)
      if (actual[i]) {
        assert(Number.isFinite(actual[i]));
      }
  }
  assert.equal(
    new Set(cellHashes).size,
    40,
    "Actual packed pixels, not pose labels, must be distinct",
  );
  assert.equal(new Set(atlas.frames.map((f) => f.rgbaHash)).size, 40);
  optionHashes.push(hash(png));
  // Identity shadow is fixed; per-foot contact shadows respond to lift independently.
  const a = layers(option, "right", "walk", 0)["ground-shadow"],
    b = layers(option, "right", "walk", 6)["ground-shadow"];
  assert(a.startsWith('<ellipse cx="64" cy="177"'));
  assert(b.startsWith('<ellipse cx="64" cy="177"'));
  assert.notEqual(a, b);
}
assert.notEqual(optionHashes[0], optionHashes[1]);
// Inspect actual ZIP contents and editable parts, not just manifest layer counts.
execFileSync(
  process.env.CW_PYTHON_EXECUTABLE || "python",
  [
    "-c",
    String.raw`
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as ET
import hashlib, json
root=Path("art/characters/m1/treatments")
for option in ["a","b"]:
    with ZipFile(root/option/"source/master.ora") as z:
        assert z.read("mimetype")==b"image/openraster"
        assert z.infolist()[0].filename=="mimetype" and z.infolist()[0].compress_type==0
        stack=ET.fromstring(z.read("stack.xml"))
        assert stack.attrib["w"]=="128" and stack.attrib["h"]=="192"
        assert len(stack.findall(".//layer"))==52
        for item in json.loads((root/option/"source/openraster-manifest.json").read_text())["files"]:
            data=z.read(item["path"])
            assert hashlib.sha256(data).hexdigest()==item["sha256"]
            assert data==(root/option/"source"/Path(item["path"]).name).read_bytes()
        assert z.read("mergedimage.png")== (root/option/"source/down-merged.png").read_bytes()
`,
  ],
  { stdio: "pipe" },
);
console.log(
  JSON.stringify({
    status: "technical integrity PASS; visual selection pending",
    masters: 2,
    appearanceVariants: 0,
    npcAtlases: 0,
    actualDistinctFrames: 80,
    editablePartLayers: 104,
    sourceHash: hash(JSON.stringify(sourceFiles)),
    atlasBytes: bytes,
    decodedPerOption: 3932160,
    foot: geometry.foot,
  }),
);
