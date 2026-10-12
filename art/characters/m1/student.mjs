/** CW M1 layered-vector study v2. Original path artwork, not traced source pixels.
 * Non-runtime, pending human art approval. Elevated view; light upper-left.
 * Each named group is an editable SVG layer; poses preserve one ground origin.
 */
export const geometry = { width: 128, height: 192, foot: { x: 64, y: 177 } };
export const directions = ["down", "up", "left", "right"];
export const choices = {
  skin: ["deep", "brown", "warm", "light"],
  hair: ["crop", "afro", "braids", "covered"],
  hairColour: ["black", "brown"],
  top: ["lime", "clay", "blue"],
  bottom: ["trousers", "skirt"],
  shoes: ["dark", "white"],
  accessory: ["none", "backpack"],
};
export const looks = [
  {
    skin: "brown",
    hair: "crop",
    hairColour: "black",
    top: "lime",
    bottom: "trousers",
    shoes: "white",
    accessory: "backpack",
  },
  {
    skin: "deep",
    hair: "braids",
    hairColour: "black",
    top: "blue",
    bottom: "skirt",
    shoes: "dark",
    accessory: "none",
  },
  {
    skin: "warm",
    hair: "covered",
    hairColour: "brown",
    top: "clay",
    bottom: "skirt",
    shoes: "white",
    accessory: "backpack",
  },
  {
    skin: "light",
    hair: "afro",
    hairColour: "brown",
    top: "blue",
    bottom: "trousers",
    shoes: "dark",
    accessory: "none",
  },
  {
    skin: "deep",
    hair: "afro",
    hairColour: "black",
    top: "clay",
    bottom: "trousers",
    shoes: "white",
    accessory: "none",
  },
  {
    skin: "warm",
    hair: "braids",
    hairColour: "brown",
    top: "lime",
    bottom: "skirt",
    shoes: "dark",
    accessory: "backpack",
  },
];
export const palettes = {
  skin: {
    deep: "#774832",
    brown: "#a96b45",
    warm: "#c28a60",
    light: "#deb693",
  },
  hairColour: { black: "#20262b", brown: "#654332" },
  top: { lime: "#c2d273", clay: "#d88b71", blue: "#729dbb" },
  shoes: { dark: "#37404b", white: "#eee9df" },
};
export function validateLook(look) {
  if (
    !look ||
    Object.keys(look).length !== 7 ||
    Object.entries(choices).some(([key, values]) => !values.includes(look[key]))
  )
    throw new Error("INVALID_M1_APPEARANCE");
  return look;
}
import { drawLayers, pose } from "./forms.mjs";
export { pose };
export function layers(
  look,
  direction = "down",
  state = "idle",
  frame = 0,
  expression = "warm",
) {
  validateLook(look);
  if (!directions.includes(direction)) throw new Error("INVALID_M1_DIRECTION");
  return drawLayers(look, direction, state, frame, palettes, expression);
}
const G = (id, body) =>
  `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${id}">${body}</g>`;
export function svg(
  look,
  direction = "down",
  state = "idle",
  frame = 0,
  shadow = true,
  expression = "warm",
) {
  const parts = layers(look, direction, state, frame, expression);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="128" height="192" viewBox="0 0 128 192"><title>Original CW M1 editable ${direction} ${state} ${frame}; review candidate</title>${parts.defs}${Object.entries(
    parts,
  )
    .filter(([key]) => key !== "defs" && (shadow || key !== "ground-shadow"))
    .map(([key, body]) => G(key, body))
    .join("")}</svg>`;
}
