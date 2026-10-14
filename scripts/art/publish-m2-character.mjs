import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = "art/characters/m1/painted-campus";
const spec = JSON.parse(await readFile(`${root}/export/manifest.json`, "utf8"));
const sourceFiles = await Promise.all(
  ["student.mjs", "appearance.mjs"].map(async (path) => ({
    path,
    hash: createHash("sha256")
      .update(
        (await readFile(`${root}/${path}`, "utf8")).replaceAll("\r\n", "\n"),
      )
      .digest("hex"),
  })),
);
assert.deepEqual(sourceFiles, spec.sourceFiles);
assert.equal(
  createHash("sha256").update(JSON.stringify(sourceFiles)).digest("hex"),
  spec.sourceHash,
);
assert.equal(
  spec.sourceHash,
  "2314f9a7d0b5d1353074804b98552b8bbc4feea8f4dbcdfcb99a3ad503eb9fc5",
  "M2 publishes only reviewer-approved B source",
);
const publicRoot = `apps/game/public/character-assets/b-${spec.sourceHash.slice(0, 12)}`;
await mkdir(publicRoot, { recursive: true });
const assets = [];
for (const a of spec.atlases) {
  const bytes = await readFile(`${root}/export/${a.path}`);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), a.hash);
  await copyFile(`${root}/export/${a.path}`, `${publicRoot}/${a.path}`);
  assets.push({
    appearance: a.appearance,
    path: `/character-assets/b-${spec.sourceHash.slice(0, 12)}/${a.path}`,
    hash: a.hash,
    bytes: a.bytes,
    bodyHeight: a.frames[0].bodyAlpha.height,
  });
}
await writeFile(
  "apps/game/app/character-assets.ts",
  `/* Generated from approved M1 B at257f114. Public immutable original atlases only. */\nexport const characterSourceHash = ${JSON.stringify(spec.sourceHash)};\nexport const characterAssets = ${JSON.stringify(assets, null, 2)} as const;\n`,
);
const source = (await readFile(`${root}/student.mjs`, "utf8"))
  .replaceAll("\r\n", "\n")
  .replaceAll("./appearance.mjs", "./character-appearance.mjs");
await writeFile("apps/game/app/character-art.mjs", source);
await writeFile(
  "apps/game/app/character-appearance.mjs",
  (await readFile(`${root}/appearance.mjs`, "utf8")).replaceAll("\r\n", "\n"),
);
console.log(
  "Published six exact approved B atlases and the original browser-composition source; no rejected art / no768 atlas set.",
);
