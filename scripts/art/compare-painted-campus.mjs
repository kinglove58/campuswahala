import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const root = "art/characters/m1/painted-campus",
  out = `${root}/comparison`;
await mkdir(out, { recursive: true });
const hash = (b) => createHash("sha256").update(b).digest("hex");
const selected = "8fc0425f4ce14d034a380a3f511f6ad766b7ff66";
const beforeRoot = "art/characters/m1/treatments/b";
const rows = [];
async function before(path) {
  const bytes = await readFile(`${beforeRoot}/${path}`);
  const committed = execFileSync(
    "git",
    ["show", `${selected}:${beforeRoot}/${path}`],
    { maxBuffer: 16 * 1024 * 1024 },
  );
  assert.equal(
    hash(bytes),
    hash(committed),
    "Selected B before image must be exact original committed bytes",
  );
  rows.push({
    path: `${beforeRoot}/${path}`,
    sha256: hash(bytes),
    commit: selected,
  });
  return bytes;
}
const oldSheet = await before("export/four-facing.png"),
  newSheet = await readFile(`${root}/export/master-turnaround.png`);
await writeFile(
  `${out}/selected-b-before-after.png`,
  await sharp({
    create: { width: 2048, height: 1800, channels: 4, background: "#e9e7da" },
  })
    .composite([
      { input: oldSheet, left: 0, top: 35 },
      { input: newSheet, left: 0, top: 935 },
      {
        input: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="1800"><text x="20" y="25" font-family="sans-serif" font-size="22">BEFORE: reviewer-selected B direction at 8fc0425</text><text x="20" y="925" font-family="sans-serif" font-size="22">AFTER: B-only refined master - final visual approval still open</text></svg>',
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer(),
);
const oldNative = await before("evidence/down-idle-360x800.png"),
  newNative = await readFile(
    `${root}/evidence/master-only/down-idle-360x800.png`,
  );
await writeFile(
  `${out}/native-b-before-after.png`,
  await sharp({
    create: { width: 720, height: 825, channels: 4, background: "#e9e7da" },
  })
    .composite([
      { input: oldNative, left: 0, top: 25 },
      { input: newNative, left: 360, top: 25 },
      {
        input: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="720" height="825"><text x="8" y="17" font-family="sans-serif" font-size="12">Selected B before / untouched360x800</text><text x="368" y="17" font-family="sans-serif" font-size="12">Refined B / untouched360x800</text></svg>',
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer(),
);
const crops = [];
for (const [col, dir] of ["down", "up", "left", "right"].entries()) {
  const input = await readFile(
    `${root}/evidence/master-only/${dir}-native-crop.png`,
  );
  const meta = await sharp(input).metadata();
  assert.equal(meta.width, 110);
  assert.equal(meta.height, 115);
  crops.push({ input, left: col * 110, top: 25 });
}
await writeFile(
  `${out}/native-four-facing.png`,
  await sharp({
    create: { width: 440, height: 140, channels: 4, background: "#e9e7da" },
  })
    .composite([
      ...crops,
      {
        input: Buffer.from(
          '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="140"><text x="5" y="17" font-family="sans-serif" font-size="12">B: down / up / left / right - original screenshot pixels</text></svg>',
        ),
        left: 0,
        top: 0,
      },
    ])
    .png()
    .toBuffer(),
);
const looks = [];
for (let i = 0; i < 4; i++)
  looks.push({
    input: await readFile(`${root}/evidence/look-${i}-360x800.png`),
    left: i * 360,
    top: 0,
  });
await writeFile(
  `${out}/native-four-player-looks.png`,
  await sharp({
    create: { width: 1440, height: 800, channels: 4, background: "#00000000" },
  })
    .composite(looks)
    .png()
    .toBuffer(),
);
await writeFile(
  `${out}/provenance.json`,
  JSON.stringify(
    {
      status:
        "before is selected B, not rejected art promotion; no source image resampling/retouching",
      before: rows,
      currentSourceHash: JSON.parse(
        await readFile(`${root}/export/manifest.json`, "utf8"),
      ).sourceHash,
      nativeComparison:
        "both master-only contexts, same360x800 viewport/ground/.88 camera, no NPCs; native other-look proofs separately stage2 B NPCs",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Exact selected-B before/after boards; four native facings and player looks; no resampling.",
);
