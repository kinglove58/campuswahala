import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
import { composed } from "../../art/characters/composite.mjs";
const require = createRequire(import.meta.url);
const nextRequire = createRequire(
  require.resolve("next/package.json", { paths: ["apps/game"] }),
);
const sharp = nextRequire("sharp");
const looks = [
  {
    skin: "deep",
    hair: "crop",
    hairColour: "black",
    top: "lime",
    bottom: "trousers",
    shoes: "white",
    accessory: "backpack",
  },
  {
    skin: "brown",
    hair: "braids",
    hairColour: "brown",
    top: "blue",
    bottom: "skirt",
    shoes: "dark",
    accessory: "none",
  },
  {
    skin: "warm",
    hair: "covered",
    hairColour: "black",
    top: "clay",
    bottom: "skirt",
    shoes: "white",
    accessory: "backpack",
  },
  {
    skin: "light",
    hair: "afro",
    hairColour: "black",
    top: "blue",
    bottom: "trousers",
    shoes: "dark",
    accessory: "none",
  },
];
await mkdir("art/characters/proof", { recursive: true });
const dirs = ["down", "left", "up", "right"];
let board =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="1000" viewBox="0 0 1280 1000"><rect width="1280" height="1000" fill="#efe5d1"/><text x="44" y="56" font-family="sans-serif" font-size="26" fill="#253f38">CAMPUSWAHALA / ORIGINAL STUDENT RIG — ART PROOF</text><text x="44" y="88" font-family="sans-serif" font-size="15" fill="#645d50">Editable vector source · four facings · existing Appearance choices · not visual approval</text>';
for (let row = 0; row < 4; row++)
  for (let col = 0; col < 4; col++) {
    const svg = composed(looks[row], dirs[col])
      .replaceAll('id="', 'id="r' + row + "c" + col + "-")
      .replaceAll("url(#", "url(#r" + row + "c" + col + "-");
    board += `<g transform="translate(${90 + col * 300},${125 + row * 215}) scale(1.1)">${svg}</g>`;
    if (row === 0)
      board += `<text x="${140 + col * 300}" y="115" font-family="sans-serif" font-size="14" fill="#645d50">${dirs[col]}</text>`;
  }
board += "</svg>";
await writeFile("art/characters/proof/student-board.svg", board);
await sharp(Buffer.from(board))
  .png()
  .toFile("art/characters/proof/student-board.png");
for (const dir of dirs) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="160">${Array.from(
    { length: 8 },
    (_, i) =>
      `<g transform="translate(${i * 128},0)">${composed(
        looks[0],
        dir,
        i < 2 ? "idle" : "walk",
        i < 2 ? i : i - 2,
      )
        .replaceAll('id="', 'id="f' + i + "-")
        .replaceAll("url(#", "url(#f" + i + "-")}</g>`,
  ).join("")}</svg>`;
  await writeFile(`art/characters/proof/${dir}-frames.svg`, svg);
}
