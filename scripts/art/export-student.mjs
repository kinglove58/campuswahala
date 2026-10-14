import { createRequire } from "node:module";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { composed } from "../../art/characters/composite.mjs";
import { directions, frame } from "../../art/characters/student-rig.mjs";
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
);
const sharp = nextRequire("sharp");
const look = {
  skin: "deep",
  hair: "crop",
  hairColour: "black",
  top: "lime",
  bottom: "trousers",
  shoes: "white",
  accessory: "backpack",
};
const frames = [];
for (const direction of directions)
  for (const state of ["idle", "walk"])
    for (let index = 0; index < (state === "idle" ? 2 : 6); index++)
      frames.push({ direction, state, index });
const source = await Promise.all(
  ["student-rig.mjs", "composite.mjs"].map((p) =>
    readFile(`art/characters/${p}`),
  ),
);
const sourceHash = createHash("sha256")
  .update(Buffer.concat(source))
  .digest("hex");
const markup = frames
  .map(
    (f, i) =>
      `<g transform="translate(${(i % 8) * frame.width},${Math.floor(i / 8) * frame.height})">${composed(look, f.direction, f.state, f.index).replaceAll('id="', `id="f${i}-`).replaceAll("url(#", `url(#f${i}-`)}</g>`,
  )
  .join("");
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="640">${markup}</svg>`;
await mkdir("art/characters/export", { recursive: true });
await writeFile("art/characters/export/student-proof.svg", svg);
const png = await sharp(Buffer.from(svg)).png().toBuffer();
const hash = createHash("sha256").update(png).digest("hex");
await writeFile(
  `art/characters/export/student-proof.${hash.slice(0, 12)}.png`,
  png,
);
await writeFile(
  "art/characters/export/student-proof.json",
  JSON.stringify(
    {
      status: "ART_REVIEW_REQUIRED",
      sourceHash,
      hash,
      bytes: png.length,
      texture: { width: 1024, height: 640, rgbaBytes: 1024 * 640 * 4 },
      frame,
      pivot: [0.5, 148 / 160],
      appearance: look,
      frames,
      sharp: sharp.versions.sharp,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Original sprite proof: ${frames.length} frames, ${png.length} PNG bytes, ${1024 * 640 * 4} decoded RGBA bytes.`,
);
