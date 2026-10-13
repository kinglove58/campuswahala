/** Original B-selected refinement, derived only from the authorized B source at 8fc0425.
 * SVG surface paths and brush marks are the authoring source. Not approved/runtime.
 * Camera looks down approximately 25 degrees. Light is upper-left in all facings.
 * One modular B rig for every existing Appearance value. No A art or rejected-study imports.
 */
export const geometry = { width: 128, height: 192, foot: { x: 64, y: 177 } };
export const directions = ["down", "up", "left", "right"];
import { palettes, validateLook } from "./appearance.mjs";
export {
  choices,
  looks,
  palettes,
  authoring,
  validateLook,
  combinations,
} from "./appearance.mjs";
export const gait = {
  fps: 8,
  projectedStride: { down: 30.72, up: 30.72, left: 64, right: 64 },
  phases: [
    "left-contact",
    "left-recoil",
    "left-midstance",
    "left-toe-off",
    "right-contact",
    "right-recoil",
    "right-midstance",
    "right-toe-off",
  ],
  travel: [16, 8, 0, -8, -16, -10, 0, 11],
  lift: [0, 0, 0, 0.5, 5, 10, 12, 6],
  knee: [0, 1, 1, 3, 8, 15, 17, 8],
  toe: [-6, 0, 0, 12, 25, -10, -14, -12],
};
export const layerNames = [
  "ground-shadow",
  "back-accessory",
  "far-leg",
  "far-shoe",
  "near-leg",
  "near-shoe",
  "lower-clothing",
  "far-arm",
  "torso-and-hood",
  "head-and-face",
  "hair-or-covering",
  "near-arm",
  "backpack-or-straps",
];
const path = (d, fill, extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, colour, width = 0.65, extra = "") =>
  path(
    d,
    "none",
    `stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}`,
  );
