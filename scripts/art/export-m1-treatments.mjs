import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  svg,
  geometry,
  directions,
  options,
  appearance,
  gait,
  layerNames,
} from "../../art/characters/m1/treatments/master.mjs";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const root = "art/characters/m1/treatments";
const hash = (data) => createHash("sha256").update(data).digest("hex");
const sourceFiles = await Promise.all(
  ["master.mjs"].map(async (path) => ({
    path,
    hash: hash(
      (await readFile(`${root}/${path}`, "utf8")).replace(/\r\n/g, "\n"),
    ),
  })),
);
const sourceHash = hash(JSON.stringify(sourceFiles));
const nested = (option, dir, state, frame, prefix) =>
  svg(option, dir, state, frame)
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "")
    .replaceAll('id="', `id="${prefix}-`)
    .replaceAll("url(#", `url(#${prefix}-`);
await mkdir(`${root}/comparisons`, { recursive: true });
let rows = "";
for (const [row, option] of options.entries()) {
  await mkdir(`${root}/${option}/source`, { recursive: true });
  await mkdir(`${root}/${option}/export`, { recursive: true });
  const heading = `${option.toUpperCase()} - ${option === "a" ? "Sculpted campus" : "Painted campus"} / ORIGINAL SELECTION STUDY - NOT APPROVED`;
  const cells = directions
    .map(
      (dir, i) =>
        `<text x="${i * 512 + 256}" y="55" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#47594d">${dir.toUpperCase()}</text><svg x="${i * 512}" y="65" width="512" height="768" viewBox="0 0 128 192">${nested(option, dir, "idle", 0, `${option}${i}`)}</svg>`,
    )
    .join("");
  const board = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="2048" height="850"><rect width="100%" height="100%" fill="#e9e7da"/><text x="32" y="28" font-family="sans-serif" font-size="20" fill="#273b31">${heading}</text>${cells}</svg>`;
  await writeFile(`${root}/${option}/source/four-facing.svg`, board);
  await writeFile(
    `${root}/${option}/export/four-facing.png`,
    await sharp(Buffer.from(board)).png().toBuffer(),
  );
  rows += `<g transform="translate(0 ${row * 850})"><text x="32" y="28" font-family="sans-serif" font-size="20" fill="#273b31">${heading}</text>${cells}</g>`;
  for (const dir of directions)
    await writeFile(`${root}/${option}/source/${dir}.svg`, svg(option, dir));
}
const comparison = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="2048" height="1700"><rect width="100%" height="100%" fill="#e9e7da"/>${rows}</svg>`;
await writeFile(`${root}/comparisons/four-facing-a-b.svg`, comparison);
await writeFile(
  `${root}/comparisons/four-facing-a-b.png`,
  await sharp(Buffer.from(comparison)).png().toBuffer(),
);
if (process.argv.includes("--stills")) {
  console.log(
    "Two master stills exported; no Appearance variants or walking atlases generated.",
  );
  process.exit(0);
}
function bounds(data, info) {
  let x = info.width,
    y = info.height,
    right = -1,
    bottom = -1;
  for (let j = 0; j < info.height; j++)
    for (let i = 0; i < info.width; i++)
      if (data[(j * info.width + i) * 4 + 3] >= 16) {
        x = Math.min(x, i);
        y = Math.min(y, j);
        right = Math.max(right, i);
        bottom = Math.max(bottom, j);
      }
  return { x, y, width: right - x + 1, height: bottom - y + 1 };
}
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
for (const option of options) {
  const entries = [],
    metadata = [];
  for (const [i, frame] of frames.entries()) {
    const { direction, state, index } = frame;
    const png = await sharp(Buffer.from(svg(option, direction, state, index)))
      .png()
      .toBuffer();
    const { data, info } = await sharp(
      Buffer.from(svg(option, direction, state, index, false)),
    )
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const x = (i % 8) * 128,
      y = Math.floor(i / 8) * 192;
    entries.push({ input: png, left: x, top: y });
    metadata.push({
      ...frame,
      x,
      y,
      width: 128,
      height: 192,
      phase: state === "walk" ? gait.phases[index] : "still-breath",
      bodyAlpha: bounds(data, info),
      rgbaHash: hash(data),
    });
  }
  const png = await sharp({
    create: { width: 1024, height: 960, channels: 4, background: "#00000000" },
  })
    .composite(entries)
    .png()
    .toBuffer();
  // Stable file name avoids accumulating stale unapproved atlas files on reruns.
  const atlas = {
    look: 0,
    appearance,
    role: "single-master-selection-only",
    path: "master.png",
    hash: hash(png),
    bytes: png.length,
    width: 1024,
    height: 960,
    rgbaBytes: 1024 * 960 * 4,
    frames: metadata,
  };
  await writeFile(`${root}/${option}/export/master.png`, png);
  await writeFile(
    `${root}/${option}/export/manifest.json`,
    JSON.stringify(
      {
        status: "M1 A/B VISUAL SELECTION REQUIRED; NOT RUNTIME",
        selectionProof: true,
        treatment: option,
        version: "m1-selection-1",
        sourceFiles,
        sourceHash,
        geometry,
        gait,
        directions,
        atlases: [atlas],
      },
      null,
      2,
    ) + "\n",
  );
  for (const direction of directions) {
    await writeFile(
      `${root}/${option}/source/${direction}-merged.png`,
      await sharp(Buffer.from(svg(option, direction)))
        .png()
        .toBuffer(),
    );
    for (const layer of layerNames)
      await writeFile(
        `${root}/${option}/source/${direction}-${layer}.png`,
        await sharp(Buffer.from(svg(option, direction, "idle", 0, true, layer)))
          .png()
          .toBuffer(),
      );
    const contact = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="2048" height="416"><rect width="100%" height="100%" fill="#e9e7da"/>${Array.from({ length: 8 }, (_, i) => `<svg x="${i * 256}" y="0" width="256" height="384" viewBox="0 0 128 192">${nested(option, direction, "walk", i, `${option}${direction}${i}`)}</svg><text x="${i * 256 + 128}" y="403" text-anchor="middle" font-family="sans-serif" font-size="14">${i}: ${gait.phases[i]}</text>`).join("")}</svg>`;
    await writeFile(`${root}/${option}/source/${direction}-gait.svg`, contact);
    await writeFile(
      `${root}/${option}/export/${direction}-gait.png`,
      await sharp(Buffer.from(contact)).png().toBuffer(),
    );
  }
}
console.log(
  `Exported 2 single-look masters, ${frames.length * 2} total frames; no Appearance permutations / NPC atlases.`,
);
