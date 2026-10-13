import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  svg,
  layers,
  geometry,
  directions,
  gait,
  layerNames,
  looks,
  choices,
  authoring,
} from "../../art/characters/m1/painted-campus/student.mjs";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const root = "art/characters/m1/painted-campus";
const masterFirst = process.argv.includes("--master-first");
const target = masterFirst ? "artifacts/m1-painted-master" : root;
const hash = (b) => createHash("sha256").update(b).digest("hex");
const sourceFiles = await Promise.all(
  ["student.mjs", "appearance.mjs"].map(async (path) => ({
    path,
    hash: hash(
      (await readFile(`${root}/${path}`, "utf8")).replace(/\r\n/g, "\n"),
    ),
  })),
);
const sourceHash = hash(JSON.stringify(sourceFiles));
const nested = (look, dir, state, frame, id) =>
  svg(look, dir, state, frame)
    .replace(/^<svg[^>]*>/, "")
    .replace(/<\/svg>$/, "")
    .replaceAll('id="', `id="${id}-`)
    .replaceAll("url(#", `url(#${id}-`);
const board = (rows) =>
  `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="2048" height="${rows.length * 850}"><rect width="100%" height="100%" fill="#e9e7da"/>${rows.map(({ look, label }, row) => `<text x="32" y="${row * 850 + 28}" font-family="sans-serif" font-size="20" fill="#273b31">B - PAINTED CAMPUS / ${label} / FINAL VISUAL REVIEW REQUIRED</text>${directions.map((dir, col) => `<text x="${col * 512 + 256}" y="${row * 850 + 55}" font-family="sans-serif" font-size="20" text-anchor="middle" fill="#47594d">${dir.toUpperCase()}</text><svg x="${col * 512}" y="${row * 850 + 65}" width="512" height="768" viewBox="0 0 128 192">${nested(look, dir, "idle", 0, `r${row}c${col}`)}</svg>`).join("")}`).join("")}</svg>`;
await mkdir(`${target}/export`, { recursive: true });
await mkdir(`${target}/source`, { recursive: true });
const turnaround = board([
  { look: looks[0], label: "refined selected master" },
]);
await writeFile(`${target}/source/master-turnaround.svg`, turnaround);
await writeFile(
  `${target}/export/master-turnaround.png`,
  await sharp(Buffer.from(turnaround)).png().toBuffer(),
);
if (process.argv.includes("--stills")) {
  console.log(
    "B-only four-facing master still; no Appearance atlases generated.",
  );
  process.exit(0);
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
function bounds(data, info) {
  let x = 128,
    y = 192,
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
const atlases = [];
for (let look = 0; look < (masterFirst ? 1 : looks.length); look++) {
  const entries = [],
    metadata = [];
  for (const [i, frame] of frames.entries()) {
    const { direction, state, index } = frame;
    const png = await sharp(
      Buffer.from(svg(looks[look], direction, state, index)),
    )
      .png()
      .toBuffer();
    const { data, info } = await sharp(
      Buffer.from(svg(looks[look], direction, state, index, false)),
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
      contacts:
        state === "walk"
          ? ["near", "far"].map((leg) => {
              const p = gaitPose(direction, index, leg);
              return { ...p, leg };
            })
          : [],
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
  await writeFile(`${target}/export/${name}`, png);
  atlases.push({
    look,
    appearance: looks[look],
    role: look < 4 ? "player-proof" : "fictional-npc-proof",
    path: name,
    hash: digest,
    bytes: png.length,
    width: 1024,
    height: 960,
    rgbaBytes: 3932160,
    frames: metadata,
  });
}
// Master-only proof is isolated, with no comparison/NPC/rejected textures.
await writeFile(
  `${target}/export/manifest.json`,
  JSON.stringify(
    {
      status: "B DIRECTION SELECTED; FINAL M1 VISUAL APPROVAL OPEN",
      version: "m1-painted-campus-1",
      authoring,
      sourceFiles,
      sourceHash,
      geometry,
      gait,
      choices,
      directions,
      paintedCampus: true,
      selectionProof: masterFirst,
      atlases,
    },
    null,
    2,
  ) + "\n",
);
if (masterFirst) {
  console.log(
    "B master only: 40 poses, no variants/NPCs. Native proof before curated export.",
  );
  process.exit(0);
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
  for (const layer of layerNames) {
    const text = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="192">${parts.defs}${parts[layer]}</svg>`;
    await writeFile(
      `${root}/source/${direction}-${layer}.png`,
      await sharp(Buffer.from(text)).png().toBuffer(),
    );
  }
  const text = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="2048" height="416"><rect width="100%" height="100%" fill="#e9e7da"/>${Array.from({ length: 8 }, (_, i) => `<svg x="${i * 256}" width="256" height="384" viewBox="0 0 128 192">${nested(looks[0], direction, "walk", i, `${direction}${i}`)}</svg><text x="${i * 256 + 128}" y="403" font-family="sans-serif" text-anchor="middle" font-size="14">${i}: ${gait.phases[i]}</text>`).join("")}</svg>`;
  await writeFile(`${root}/source/${direction}-gait.svg`, text);
  await writeFile(
    `${root}/export/${direction}-gait.png`,
    await sharp(Buffer.from(text)).png().toBuffer(),
  );
}
for (const [name, rows] of [
  [
    "player-looks",
    looks.slice(0, 4).map((look, i) => ({ look, label: `player ${i}` })),
  ],
  [
    "npc-looks",
    looks
      .slice(4)
      .map((look, i) => ({ look, label: `fictional NPC ${i + 1}` })),
  ],
]) {
  const text = board(rows);
  await writeFile(`${root}/source/${name}.svg`, text);
  await writeFile(
    `${root}/export/${name}.png`,
    await sharp(Buffer.from(text)).png().toBuffer(),
  );
}
console.log(
  "B only: six bounded atlases / 240 poses, full Appearance source retained. Not final visual approval.",
);
function gaitPose(direction, index, leg) {
  const p = pose(direction, "walk", index),
    phase = p[leg],
    near = leg === "near";
  const hipX = p.side
    ? near
      ? 66
      : 59
    : near
      ? p.back
        ? 55
        : 72
      : p.back
        ? 73
        : 56;
  return {
    x: hipX + (p.side ? p.sign * phase.travel : (near ? 1 : -1) * 1.1) + 1,
    y:
      (near ? 174 : p.side ? 170 : 173) +
      (!p.side ? p.sign * phase.travel * 0.48 : 0) +
      1,
    lift: phase.lift,
    planted: phase.lift === 0,
  };
}
import { pose } from "../../art/characters/m1/painted-campus/student.mjs";
