import { createRequire } from "node:module";
import { mkdir, readFile, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  svg,
  geometry,
  directions,
  looks,
  layers,
  choices,
  palettes,
} from "../../art/characters/m1/student.mjs";
import { gait } from "../../art/characters/m1/forms.mjs";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const masterFirst = process.argv.includes("--master-first");
const root = masterFirst ? "artifacts/m1-master-first" : "art/characters/m1";
const hash = (buffer) => createHash("sha256").update(buffer).digest("hex");
const frames = directions.flatMap((direction) =>
  ["idle", "walk"].flatMap((state) =>
    Array.from({ length: state === "idle" ? 2 : 8 }, (_, index) => ({
      direction,
      state,
      index,
      name: `${direction}-${state}-${index}`,
    })),
  ),
);
await mkdir(`${root}/export`, { recursive: true });
await mkdir(`${root}/source`, { recursive: true });
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
const sourceHash = hash(JSON.stringify(sourceFiles));
function nestedSvg(look, direction, state, frame, prefix, expression = "warm") {
  return svg(look, direction, state, frame, true, expression)
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "")
    .replaceAll('id="', `id="${prefix}-`)
    .replaceAll("url(#", `url(#${prefix}-`);
}
const turnaround = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="2048" height="768"><rect width="100%" height="100%" fill="#e7e5da"/>${directions.map((dir, i) => `<svg x="${i * 512}" width="512" height="768" viewBox="0 0 128 192">${nestedSvg(looks[0], dir, "idle", 0, `turn-${i}`)}</svg>`).join("")}</svg>`;
await writeFile(`${root}/source/master-turnaround.svg`, turnaround);
await writeFile(
  `${root}/export/master-turnaround.png`,
  await sharp(Buffer.from(turnaround)).png().toBuffer(),
);
const expressions = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="1536" height="768"><rect width="100%" height="100%" fill="#e7e5da"/>${["warm", "attentive", "soft"].map((expression, i) => `<svg x="${i * 512}" width="512" height="768" viewBox="0 0 128 192">${nestedSvg(looks[0], "down", "idle", 0, `expression-${i}`, expression)}</svg>`).join("")}</svg>`;
await writeFile(`${root}/source/expression-board.svg`, expressions);
await writeFile(
  `${root}/export/expression-board.png`,
  await sharp(Buffer.from(expressions)).png().toBuffer(),
);
function alphaBounds(data, info) {
  let left = info.width,
    top = info.height,
    right = -1,
    bottom = -1;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] >= 16) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x);
        bottom = Math.max(bottom, y);
      }
  return { x: left, y: top, width: right - left + 1, height: bottom - top + 1 };
}
const atlases = [];
for (let look = 0; look < (masterFirst ? 1 : looks.length); look++) {
  const entries = [];
  const metadata = [];
  for (let i = 0; i < frames.length; i++) {
    const f = frames[i],
      text = svg(looks[look], f.direction, f.state, f.index);
    const image = await sharp(Buffer.from(text)).png().toBuffer();
    const { data, info } = await sharp(
      Buffer.from(svg(looks[look], f.direction, f.state, f.index, false)),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = (i % 8) * geometry.width,
      y = Math.floor(i / 8) * geometry.height;
    entries.push({ input: image, left: x, top: y });
    metadata.push({
      ...f,
      phase: f.state === "walk" ? gait.phases[f.index] : "still-breath",
      x,
      y,
      width: geometry.width,
      height: geometry.height,
      bodyAlpha: alphaBounds(data, info),
      rgbaHash: hash(data),
    });
  }
  const png = await sharp({
    create: { width: 1024, height: 960, channels: 4, background: "#00000000" },
  })
    .composite(entries)
    .png()
    .toBuffer();
  const digest = hash(png),
    name = `look-${look}.${digest.slice(0, 12)}.png`;
  await writeFile(`${root}/export/${name}`, png);
  atlases.push({
    look,
    appearance: looks[look],
    role: look < 4 ? "player-proof" : "fictional-npc-proof",
    path: name,
    hash: digest,
    bytes: png.length,
    width: 1024,
    height: 960,
    rgbaBytes: 1024 * 960 * 4,
    frames: metadata,
  });
}
// The interim native master proof retains the five OLD comparison/NPC atlases.
// It is written only to ignored artifacts and is never the final variant proof.
if (masterFirst) {
  const prior = JSON.parse(
    await readFile("art/characters/m1/export/manifest.json", "utf8"),
  );
  for (const atlas of prior.atlases.slice(1)) {
    await copyFile(
      `art/characters/m1/export/${atlas.path}`,
      `${root}/export/${atlas.path}`,
    );
    atlases.push(atlas);
  }
}
for (const direction of directions) {
  await writeFile(`${root}/source/${direction}.svg`, svg(looks[0], direction));
  await writeFile(
    `${root}/source/${direction}-merged.png`,
    await sharp(Buffer.from(svg(looks[0], direction)))
      .png()
      .toBuffer(),
  );
  const parts = layers(looks[0], direction);
  for (const [name, content] of Object.entries(parts).filter(
    ([name]) => name !== "defs",
  )) {
    const partSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="192">${parts.defs}${content}</svg>`;
    await writeFile(
      `${root}/source/${direction}-${name}.png`,
      await sharp(Buffer.from(partSvg)).png().toBuffer(),
    );
  }
}
// A large native-vector preview, not a separate flattering raster portrait.
const sheet = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="1536" height="1024"><rect width="100%" height="100%" fill="#e7e5da"/>${looks
  .slice(0, 4)
  .flatMap((look, row) =>
    directions.map(
      (direction, col) =>
        `<svg x="${col * 384 + 64}" y="${row * 256}" width="256" height="256" viewBox="0 0 128 192">${svg(
          look,
          direction,
        )
          .replace(/^<svg[^>]*>/, "")
          .replace(/<\/svg>$/, "")
          .replaceAll('id="', `id="r${row}c${col}-`)
          .replaceAll("url(#", `url(#r${row}c${col}-`)}</svg>`,
    ),
  )
  .join("")}</svg>`;
await writeFile(`${root}/source/appearance-board.svg`, sheet);
await writeFile(
  `${root}/export/appearance-board.png`,
  await sharp(Buffer.from(sheet)).png().toBuffer(),
);
await writeFile(
  `${root}/export/close-up.png`,
  await sharp(Buffer.from(svg(looks[0])))
    .resize(512, 768)
    .png()
    .toBuffer(),
);
await writeFile(
  `${root}/export/manifest.json`,
  JSON.stringify(
    {
      status: "M1 VISUAL REVIEW REQUIRED; NOT RUNTIME",
      sourceHash,
      sourceFiles,
      gait,
      version: masterFirst
        ? "m1-layered-2-MASTER-FIRST-old-comparison-variants"
        : "m1-layered-2",
      geometry,
      choices,
      palettes,
      pipeline: {
        sharp: sharp.versions.sharp,
        svgRenderer: sharp.versions.rsvg,
      },
      atlases,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `M1 export: ${atlases.length} looks / ${frames.length} frames each; ${atlases.reduce((sum, item) => sum + item.bytes, 0)} atlas bytes. Human approval pending.`,
);

const colors = Object.entries(palettes).flatMap(([kind, values]) =>
  Object.entries(values).map(([name, color]) => ({
    label: `${kind} / ${name}`,
    color,
  })),
);
const materialSheet = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="360"><rect width="800" height="360" fill="#e7e5da"/>${colors.map((item, index) => `<g transform="translate(${20 + (index % 4) * 195},${20 + Math.floor(index / 4) * 82})"><rect width="165" height="46" rx="5" fill="${item.color}"/><text y="64" font-family="sans-serif" font-size="12" fill="#27362e">${item.label}</text></g>`).join("")}</svg>`;
await writeFile(`${root}/source/material-sheet.svg`, materialSheet);
const walk = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="2048" height="1536"><rect width="100%" height="100%" fill="#e7e5da"/>${directions
  .flatMap((direction, row) =>
    Array.from(
      { length: 8 },
      (_, index) =>
        `<svg x="${index * 256}" y="${row * 384}" width="256" height="384" viewBox="0 0 128 192">${svg(
          looks[0],
          direction,
          "walk",
          index,
        )
          .replace(/^<svg[^>]*>/, "")
          .replace(/<\/svg>$/, "")
          .replaceAll('id="', `id="w${row}f${index}-`)
          .replaceAll("url(#", `url(#w${row}f${index}-`)}</svg>`,
    ),
  )
  .join("")}</svg>`;
await writeFile(`${root}/source/walk-board.svg`, walk);
await writeFile(
  `${root}/export/walk-board.png`,
  await sharp(Buffer.from(walk)).png().toBuffer(),
);
