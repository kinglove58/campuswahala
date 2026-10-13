/** B-only authoring configuration. Reviewer 6148790041 selected the direction,
 * not final M1 acceptance. Existing serialized Appearance fields stay unchanged.
 */
export const authoring = {
  direction: "B - Painted Campus",
  selectionComment: "6148790041",
  selectedSourceCommit: "8fc0425f4ce14d034a380a3f511f6ad766b7ff66",
  selectedSourcePath: "art/characters/m1/treatments/master.mjs (B paths only)",
  finalVisualApproval: false,
  runtimeIntegrated: false,
};
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
    shoes: "white",
    accessory: "none",
  },
  {
    skin: "warm",
    hair: "covered",
    hairColour: "brown",
    top: "clay",
    bottom: "skirt",
    shoes: "dark",
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
    shoes: "dark",
    accessory: "none",
  },
  {
    skin: "warm",
    hair: "braids",
    hairColour: "brown",
    top: "lime",
    bottom: "trousers",
    shoes: "white",
    accessory: "backpack",
  },
];
export const palettes = {
  skin: {
    deep: "#80503b",
    brown: "#bd8058",
    warm: "#c99268",
    light: "#deb38b",
  },
  hairColour: { black: "#26332e", brown: "#664c36" },
  top: { lime: "#c4d178", clay: "#d39576", blue: "#789fae" },
  shoes: { dark: "#3e514d", white: "#e9e6d7" },
};
export function validateLook(look) {
  if (
    !look ||
    Object.keys(look).length !== 7 ||
    Object.entries(choices).some(([key, values]) => !values.includes(look[key]))
  )
    throw new Error("INVALID_PAINTED_CAMPUS_APPEARANCE");
  return look;
}
export function combinations() {
  return Object.entries(choices).reduce(
    (rows, [key, values]) =>
      rows.flatMap((row) => values.map((value) => ({ ...row, [key]: value }))),
    [{}],
  );
}
