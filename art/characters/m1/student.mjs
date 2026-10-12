/** CW M1 layered-vector study v1. Original path artwork, not traced source pixels.
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
const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const L = (d, opacity = 0.35, width = 0.8, color = "#2b2530") =>
  P(
    d,
    "none",
    `stroke="${color}" stroke-width="${width}" stroke-linecap="round" opacity="${opacity}"`,
  );
const E = (x, y, rx, ry, fill, extra = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const G = (id, body) =>
  `<g id="${id}" inkscape:groupmode="layer" inkscape:label="${id}">${body}</g>`;
function shade(hex, factor) {
  return `#${hex
    .slice(1)
    .match(/../g)
    .map((c) =>
      Math.max(0, Math.min(255, Math.round(parseInt(c, 16) * factor)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}
function gradient(id, color, radial = false) {
  const stops = `<stop stop-color="${shade(color, 1.22)}"/><stop offset=".46" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, 0.68)}"/>`;
  return radial
    ? `<radialGradient id="${id}" cx=".3" cy=".24" r=".83">${stops}</radialGradient>`
    : `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2=".48">${stops}</linearGradient>`;
}
export function pose(state, frame) {
  if (
    !["idle", "walk"].includes(state) ||
    !Number.isInteger(frame) ||
    frame < 0 ||
    frame >= (state === "walk" ? 8 : 2)
  )
    throw new Error("INVALID_M1_POSE");
  const stride = state === "walk" ? Math.sin((frame * Math.PI) / 4) : 0;
  return {
    stride,
    breath: state === "idle" ? frame * 0.65 : 0.35,
    weight:
      state === "walk" ? Math.sin((frame * Math.PI) / 2) * 0.65 : frame * 0.25,
  };
}
export function layers(look, direction = "down", state = "idle", frame = 0) {
  validateLook(look);
  if (!directions.includes(direction)) throw new Error("INVALID_M1_DIRECTION");
  const { stride, breath, weight } = pose(state, frame);
  const back = direction === "up",
    side = direction === "left" || direction === "right",
    left = direction === "left";
  const s = palettes.skin[look.skin],
    h = palettes.hairColour[look.hairColour],
    t = palettes.top[look.top],
    shoe = palettes.shoes[look.shoes];
  const defs = `<defs>${gradient("skin", s, true)}${gradient("arm", s)}${gradient("cloth", t)}${gradient("hair", h)}${gradient("denim", "#344552")}${gradient("shoe", shoe)}${gradient("bag", "#976942")}${gradient("scarf", "#d5b484")}</defs>`;
  const ink =
    'stroke="#292a2e" stroke-opacity=".72" stroke-width=".85" stroke-linejoin="round"';
  const shadow = E(64, 178, side ? 19 : 24, 4.2, "#1c362b", 'opacity=".18"');
  const limb = (near, arm) => {
    const phase = stride * (near ? 1 : -1) * (arm ? -1 : 1),
      x = side ? (near ? 65 : 60) : arm ? (near ? 86 : 42) : near ? 74 : 54;
    if (arm) {
      const dx = side ? phase * 7 * (left ? -1 : 1) : phase * 1.5,
        dy = phase * 3 + breath;
      return (
        `<g transform="translate(${dx},${-dy})">` +
        P(
          `M${x - 4} 82 Q${x - 9} 93 ${x - 6} 106 L${x - 3} 120 Q${x - 2} 128 ${x + 2} 127 Q${x + 7} 125 ${x + 4} 120 L${x + 2} 108 Q${x + 4} 97 ${x + 5} 87Z`,
          "url(#arm)",
          ink,
        ) +
        L(
          `M${x + 1} 120 Q${x + 4} 121 ${x + 3} 125 M${x - 2} 122 L${x - 1} 125`,
          0.38,
          0.65,
        ) +
        P(
          `M${x - 6} 82 Q${x - 10} 90 ${x - 7} 101 Q${x} 104 ${x + 6} 100 L${x + 7} 82Z`,
          "url(#cloth)",
          ink,
        ) +
        L(`M${x - 6} 99 Q${x} 101 ${x + 6} 98`, 0.28) +
        `</g>`
      );
    }
    const dx = side ? phase * 8 * (left ? -1 : 1) : phase * 2,
      lift =
        state === "walk"
          ? Math.max(0, Math.cos((frame * Math.PI) / 4) * (near ? 1 : -1)) * 4
          : 0;
    const y = 171 - lift,
      kneeX = x + dx * 0.6;
    const leg = P(
      `M${x - 8} 113 L${x + 8} 113 Q${kneeX + 8} 132 ${kneeX + 6} 144 L${x + dx + 6} ${y} Q${x + dx} ${y + 3} ${x + dx - 6} ${y} L${kneeX - 7} 145 Q${kneeX - 9} 131 ${x - 8} 113Z`,
      look.bottom === "skirt" ? "url(#skin)" : "url(#denim)",
      ink,
    );
    const footX = x + dx + (left ? -3 : side ? 3 : 0);
    const shoes =
      P(
        left
          ? `M${footX + 6} ${y - 3} Q${footX} ${y - 5} ${footX - 6} ${y - 2} L${footX - 10} ${y + 3} Q${footX - 9} ${y + 7} ${footX + 9} ${y + 6} Q${footX + 11} ${y + 3} ${footX + 6} ${y - 3}Z`
          : `M${footX - 6} ${y - 3} Q${footX} ${y - 5} ${footX + 6} ${y - 2} L${footX + 10} ${y + 3} Q${footX + 9} ${y + 7} ${footX - 9} ${y + 6} Q${footX - 11} ${y + 3} ${footX - 6} ${y - 3}Z`,
        "url(#shoe)",
        ink,
      ) +
      P(
        `M${footX - 9} ${y + 3} Q${footX} ${y + 5} ${footX + 9} ${y + 3} L${footX + 9} ${y + 6} Q${footX} ${y + 8} ${footX - 9} ${y + 6}Z`,
        "#e9e2d5",
        ink,
      ) +
      L(
        `M${footX - 3} ${y - 1} L${footX + 3} ${y} M${footX - 3} ${y + 1} L${footX + 4} ${y + 2}`,
        0.65,
        0.75,
        look.shoes === "dark" ? "#d7d0c0" : "#4d5358",
      );
    return {
      shoes,
      leg:
        leg +
        (look.bottom === "trousers"
          ? L(
              `M${kneeX - 3} 136 L${kneeX + 5} 140 M${x + dx - 5} ${y - 4} Q${x + dx} ${y - 2} ${x + dx + 5} ${y - 5}`,
              0.45,
            )
          : ""),
    };
  };
  const body =
    `<g transform="translate(${weight},${-breath})">` +
    P(
      side
        ? left
          ? "M59 58 Q70 58 73 67 L76 104 Q71 117 54 114 L50 82 Q43 77 50 68Z"
          : "M53 59 Q65 56 71 64 L80 78 74 113 Q60 117 51 110 L49 76Z"
        : "M54 59 Q64 64 74 59 Q85 62 88 79 L80 92 82 112 Q65 119 46 112 L49 90 39 79 Q42 64 54 59Z",
      "url(#cloth)",
      ink,
    ) +
    P(
      back
        ? "M52 59 Q64 66 76 59 L77 67 Q65 77 51 67Z"
        : "M54 59 Q63 68 73 59 L72 64 Q65 75 55 65Z",
      "url(#skin)",
      ink,
    ) +
    P(
      back
        ? "M51 63 Q64 77 77 62 L79 70 Q65 81 49 70Z"
        : "M50 63 Q64 79 77 62 L79 70 Q64 84 48 70Z",
      "url(#cloth)",
      ink,
    ) +
    L(
      side
        ? "M60 80 Q56 94 59 102 M52 109 Q65 114 73 109"
        : "M49 84 Q57 92 51 104 M78 85 Q70 96 76 105 M48 110 Q64 115 80 109",
      0.27,
      1,
    ) +
    (!back
      ? L(
          side ? "M64 73 L64 89 M68 72 L70 88" : "M58 74 L56 91 M71 74 L73 91",
          0.8,
          0.8,
          "#f5ead3",
        )
      : "") +
    (!back && !side
      ? P(
          "M55 96 Q64 98 74 95 L73 106 Q64 110 54 106Z",
          shade(t, 0.94),
          'stroke="#282c30" stroke-opacity=".2" stroke-width=".6"',
        ) +
        L("M56 96 L54 101 M73 96 L75 101", 0.25) +
        P("M69 82 L74 82 74 87 69 87Z", "#f4e9cf", 'opacity=".65"')
      : "") +
    "</g>";
  const lower =
    look.bottom === "skirt"
      ? P(
          side
            ? "M51 112 Q65 116 77 111 L84 148 Q64 156 44 146Z"
            : "M47 112 Q63 116 81 111 L91 147 Q64 157 37 147Z",
          "url(#denim)",
          ink,
        ) +
        L(
          side
            ? "M58 118 L54 145 M70 119 L75 146"
            : "M50 119 L46 145 M63 119 L63 149 M76 118 L82 146",
          0.48,
          0.85,
        )
      : P(
          side
            ? "M50 111 Q65 116 77 111 L77 125 50 125Z"
            : "M47 111 Q64 116 81 111 L81 124 47 124Z",
          "url(#denim)",
          ink,
        ) +
        L("M63 115 L63 128 M51 116 Q52 124 48 126 M76 116 Q75 123 79 125", 0.4);
  const head =
    `<g transform="translate(${weight * 0.35},${-breath * 0.35})">` +
    P("M57 49 L57 63 Q65 68 72 62 L71 48Z", "url(#skin)", ink) +
    P(
      back
        ? "M47 27 Q49 17 64 18 Q79 17 82 29 L81 45 Q77 58 65 60 Q50 58 46 45Z"
        : left
          ? "M73 24 Q60 18 49 26 Q45 30 46 37 L41 43 Q40 46 46 46 Q45 54 52 58 Q61 63 72 55 Q78 48 78 35Z"
          : side
            ? "M54 24 Q66 17 77 24 Q83 28 82 37 L87 42 Q90 46 83 46 Q85 54 77 58 Q67 63 56 55 Q50 47 50 35Z"
            : "M49 27 Q50 18 63 18 Q77 18 80 29 L79 43 Q77 55 68 60 Q63 62 56 57 Q48 52 48 42Z",
      "url(#skin)",
      ink,
    ) +
    (back
      ? E(46, 40, 3, 6, "url(#skin)") + E(81, 40, 3, 6, "url(#skin)")
      : side
        ? E(left ? 74 : 55, 39, 3.6, 5.6, "url(#skin)") +
          L(left ? "M74 37 Q70 39 74 42" : "M55 37 Q59 39 55 42", 0.38)
        : E(47, 40, 3.4, 5.6, "url(#skin)") +
          E(80, 40, 3.4, 5.6, "url(#skin)")) +
    (!back
      ? side
        ? P(
            left
              ? "M48 36 Q53 32 58 36 Q54 41 48 39Z"
              : "M71 36 Q77 32 81 36 Q77 41 71 39Z",
            "#f5e9d8",
          ) +
          E(left ? 51.7 : 77.5, 37, 2.1, 2.5, "#38271f") +
          E(left ? 51.3 : 77.2, 36.2, 0.7, 0.7, "#fff6df") +
          L(left ? "M48 32 Q53 29 59 32" : "M71 32 Q76 29 81 32", 0.9, 1.5) +
          L(
            left
              ? "M45 47 Q48 49 50 47 M48 52 Q52 54 57 51"
              : "M81 47 Q79 49 77 47 M73 52 Q77 54 81 51",
            0.62,
            0.9,
          )
        : P(
            "M51 36 Q55 32 60 35 Q58 41 52 39Z M68 35 Q74 31 78 35 Q76 40 70 39Z",
            "#f5e9d8",
          ) +
          E(56, 37, 2.25, 2.7, "#3b291f") +
          E(73, 36.6, 2.35, 2.7, "#3b291f") +
          E(55.3, 36.1, 0.75, 0.8, "#fff9df") +
          E(72.2, 35.7, 0.75, 0.8, "#fff9df") +
          L("M51 31 Q56 28 60 31 M68 30 Q74 27 78 30", 0.85, 1.45) +
          P(
            "M63 36 Q60 43 61 45 Q64 47 68 44 L66 37Z",
            shade(s, 0.85),
            'opacity=".8"',
          ) +
          L("M62 45 Q65 46 67 44", 0.32, 0.6) +
          L("M57 51 Q65 56 73 50", 0.6, 1) +
          L("M60 53 Q65 55 69 52", 0.24, 0.7, "#fff2d2") +
          E(54, 45, 3.5, 2, shade(s, 1.2), 'opacity=".22"')
      : "") +
    "</g>";
  let hair;
  if (look.hair === "covered") {
    hair =
      P(
        side
          ? left
            ? "M77 51 Q84 23 65 16 Q44 15 43 35 L49 28 Q57 23 64 28 Q71 41 73 54 L83 71 Q67 77 50 66 L48 58 Q62 64 72 55Z"
            : "M51 51 Q43 24 62 16 Q81 14 86 33 L79 27 Q70 22 62 28 Q55 40 55 53 L45 71 Q60 77 77 66 L79 58 Q65 63 55 55Z"
          : "M45 43 Q37 20 60 14 Q83 10 87 31 L84 48 80 43 Q80 21 64 22 Q49 21 49 43 L49 54 Q54 63 64 64 Q76 62 81 53 L87 71 Q64 82 41 70 L44 56Z",
        "url(#scarf)",
        ink,
      ) +
      L(
        side
          ? "M59 19 Q73 21 79 34 M52 66 Q62 72 75 67"
          : "M48 25 Q55 15 69 18 M46 65 Q63 74 83 65",
        0.3,
        1,
      ) +
      P(left ? "M47 29 L53 25 52 30Z" : "M76 25 L81 29 77 31Z", "url(#hair)");
  } else if (look.hair === "afro") {
    hair =
      P(
        "M42 38 Q36 35 39 29 Q33 23 40 20 Q39 13 46 14 Q47 8 53 12 Q58 5 63 11 Q69 5 73 11 Q81 8 82 15 Q90 14 88 23 Q96 25 90 32 Q94 40 85 43 L80 34 Q78 27 72 27 Q66 30 62 25 Q54 29 48 28 L48 41Z",
        "url(#hair)",
        ink,
      ) +
      L(
        "M43 21 Q48 16 52 20 M58 14 Q63 10 66 16 M76 18 Q83 17 85 23 M39 30 Q44 26 46 31",
        0.26,
        1.6,
        shade(h, 1.8),
      );
  } else if (look.hair === "braids") {
    hair = P(
      "M45 37 Q39 21 56 16 Q76 11 85 28 L81 40 78 29 Q65 24 51 31 L49 40Z",
      "url(#hair)",
      ink,
    );
    for (let n = 0; n < 5; n++)
      hair += L(
        `M${49 + n * 6} 29 Q${47 + n * 6} 21 ${56 + n * 4} 18`,
        0.32,
        1.35,
        shade(h, 1.9),
      );
    for (const x of side ? [left ? 74 : 54] : [47, 81]) {
      hair += P(
        `M${x - 3} 32 Q${x + 4} 44 ${x + 3} 56 Q${x + 1} 67 ${x + 5} 74 L${x - 1} 76 Q${x - 6} 61 ${x - 4} 47Z`,
        "url(#hair)",
        ink,
      );
      for (let y = 40; y < 73; y += 5)
        hair += L(`M${x - 3} ${y} L${x + 2} ${y + 2}`, 0.3, 0.8, shade(h, 1.9));
    }
  } else {
    hair =
      P(
        back
          ? "M46 40 Q39 24 48 18 Q56 11 68 15 Q85 14 86 31 L82 46 Q75 53 65 51 Q54 52 46 40Z"
          : side
            ? left
              ? "M76 43 Q86 24 75 18 Q61 11 49 19 Q42 23 44 34 L50 28 53 32 60 27 Q68 28 72 36Z"
              : "M52 43 Q43 25 53 19 Q67 11 79 18 Q86 21 85 33 L79 28 74 31 68 27 Q59 28 56 36Z"
            : "M46 40 Q40 30 44 22 Q46 15 55 16 Q61 10 67 15 Q78 11 83 24 L81 39 77 29 72 31 68 26 60 30 54 27 49 32Z",
        "url(#hair)",
        ink,
      ) +
      L(
        "M47 23 Q53 18 57 22 M60 19 Q65 15 69 20 M73 21 Q79 19 81 26",
        0.23,
        1.2,
        shade(h, 2),
      );
  }
  if (back && look.hair === "covered")
    hair =
      P(
        "M43 43 Q35 19 60 14 Q83 10 88 31 L86 57 89 70 Q65 82 40 69 L43 53Z",
        "url(#scarf)",
        ink,
      ) +
      L("M48 25 Q62 17 80 25 M45 60 Q61 71 84 61 M63 25 Q60 46 66 61", 0.24, 1);
  if (back && look.hair === "braids")
    hair =
      P(
        "M45 44 Q39 23 52 17 Q71 10 83 24 L82 48 Q76 60 65 58 Q53 59 45 44Z",
        "url(#hair)",
        ink,
      ) +
      L(
        "M49 29 Q49 18 58 17 M56 51 Q52 29 64 16 M64 53 Q60 30 70 17 M73 50 Q73 28 76 21",
        0.28,
        1.4,
        shade(h, 1.9),
      ) +
      P(
        "M44 37 Q51 49 48 75 L42 74Z M79 37 Q86 51 86 74 L80 76Z",
        "url(#hair)",
        ink,
      );
  if (back && look.hair === "afro")
    hair += P(
      "M44 31 Q42 51 53 56 Q65 65 78 55 Q87 45 84 30Z",
      "url(#hair)",
      ink,
    );
  let bag = "",
    straps = "";
  if (look.accessory === "backpack") {
    bag =
      P(
        side
          ? left
            ? "M78 73 Q90 72 90 83 L89 110 Q82 118 76 110 L74 86Z"
            : "M50 72 Q38 73 38 84 L39 111 Q45 118 53 109 L54 85Z"
          : "M48 73 Q62 66 80 75 L81 108 Q66 122 47 110Z",
        "url(#bag)",
        ink,
      ) +
      L(
        side
          ? left
            ? "M79 94 Q85 91 88 97 L86 108 79 108Z"
            : "M41 96 Q46 91 51 95 L51 108 42 108Z"
          : "M50 94 Q64 90 77 94 L76 108 Q64 114 50 107Z",
        0.6,
        0.9,
      ) +
      L(side ? "M45 77 Q48 72 50 76" : "M58 72 Q61 64 67 73", 0.8, 2);
    straps = back
      ? ""
      : L(
          side
            ? left
              ? "M67 65 Q77 74 73 98"
              : "M62 65 Q51 75 55 99"
            : "M51 65 Q47 82 50 101 M77 66 Q81 83 78 101",
          0.9,
          4,
          "#434b4c",
        ) +
        L(
          side
            ? left
              ? "M68 66 Q75 76 72 95"
              : "M61 66 Q53 76 56 96"
            : "M52 66 Q48 82 51 98 M76 67 Q80 82 77 98",
          0.5,
          0.7,
          "#d0c2a0",
        );
  }
  return {
    defs,
    "ground-shadow": shadow,
    "back-accessory": !back ? bag : "",
    "far-leg": limb(false, false).leg,
    "far-shoe": limb(false, false).shoes,
    "near-leg": limb(true, false).leg,
    "near-shoe": limb(true, false).shoes,
    "lower-clothing": lower,
    "far-arm": limb(false, true),
    "torso-and-hood": body,
    "head-and-face": head,
    "hair-or-covering": hair,
    "near-arm": limb(true, true),
    "backpack-or-straps": back ? bag : straps,
  };
}
export function svg(
  look,
  direction = "down",
  state = "idle",
  frame = 0,
  shadow = true,
) {
  const parts = layers(look, direction, state, frame);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="128" height="192" viewBox="0 0 128 192"><title>Original CW M1 editable ${direction} ${state} ${frame}; review candidate</title>${parts.defs}${Object.entries(
    parts,
  )
    .filter(([key]) => key !== "defs" && (shadow || key !== "ground-shadow"))
    .map(([key, body]) => G(key, body))
    .join("")}</svg>`;
}