const ellipse = (x, y, rx, ry, fill, extra = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const group = (body, transform = "") =>
  `<g${transform ? ` transform="${transform}"` : ""}>${body}</g>`;
const f = (n) => Number(n.toFixed(3));
function shift(hex, from, to) {
  const channels = (value) =>
    [1, 3, 5].map((i) => Number.parseInt(value.slice(i, i + 2), 16));
  const a = channels(hex),
    b = channels(from),
    c = channels(to);
  return (
    "#" +
    a
      .map((v, i) =>
        Math.max(0, Math.min(255, v - b[i] + c[i]))
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
function recolour(text, look) {
  const families = [
    [
      "#be8258",
      palettes.skin[look.skin],
      [
        "#e5b488",
        "#be8258",
        "#975b3d",
        "#663d31",
        "#bd805d",
        "#945636",
        "#734537",
        "#744833",
        "#efb68b",
        "#955b3e",
        "#e4ad7d",
        "#754735",
        "#d29b6b",
        "#d99b71",
        "#8c573c",
      ],
    ],
    [
      "#c4d178",
      palettes.top[look.top],
      [
        "#e4e5a7",
        "#c4d178",
        "#9ead5d",
        "#647b49",
        "#e1e7a0",
        "#b4c56a",
        "#657844",
        "#879953",
        "#dbe0a1",
        "#e7eaa6",
        "#526d42",
        "#8d9e53",
        "#5c7144",
        "#e1e6a0",
        "#e9e7bd",
        "#abc067",
        "#7f9651",
        "#637e47",
        "#d2dc8b",
        "#e8e5ac",
        "#809657",
      ],
    ],
    [
      "#26332e",
      palettes.hairColour[look.hairColour],
      [
        "#53615c",
        "#353f3b",
        "#222d2a",
        "#152321",
        "#627266",
        "#8a937f",
        "#778476",
      ],
    ],
    [
      "#e9e6d7",
      palettes.shoes[look.shoes],
      [
        "#fff5dd",
        "#e9e6d7",
        "#b0b9b0",
        "#768c82",
        "#f5f0dc",
        "#829586",
        "#576d62",
        "#476457",
      ],
    ],
  ];
  const mapping = new Map(
    families.flatMap(([from, to, colors]) =>
      colors.map((color) => [color, shift(color, from, to)]),
    ),
  );
  return text.replace(/#[0-9a-f]{6}/g, (color) => mapping.get(color) || color);
}
function skirt(p) {
  const sway = p.near.travel * 0.055;
  const skirtShape = p.side
    ? `M51 112 Q65 110 77 113 Q78 131 83 145 Q65 153 44 145 Q49 132 51 112Z`
    : `M49 113 Q64 109 79 113 Q80 132 ${84 + sway} 145 Q66 154 ${43 + sway} 145 Q48 131 49 113Z`;
  return group(
    path(skirtShape, "url(#pants)") +
      path(
        "M53 117 Q58 115 61 119 L59 144 Q54 148 49 144Z",
        "#84978b",
        'opacity=".45" filter="url(#soft)"',
      ) +
      line(
        "M51 142 Q65 149 80 143 M66 119 Q68 136 68 145 M75 119 L78 142",
        "#273d36",
        0.9,
      ),
    `translate(0 ${p.bob})`,
  );
}
function hairstyle(p, look) {
  let hair;
  if (look.hair === "afro") {
    const outline =
      "M48 42 Q42 36 46 29 Q44 21 52 19 Q56 12 63 16 Q70 12 76 19 Q85 19 82 28 Q88 35 80 44 L75 43 L74 34 Q65 38 56 33 L53 44Z";
    hair =
      path(outline, "url(#hair)") +
      path(
        "M49 27 Q54 16 67 19 Q75 20 77 25 Q66 32 52 30Z",
        "#627266",
        'opacity=".55" filter="url(#soft)"',
      );
    if (p.back)
      hair += path("M48 33 Q65 28 81 33 L77 50 Q65 56 52 49Z", "url(#hair)");
    for (let i = 0; i < 7; i++)
      hair += line(
        `M${49 + i * 4} ${24 + Math.abs(3 - i) * 1.1} q-.5 -3 2 -2 q3 1 .8 3`,
        "#8a937f",
        0.75,
        'opacity=".28"',
      );
  } else if (look.hair === "braids") {
    const crown = p.back
      ? "M49 32 Q47 18 64 18 Q81 19 79 34 L76 50 Q64 54 51 47Z"
      : "M49 40 Q46 21 59 19 Q74 14 79 28 L78 41 L75 40 L74 31 Q63 36 54 32 L52 43Z";
    hair =
      path(crown, "url(#hair)") +
      path(
        "M52 24 Q64 17 75 24 L73 27 Q62 24 53 29Z",
        "#627266",
        'opacity=".45"',
      );
    for (let i = 0; i < 5; i++)
      hair += line(
        `M${54 + i * 4} 24 Q${52 + i * 4} 27 ${53 + i * 4} 33`,
        "#8a937f",
        0.8,
        'opacity=".55"',
      );
    const braidX = p.side ? (p.sign > 0 ? 53 : 76) : p.back ? 70 : 50;
    hair +=
      line(
        `M${braidX} 35 Q${braidX - 3} 46 ${braidX + 2 + p.shoulder} 61`,
        "#152321",
        5.2,
      ) +
      line(
        `M${braidX - 1} 37 Q${braidX - 2} 47 ${braidX + 1 + p.shoulder} 59`,
        "#627266",
        1.6,
      );
    for (let i = 0; i < 6; i++)
      hair += line(
        `M${braidX - 2 + i * 0.4} ${37 + i * 3.5} l3 1.5`,
        "#8a937f",
        0.6,
        'opacity=".6"',
      );
    if (!p.side)
      hair +=
        line("M77 34 Q81 47 76 60", "#222d2a", 4.5) +
        line("M78 39 Q80 48 76 58", "#627266", 1.3);
  } else {
    const crown = p.back
      ? "M48 34 Q47 18 63 18 Q80 18 81 34 L78 53 Q64 59 50 51Z"
      : "M48 40 Q44 24 56 19 Q71 13 79 26 L81 43 L76 49 L74 33 Q65 32 54 35 L52 47Z";
    hair =
      path(crown, "url(#scarf)") +
      path(
        "M49 29 Q52 19 62 19 Q73 17 77 26 Q62 22 52 33Z",
        "#e1e7a0",
        'opacity=".4"',
      ) +
      line(
        "M53 22 Q61 27 76 27 M48 32 Q57 27 68 31 M78 31 Q80 39 77 44",
        "#657844",
        0.9,
      );
    const x = p.side ? (p.sign > 0 ? 53 : 76) : 76;
    hair +=
      path(
        `M${x} 45 Q${x + 6} 42 ${x + 7} 47 Q${x + 6} 53 ${x} 50Z`,
        "url(#scarf)",
      ) +
      path(
        `M${x + 2} 49 Q${x + 8} 55 ${x + 5} 65 L${x - 1} 62Z`,
        "url(#scarf)",
      );
  }
  return group(
    hair,
    `translate(64 ${62 + p.bob}) scale(.94 .86) translate(-64 -62)`,
  );
}
export function pose(direction, state, frame) {
  if (
    !directions.includes(direction) ||
    !["idle", "walk"].includes(state) ||
    !Number.isInteger(frame) ||
    frame < 0 ||
    frame >= (state === "walk" ? 8 : 2)
  )
    throw new Error("INVALID_SELECTION_POSE");
  const side = direction === "left" || direction === "right";
  const sign = direction === "left" || direction === "up" ? -1 : 1;
  const leg = (i) => ({
    travel: state === "walk" ? gait.travel[i] : 0,
    lift: state === "walk" ? gait.lift[i] : 0,
    knee: state === "walk" ? gait.knee[i] : 0,
    toe: state === "walk" ? gait.toe[i] : 0,
  });
  return {
    side,
    sign,
    back: direction === "up",
    near: leg(frame),
    hip: state === "walk" ? [0, 0.7, 1, 0.5, 0, -0.7, -1, -0.5][frame] : 0,
    shoulder:
      state === "walk" ? [0, -0.5, -0.8, -0.4, 0, 0.5, 0.8, 0.4][frame] : 0,
    far: leg((frame + 4) % 8),
    bob:
      state === "walk"
        ? [0, 0.8, -0.6, -0.3, 0, 0.8, -0.6, -0.3][frame]
        : frame * -0.35,
  };
}
function definitions(look) {
  const gradient = (id, stops, radial = false) =>
    radial
      ? `<radialGradient id="${id}" cx="30%" cy="24%" r="83%">${stops.map(([offset, color]) => `<stop offset="${offset}%" stop-color="${color}"/>`).join("")}</radialGradient>`
      : `<linearGradient id="${id}" x1="10%" y1="0%" x2="90%" y2="90%">${stops.map(([offset, color]) => `<stop offset="${offset}%" stop-color="${color}"/>`).join("")}</linearGradient>`;
  return recolour(
    `<defs>${gradient(
      "skin",
      [
        [0, "#e5b488"],
        [38, "#be8258"],
        [76, "#975b3d"],
        [100, "#663d31"],
      ],
      true,
    )}${gradient(
      "ear",
      [
        [0, "#bd805d"],
        [70, "#945636"],
        [100, "#734537"],
      ],
      true,
    )}${gradient(
      "cloth",
      [
        [0, "#e4e5a7"],
        [27, "#c4d178"],
        [65, "#9ead5d"],
        [100, "#647b49"],
      ],
      true,
    )}${gradient("hood", [
      [0, "#e1e7a0"],
      [38, "#b4c56a"],
      [100, "#657844"],
    ])}${gradient("pants", [
      [0, "#667e78"],
      [35, "#4b6260"],
      [80, "#304744"],
      [100, "#203834"],
    ])}${gradient(
      "shoe",
      [
        [0, "#fff5dd"],
        [40, "#e9e6d7"],
        [78, "#b0b9b0"],
        [100, "#768c82"],
      ],
      true,
    )}${gradient(
      "hair",
      [
        [0, "#53615c"],
        [32, "#353f3b"],
        [74, "#222d2a"],
        [100, "#152321"],
      ],
      true,
    )}${gradient(
      "bag",
      [
        [0, "#b47850"],
        [35, "#906344"],
        [75, "#5e4435"],
        [100, "#3f322b"],
      ],
      true,
    )}${gradient("strap", [
      [0, "#a17952"],
      [50, "#6f543a"],
      [100, "#463a2c"],
    ])}<filter id="soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${1.2}"/></filter>${gradient(
      "scarf",
      [
        [0, "#e4e5a7"],
        [40, "#b4c56a"],
        [100, "#657844"],
      ],
      true,
    )}</defs>`,
    look,
  );
}
function leg(p, near) {
  const phase = near ? p.near : p.far;
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
  const hipY = 117 + p.bob;
  const footX = hipX + (p.side ? p.sign * phase.travel : (near ? 1 : -1) * 1.1);
  const footY =
    (near ? 174 : p.side ? 170 : 173) +
    (!p.side ? p.sign * phase.travel * 0.48 : 0) -
    phase.lift;
  const kneeX =
    hipX +
    (footX - hipX) * 0.46 +
    (p.side ? p.sign * phase.knee * 0.37 : (near ? 1 : -1) * phase.knee * 0.08);
  const kneeY = (hipY + footY) / 2 - phase.knee * 0.14;
  const shape = `M${hipX - 7} ${hipY - 3} Q${hipX + 3} ${hipY - 5} ${hipX + 7} ${hipY} Q${hipX + 9} ${hipY + 12} ${kneeX + 6} ${kneeY} Q${kneeX + 8} ${kneeY + 9} ${footX + 5.3} ${footY - 5} Q${footX} ${footY - 1} ${footX - 5} ${footY - 4} Q${kneeX - 7} ${kneeY + 9} ${kneeX - 6} ${kneeY + 2} Z`;
  let body =
    path(shape, "url(#pants)") +
    line(
      `M${hipX - 3} ${hipY + 7} Q${kneeX - 3} ${kneeY - 4} ${kneeX - 2} ${kneeY + 4} L${footX - 2.1} ${footY - 7}`,
      "#7a8c7c",
      0.8,
      'opacity=".58"',
    ) +
    line(
      `M${kneeX + 3} ${kneeY + 3} l-4 1.5 M${footX - 3} ${footY - 7} q4 1 6 -.4`,
      "#233c36",
      0.8,
    );
  if (!near) body = group(body + path(shape, "#17322b", 'opacity=".14"'));
  body +=
    line(
      `M${kneeX - 4} ${kneeY - 3} q5 -2 9 1 M${kneeX - 3} ${kneeY + 5} l5 -1 M${footX - 4} ${footY - 9} q3 3 7 .5`,
      "#91a092",
      0.7,
      'opacity=".5"',
    ) +
    path(
      `M${hipX - 4} ${hipY + 5} Q${kneeX - 6} ${kneeY} ${footX - 3} ${footY - 9} L${footX} ${footY - 9} Q${kneeX - 2} ${kneeY} ${hipX} ${hipY + 5}Z`,
      "#aab394",
      'opacity=".13" filter="url(#soft)"',
    );
  const direction = p.side ? p.sign : p.back ? -0.35 : 0.35;
  const sole = `M-5 -5 Q-4 -8 1 -7 Q7 -8 10 -3 Q12 0 8 2 Q0 4 -5 1 Q-7 -1 -5 -5Z`;
  const shoe = group(
    path(sole, "#576d62") +
      path(
        "M-5 -7 Q-3 -11 1 -10 Q7 -10 10 -5 Q11 -2 7 -.5 Q0 1 -5 -1Z",
        "url(#shoe)",
      ) +
      path("M-3 -7 Q0 -10 3 -8 L6 -5 Q2 -3 -3 -4Z", "#f5f0dc", 'opacity=".7"') +
      (p.back
        ? line("M-3 -7 Q0 -4 3 -6 M-4 -3 Q0 -1 5 -3", "#829586", 0.65)
        : line(
            "M-1 -6 l4 .7 M-1 -4.5 l4 .7 M-4 -1 Q2 1 9 -2",
            "#829586",
            0.65,
          )) +
      line(
        "M-3 -.4 l1 .5 M0 .5 l1 .1 M3 .5 l1 -.1 M6 -.1 l1 -.5",
        "#476457",
        0.55,
      ),
    `translate(${f(footX)} ${f(footY)}) rotate(${p.side ? f(p.sign * phase.toe * 0.35) : 0}) scale(${direction < 0 ? -1 : 1} 1)`,
  );
  return {
    body,
    shoe,
    shadow: ellipse(
      f(footX + 1),
      f(footY + phase.lift + 1),
      7.5,
      2.2,
      "#293e2e",
      `opacity="${phase.lift > 3 ? 0.04 : 0.16}"`,
    ),
  };
}
function arm(p, near) {
  const shoulderX = p.side ? (near ? 70 : 53) : near ? 84 : 43;
  const phase = near ? p.far : p.near;
  const swing = phase.travel * 0.36;
  const handX =
    shoulderX +
    p.shoulder +
    (p.side
      ? p.sign * swing * 1.35
      : (near ? 1 : -1) * (2 + Math.abs(swing) * 0.13));
  const shoulderY = 70 + p.bob;
  const handY =
    113 + p.bob + (!p.side ? p.sign * swing * 0.28 : -Math.abs(swing) * 0.35);
  const elbowX =
    shoulderX +
    (handX - shoulderX) * 0.5 +
    (p.side ? p.sign * 3 : near ? 2 : -2);
  const elbowY = shoulderY + 23 - Math.abs(swing) * 0.25;
  return (
    path(
      `M${shoulderX - 5} ${shoulderY} Q${shoulderX} ${shoulderY - 4} ${shoulderX + 5} ${shoulderY} ${`Q${shoulderX + 9} ${shoulderY + 9}`} ${elbowX + 5} ${elbowY - 2} Q${elbowX + 6} ${elbowY + 1} ${elbowX + 4} ${elbowY + 6} L${handX + 4} ${handY - 6} Q${handX} ${handY - 3} ${handX - 4} ${handY - 6} L${elbowX - 4} ${elbowY + 4} Z`,
      "url(#cloth)",
    ) +
    line(
      `M${shoulderX - 2} ${shoulderY + 5} Q${elbowX - 3} ${elbowY - 1} ${elbowX - 2} ${elbowY + 3} M${elbowX - 3} ${elbowY + 3} l5 -1.5 M${handX - 4} ${handY - 7} q4 2 8 -.3`,
      "#879953",
      0.8,
    ) +
    line(
      `M${elbowX + 1} ${elbowY - 4} l3 3 M${elbowX - 2} ${elbowY + 6} l4 -1.3`,
      "#dbe0a1",
      0.8,
      'opacity=".6"',
    ) +
    group(
      path(
        "M-3 -4 Q-5 -2 -4 2 Q-4 5 -1 6 Q2 7 4 4 L4 -2 Q3 -5 1 -4Z",
        "url(#skin)",
      ) +
        path("M3 -2 Q6 -2 5 1 L3 3", "url(#skin)") +
        line("M-1 3 v2 M1 3 v2 M3 2 v2", "#8c573c", 0.45),
      `translate(${f(handX)} ${f(handY)}) rotate(${f(-swing * 0.7)})`,
    )
  );
}
function head(p) {
  const side = p.side;
  // Distinct left/right outlines: three-quarter yaw, NOT a mirrored front/profile sheet.
  const cx = side ? (p.sign > 0 ? 65 : 62) : 64;
  let headShape = side
    ? p.sign > 0
      ? "M52 34 Q53 21 65 22 Q77 22 78 35 Q79 39 83 42 Q84 44 79 45 Q78 54 72 59 Q67 63 60 57 Q53 53 52 44Z"
      : "M76 34 Q75 21 62 22 Q51 22 50 35 Q49 39 45 42 Q44 44 49 45 Q50 54 56 59 Q62 63 68 57 Q76 53 76 44Z"
    : "M50 32 Q51 20 64 20 Q78 21 79 34 L77 47 Q76 55 69 60 Q64 63 58 59 Q51 55 50 47Z";
  if (!side)
    headShape =
      "M50 32 Q51 20 64 20 Q78 21 79 34 Q81 43 76 51 Q72 58 67 59 Q61 62 56 56 Q49 49 50 32Z";
  const neck =
    path("M58 54 L58 67 Q64 73 71 66 L70 54Z", "url(#skin)") +
    path(
      "M58 56 Q65 62 70 55 L69 61 Q62 66 58 61Z",
      "#744833",
      'opacity=".35"',
    );
  let face =
    neck +
    ellipse(side ? (p.sign > 0 ? 53 : 75) : 49.5, 43, 3.2, 5.1, "url(#ear)") +
    (side ? "" : ellipse(78, 43, 2.7, 4.7, "url(#ear)")) +
    path(headShape, "url(#skin)") +
    path(
      side
        ? p.sign > 0
          ? "M55 36 Q58 28 67 30 L66 47 Q60 50 56 45Z"
          : "M71 35 Q68 28 58 31 L57 47 Q64 50 70 44Z"
        : "M54 32 Q58 26 65 29 Q68 34 64 43 Q57 49 53 43Z",
      "#efb68b",
      `opacity="${0.28}" filter="url(#soft)"`,
    );
  if (!p.back) {
    const eyes = side
      ? p.sign > 0
        ? [
            [65, 39, 2.7],
            [76, 39.5, 1.4],
          ]
        : [
            [58, 39, 2.7],
            [49, 39.5, 1.4],
          ]
      : [
          [57, 39.5, 2.8],
          [71, 39.5, 2.8],
        ];
    for (const [x, y, w] of eyes)
      face +=
        line(`M${x - w} ${y - 2.3} q${w} -1.5 ${w * 2} -.1`, "#403b2c", 0.8) +
        path(
          `M${x - w} ${y} Q${x} ${y - 2} ${x + w} ${y} Q${x} ${y + 2.2} ${x - w} ${y}Z`,
          "#f1e6c9",
        ) +
        ellipse(x + 0.4, y + 0.15, 0.95, 1.25, "#30372c") +
        ellipse(x + 0.1, y - 0.45, 0.3, 0.35, "#fff4db") +
        line(`M${x - w} ${y} Q${x} ${y - 2} ${x + w} ${y}`, "#594533", 0.55);
    const noseX = side ? (p.sign > 0 ? 76 : 51) : 64;
    face +=
      path(
        `M${noseX - 1} 40 Q${noseX - 2} 44 ${noseX - 2} 46 Q${noseX} 48 ${noseX + 2} 46`,
        "#955b3e",
        'opacity=".7"',
      ) + line(`M${noseX - 0.5} 42 l-.6 3`, "#e4ad7d", 0.7);
    const mouthX = side ? (p.sign > 0 ? 70 : 57) : 64;
    face +=
      line(
        `M${mouthX - 4} 51 Q${mouthX} ${55} ${mouthX + 4} 50.8`,
        "#754735",
        0.85,
      ) +
      path(
        `M${mouthX - 2.5} 51.5 Q${mouthX} 53 ${mouthX + 2.5} 51.5 Q${mouthX} 54 ${mouthX - 2.5} 51.5Z`,
        "#ead6b2",
        'opacity=".7"',
      ) +
      line(`M${mouthX - 2} 53.4 q2 .8 4 -.2`, "#d29b6b", 0.65) +
      ellipse(
        side ? (p.sign > 0 ? 64 : 59) : 56,
        47,
        3,
        1.8,
        "#d99b71",
        'opacity=".35" filter="url(#soft)"',
      );
  } else
    face += path(
      "M51 35 Q64 30 77 35 L76 47 Q73 54 69 57 Q62 60 56 54Z",
      "url(#skin)",
    );
  let hair = path(
    side
      ? p.sign > 0
        ? "M51 41 Q47 25 56 21 Q65 15 75 24 Q80 27 78 35 Q71 30 67 33 Q59 30 57 40 L56 47 L53 46Z"
        : "M77 41 Q80 25 72 21 Q61 15 52 24 Q48 28 50 35 Q57 30 62 33 Q70 30 71 40 L72 47 L75 46Z"
      : p.back
        ? "M49 35 Q47 24 55 20 Q67 16 76 23 Q82 28 79 40 L76 50 Q65 57 53 49Z"
        : "M49 39 Q47 25 55 21 Q64 17 74 22 Q81 27 78 40 L75 41 L74 34 Q66 37 58 33 Q53 34 52 42 L50 43Z",
    "url(#hair)",
  );
  hair +=
    ellipse(64, 25, 10, 3.5, "#627266", 'opacity=".35" filter="url(#soft)"') +
    path(
      side
        ? "M54 26 Q64 19 73 26 Q64 24 56 31Z"
        : "M53 25 Q64 19 75 26 Q69 31 57 29Z",
      "#627266",
      `opacity="${0.48}" filter="url(#soft)"`,
    );
  for (let i = 0; i < 9; i++)
    hair +=
      ellipse(
        52 + i * 2.9,
        22.5 + Math.abs(i - 4) * 0.5,
        2.6,
        1.5,
        "url(#hair)",
      ) +
      line(
        `M${51 + i * 2.9} ${22 + Math.abs(i - 4) * 0.5} q1 -1 2 .2`,
        "#8a937f",
        0.55,
        'opacity=".35"',
      );
  for (let row = 0; row < 2; row++)
    for (let col = 0; col < 6; col++) {
      const x = 54 + col * 3.5 + (row % 2) * 1.2,
        y = 24 + row * 3.2 + Math.abs(col - 2.5) * 0.6;
      hair += line(
        `M${x} ${y + 1} q-.7 -1.9 1.1 -1.5 q1.8 .4 .5 1.8`,
        "#778476",
        0.6,
        `opacity="${0.18 + (5 - col) * 0.035}"`,
      );
    }
  return {
    face: group(
      face,
      `translate(64 ${62 + p.bob}) scale(.94 .86) translate(-64 -62)`,
    ),
    hair: group(
      hair,
      `translate(64 ${62 + p.bob}) scale(.94 .86) translate(-64 -62)`,
    ),
    cx,
  };
}
export function layers(
  look,
  direction = "down",
  state = "idle",
  frame = 0,
  shadow = true,
) {
  validateLook(look);
  const p = pose(direction, state, frame),
    near = leg(p, true),
    far = leg(p, false),
    h = head(p);
  const torsoShape = p.side
    ? p.sign > 0
      ? "M55 64 Q66 61 75 70 Q81 78 78 93 L78 116 Q65 123 50 115 L50 93 Q47 77 55 64Z"
      : "M73 64 Q61 61 51 70 Q45 78 49 93 L49 116 Q63 123 78 115 L78 93 Q81 77 73 64Z"
    : "M50 66 Q64 60 79 67 Q86 71 84 83 Q81 98 82 110 Q80 117 77 118 Q64 125 49 117 Q44 114 45 109 Q47 96 43 82 Q42 72 50 66Z";
  let torso =
    path(torsoShape, "url(#cloth)") +
    path(
      p.side
        ? "M55 72 Q62 68 67 73 L63 104 Q59 112 52 106Z"
        : "M50 74 Q57 68 63 74 L61 106 Q55 115 49 109Z",
      "#e7eaa6",
      `opacity="${0.35}" filter="url(#soft)"`,
    ) +
    path(
      p.side
        ? p.sign > 0
          ? "M74 76 Q82 82 78 112 L70 117 Q72 98 70 83Z"
          : "M75 78 Q80 85 78 113 L69 118 Q74 99 71 88Z"
        : "M76 79 Q86 85 79 114 L69 118 Q77 104 74 87Z",
      "#526d42",
      'opacity=".22" filter="url(#soft)"',
    );
  torso +=
    path(
      "M47 71 Q53 61 61 63 L64 71 Q55 70 49 77Z",
      "#e4e5a7",
      'opacity=".62"',
    ) +
    path(
      "M67 64 Q78 64 83 73 L78 80 Q76 70 67 72Z",
      "#657844",
      'opacity=".25" filter="url(#soft)"',
    );
  torso +=
    path(
      p.back
        ? "M51 64 Q64 56 77 64 Q82 72 73 82 Q62 86 50 77 Q46 70 51 64Z"
        : "M51 64 Q63 56 76 64 Q80 70 73 77 Q63 83 52 75 Q47 69 51 64Z",
      "url(#hood)",
    ) +
    path(
      p.back
        ? "M52 64 Q64 58 76 65 Q76 74 63 77 Q53 73 52 64Z"
        : "M53 64 Q64 57 74 64 Q72 71 64 72 Q55 71 53 64Z",
      p.back ? "#8d9e53" : "#5c7144",
    ) +
    line(
      p.back ? "M55 75 Q64 81 73 76" : "M56 72 Q63 77 73 72",
      "#e1e6a0",
      0.9,
    );
  if (!p.back)
    torso +=
      line(
        p.side
          ? `M${p.sign > 0 ? 70 : 55} 76 l.8 10`
          : "M58 76 l-1 10 M69 76 l1 10",
        "#e9e7bd",
        0.75,
      ) +
      path(
        p.side
          ? "M58 97 Q65 94 73 97 L72 110 Q64 114 56 110Z"
          : "M53 97 Q64 94 76 97 L74 110 Q64 114 54 110Z",
        "#abc067",
        'opacity=".65"',
      ) +
      line(
        p.side
          ? "M59 98 l-3 6 M72 98 l1 6 M57 111 q8 3 15 -.6"
          : "M56 99 l-3 5 M73 99 l3 5 M54 111 q10 3 20 -.5",
        "#7f9651",
        0.7,
      );
  torso +=
    line("M49 115 Q65 120 78 115 M50 91 l4 3 M74 92 l3 -4", "#637e47", 0.8) +
    line("M51 113 Q63 117 75 114", "#d2dc8b", 0.7);
  for (let i = 0; i < 4; i++)
    torso += line(
      `M${50 + i * 3} ${80 + (i % 3) * 4} q${2 + (i % 2)} 6 1 12`,
      i % 2 ? "#e8e5ac" : "#809657",
      0.75,
      'opacity=".14"',
    );
  torso = group(torso, `translate(0 ${p.bob})`);
  const bagX = p.side ? (p.sign > 0 ? 47 : 78) : p.back ? 61 : 64;
  let bag = group(
    path(
      "M-11 -14 Q-12 -24 0 -25 Q13 -23 14 -13 L14 13 Q8 22 -3 21 Q-13 21 -14 12Z",
      "url(#bag)",
    ) +
      path("M-10 -15 Q-8 -24 0 -24 Q9 -23 12 -15 Q4 -10 -10 -15Z", "#b58156") +
      path(
        "M7 -14 Q14 -10 13 14 Q10 19 6 20 L5 -10Z",
        "#3e342b",
        'opacity=".35"',
      ) +
      path("M-8 1 Q0 -2 8 1 L8 12 Q0 16 -8 12Z", "#936547") +
      line("M-8 2 Q0 -1 8 2 M-6 -12 Q1 -16 8 -12", "#d0a26e", 0.8) +
      line("M9 -11 L10 10 M-2 -21 q1 -5 4 -.5", "#d2a878", 0.8) +
      path("M-2 5 h4 v2 h-4Z", "#d7c18c"),
    `translate(${bagX} ${p.side ? 91 : 92 + p.bob})`,
  );
  let straps = p.back
    ? bag
    : p.side
      ? line(
          p.sign > 0 ? "M59 67 Q52 77 53 93" : "M69 67 Q77 78 76 93",
          "#4e4332",
          3.4,
        ) +
        line(
          p.sign > 0 ? "M59 67 Q54 79 55 90" : "M69 67 Q75 78 74 90",
          "#b39462",
          1.1,
        )
      : line("M51 68 Q49 82 53 94 M77 68 Q80 82 76 94", "#4d4431", 3.3) +
        line("M51 69 Q51 84 54 93 M77 69 Q78 82 75 92", "#b09c67", 1.1) +
        path("M51 90 h4 v3 h-4Z M75 90 h4 v3 h-4Z", "#c2b886");
  straps = group(straps, `translate(0 ${p.bob})`);
  const result = {
    defs: definitions(look),
    "ground-shadow": shadow
      ? ellipse(64, 177, 22, 5, "#283d2b", 'opacity=".13"') +
        far.shadow +
        near.shadow
      : "",
    "back-accessory": look.accessory === "backpack" && !p.back ? bag : "",
    "far-leg": far.body,
    "far-shoe": far.shoe,
    "near-leg": near.body,
    "near-shoe": near.shoe,
    "lower-clothing": group(
      path(
        "M48 111 Q64 114 79 111 L78 123 Q71 127 64 122 Q56 127 49 123Z",
        "url(#pants)",
      ) + line("M64 116 v6 M51 115 l-.5 5 M76 115 l.5 5", "#7c8e7d", 0.7),
      `translate(0 ${p.bob})`,
    ),
    "far-arm": arm(p, false),
    "torso-and-hood": torso,
    "head-and-face": h.face,
    "hair-or-covering": h.hair,
    "near-arm": arm(p, true),
    "backpack-or-straps": look.accessory === "backpack" ? straps : "",
  };
  if (look.bottom === "skirt") {
    // Bare calves have their own tapered surface, without trouser seam marks.
    for (const [name, near] of [
      ["far-leg", false],
      ["near-leg", true],
    ]) {
      const phase = near ? p.near : p.far;
      const hip = p.side
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
      const x = hip + (p.side ? p.sign * phase.travel : (near ? 1 : -1) * 1.1);
      const y =
        (near ? 174 : p.side ? 170 : 173) +
        (!p.side ? p.sign * phase.travel * 0.48 : 0) -
        phase.lift;
      const kneeX =
        hip +
        (x - hip) * 0.46 +
        (p.side
          ? p.sign * phase.knee * 0.37
          : (near ? 1 : -1) * phase.knee * 0.08);
      const kneeY = (117 + p.bob + y) / 2 - phase.knee * 0.14;
      result[name] = path(
        `M${hip - 5} 116 Q${hip} 113 ${hip + 5} 117 L${kneeX + 4} ${kneeY} Q${kneeX + 5} ${kneeY + 7} ${x + 3.5} ${y - 5} Q${x} ${y - 2} ${x - 3.5} ${y - 5} L${kneeX - 4} ${kneeY + 2}Z`,
        "url(#skin)",
      );
    }
    result["lower-clothing"] = skirt(p);
  }
  if (look.hair !== "crop") result["hair-or-covering"] = hairstyle(p, look);
  // Elevated front/back plane: projected torso has a shorter far shoulder and
  // one broader near plane. Head pitch, collar and shoes share this projection.
  if (!p.side) {
    for (const name of [
      "far-arm",
      "torso-and-hood",
      "near-arm",
      "backpack-or-straps",
    ])
      if (result[name])
        result[name] = group(result[name], `matrix(1 -.095 .10 .95 -8.3 9.1)`);
  }
  const sway = `translate(${p.hip} 0)`;
  result["lower-clothing"] = group(result["lower-clothing"], sway);
  result["torso-and-hood"] = group(
    result["torso-and-hood"],
    `translate(${p.shoulder} 0)`,
  );
  // Material palette maps all semantic highlights/shadows, not only the flat base.
  for (const name of layerNames) result[name] = recolour(result[name], look);
  return result;
}
export function svg(
  look,
  direction = "down",
  state = "idle",
  frame = 0,
  shadow = true,
  only = null,
) {
  const parts = layers(look, direction, state, frame, shadow);
  if (only && !layerNames.includes(only))
    throw new Error("INVALID_SELECTION_LAYER");
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" width="128" height="192" viewBox="0 0 128 192">${parts.defs}${layerNames
    .filter((name) => !only || name === only)
    .map(
      (name) =>
        `<g id="${name}" inkscape:groupmode="layer" inkscape:label="${name}">${parts[name]}</g>`,
    )
    .join("")}</svg>`;
}
