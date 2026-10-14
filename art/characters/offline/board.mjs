/** Mechanical contact-sheet packing of original offline renders, not art approval. */
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
);
const sharp = nextRequire("sharp");
const out = "art/characters/offline/proof";
const metadata = JSON.parse(await readFile(`${out}/frames.json`, "utf8"));
const frames = metadata.frames;
const directions = ["down", "left", "up", "right"];
const tiles = [];
for (let row = 0; row < 4; row++)
  for (let col = 0; col < 4; col++)
    tiles.push({
      input: `${out}/${row}-${directions[col]}-idle-0.png`,
      left: 36 + col * 176,
      top: 110 + row * 196,
    });
const header = Buffer.from(
  '<svg width="760" height="960"><text x="30" y="40" font-family="sans-serif" font-size="22" fill="#263f38">CW / REJECTED OFFLINE CHARACTER STUDY</text><text x="30" y="68" font-family="sans-serif" font-size="14" fill="#635e50">Original Blender source · ART REVIEW BLOCKER · no actual-game proof</text></svg>',
);
await sharp({
  create: { width: 760, height: 960, channels: 4, background: "#eee4d0" },
})
  .composite([...tiles, { input: header }])
  .png()
  .toFile(`${out}/review-board.png`);
const walking = [];
for (let row = 0; row < 4; row++)
  for (let frame = 0; frame < 6; frame++)
    walking.push({
      input: `${out}/0-${directions[row]}-walk-${frame}.png`,
      left: frame * 128,
      top: row * 160,
    });
await sharp({
  create: { width: 768, height: 640, channels: 4, background: "#eee4d0" },
})
  .composite(walking)
  .png()
  .toFile(`${out}/walk-board.png`);
let bytes = 0;
for (const frame of frames) {
  const data = await readFile(`${out}/${frame.file}`);
  const image = await sharp(data).metadata();
  if (image.width !== 128 || image.height !== 160 || !image.hasAlpha)
    throw new Error(`Invalid offline frame ${frame.file}`);
  bytes += data.length;
}
await writeFile(
  `${out}/sizes.json`,
  JSON.stringify(
    {
      status: "Rejected art study, not runtime assets or visual acceptance",
      frames: frames.length,
      frameWidth: 128,
      frameHeight: 160,
      encodedFrameBytes: bytes,
      decodedAllFramesRgbaBytes: frames.length * 128 * 160 * 4,
      runtimeTransferBytes: 0,
      runtimeIntegration: false,
    },
    null,
    2,
  ) + "\n",
);
