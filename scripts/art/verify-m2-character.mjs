import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
const root = "art/characters/m1/painted-campus";
const spec = JSON.parse(await readFile(`${root}/export/manifest.json`, "utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const text = async (path) =>
  (await readFile(path, "utf8")).replaceAll("\r\n", "\n");
const sourceFiles = await Promise.all(
  ["student.mjs", "appearance.mjs"].map(async (path) => ({
    path,
    hash: hash(await text(`${root}/${path}`)),
  })),
);
assert.deepEqual(sourceFiles, spec.sourceFiles);
assert.equal(hash(JSON.stringify(sourceFiles)), spec.sourceHash);
assert.equal(
  spec.sourceHash,
  "2314f9a7d0b5d1353074804b98552b8bbc4feea8f4dbcdfcb99a3ad503eb9fc5",
);
assert.equal(
  await text("apps/game/app/character-art.mjs"),
  (await text(`${root}/student.mjs`)).replaceAll(
    "./appearance.mjs",
    "./character-appearance.mjs",
  ),
);
assert.equal(
  await text("apps/game/app/character-appearance.mjs"),
  await text(`${root}/appearance.mjs`),
);
const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve("tsx/package.json"))("esbuild");
const bundled = await esbuild.build({
  entryPoints: ["apps/game/app/character-assets.ts"],
  bundle: true,
  format: "esm",
  platform: "node",
  write: false,
});
const registry = await import(
  `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString("base64")}`
);
assert.equal(registry.characterSourceHash, spec.sourceHash);
assert.equal(registry.characterAssets.length, 6);
const directory = `apps/game/public/character-assets/b-${spec.sourceHash.slice(0, 12)}`;
assert.deepEqual(
  (await readdir(directory)).sort(),
  spec.atlases.map((a) => a.path).sort(),
);
for (const [i, a] of spec.atlases.entries()) {
  const bytes = await readFile(`${directory}/${a.path}`);
  assert.equal(hash(bytes), a.hash);
  assert.deepEqual(bytes, await readFile(`${root}/export/${a.path}`));
  assert.deepEqual(registry.characterAssets[i], {
    appearance: a.appearance,
    path: `/character-assets/b-${spec.sourceHash.slice(0, 12)}/${a.path}`,
    hash: a.hash,
    bytes: bytes.length,
    bodyHeight: a.frames[0].bodyAlpha.height,
  });
}
console.log(
  "M2: exact approved B source + six immutable PNG hashes + registry verified; runtime composition uses the same editable rig.",
);
