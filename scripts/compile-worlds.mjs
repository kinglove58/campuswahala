import { mkdir, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  {
    createCampusWorld,
    validateWorld,
  } = require("../packages/game-engine/dist");
await mkdir("artifacts/worlds", { recursive: true });
for (const id of ["futa", "oau", "unilag"]) {
  const manifest = validateWorld(createCampusWorld(id));
  await writeFile(
    `artifacts/worlds/${id}.v${manifest.version}.json`,
    JSON.stringify(manifest),
  );
  console.log(`${id}: compiled and validated v${manifest.version}`);
}
