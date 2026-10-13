import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const sharp = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
)("sharp");
const root = "art/characters/m1/treatments";
const cells = [];
for (const [row, option] of ["a", "b"].entries()) {
  const measurements = JSON.parse(
    await readFile(`${root}/${option}/evidence/measurements.json`, "utf8"),
  );
  assert.equal(measurements.treatment, option);
  assert.equal(measurements.initial.canvas.height, 731);
  for (const [col, dir] of ["down", "up", "left", "right"].entries()) {
    const input = await readFile(
      `${root}/${option}/evidence/${dir}-native-crop.png`,
    );
    const meta = await sharp(input).metadata();
    assert.equal(meta.width, 110);
    assert.equal(meta.height, 115);
    cells.push({ input, left: col * 110, top: row * 140 + 25 });
  }
}
const labels = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="440" height="280"><text x="5" y="16" font-family="sans-serif" font-size="10" fill="#203c31">A / down | up | left | right - original screenshot pixels</text><text x="5" y="156" font-family="sans-serif" font-size="10" fill="#203c31">B / down | up | left | right - original screenshot pixels</text></svg>',
);
await writeFile(
  `${root}/comparisons/native-four-facing-a-b.png`,
  await sharp({
    create: { width: 440, height: 280, channels: 4, background: "#e9e7da" },
  })
    .composite([...cells, { input: labels, left: 0, top: 0 }])
    .png()
    .toBuffer(),
);
await writeFile(
  `${root}/comparisons/native-360x800-a-b.png`,
  await sharp({
    create: { width: 720, height: 800, channels: 4, background: "#00000000" },
  })
    .composite(
      await Promise.all(
        ["a", "b"].map(async (option, i) => ({
          input: await readFile(
            `${root}/${option}/evidence/down-idle-360x800.png`,
          ),
          left: i * 360,
          top: 0,
        })),
      ),
    )
    .png()
    .toBuffer(),
);
console.log(
  "Native A/B boards composite exact crops and full viewports without resizing or retouching.",
);
