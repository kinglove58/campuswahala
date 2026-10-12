/** Original M1 vector anatomy and cloth, revision 2. No raster tracing.
 * Coordinates are a fixed elevated orthographic projection, not identity traits.
 * Stance moves linearly backwards; swing bends at the knee and clears the floor.
 */
export const gait = {
  fps: 8,
  projectedStride: { down: 39.6, up: 39.6, left: 72, right: 72 },
  phases: [
    "contact",
    "plant",
    "passing-stance",
    "push-off",
    "opposite-contact",
    "lift",
    "passing-swing",
    "lower",
  ],
};
const travel = [18, 9, 0, -9, -18, -9, 0, 12];
const clearance = [0, 0, 0, 1, 4, 11, 13, 8];
const kneeBend = [0, 1, 1, 2, 7, 15, 17, 8];
const heelRoll = [-9, 0, 0, 13, 22, -9, -12, -13];
export function pose(state, frame) {
  if (
    !["idle", "walk"].includes(state) ||
    !Number.isInteger(frame) ||
    frame < 0 ||
    frame >= (state === "walk" ? 8 : 2)
  )
    throw new Error("INVALID_M1_POSE");
  const leg = (index) => ({
    travel: travel[index],
    lift: clearance[index],
    bend: kneeBend[index],
    roll: heelRoll[index],
    phase: gait.phases[index],
  });
  return state === "walk"
    ? {
        near: leg(frame),
        far: leg((frame + 4) % 8),
        bob: [0, 1, 0.25, -0.8, 0, 1, 0.25, -0.8][frame],
        sway: [0.7, 1.2, 0.6, 0, -0.7, -1.2, -0.6, 0][frame],
        twist: travel[frame] / 18,
      }
    : {
        near: { travel: 0, lift: 0, bend: 0, roll: 0 },
        far: { travel: 0, lift: 0, bend: 0, roll: 0 },
        bob: frame * -0.5,
        sway: frame * 0.18,
        twist: 0,
      };
}
const P = (d, fill, extra = "") => `<path d="${d}" fill="${fill}" ${extra}/>`;
const E = (x, y, rx, ry, fill, extra = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const L = (d, opacity = 0.25, width = 0.7, color = "#302a29") =>
  P(
    d,
    "none",
    `stroke="${color}" stroke-width="${width}" opacity="${opacity}" stroke-linecap="round" stroke-linejoin="round"`,
  );
const tint = (hex, factor) =>
  `#${hex
    .slice(1)
    .match(/../g)
    .map((c) =>
      Math.max(0, Math.min(255, Math.round(parseInt(c, 16) * factor)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
const grad = (id, color, radial = false) => {
  const stops = `<stop stop-color="${tint(color, 1.2)}"/><stop offset=".4" stop-color="${color}"/><stop offset=".82" stop-color="${tint(color, 0.82)}"/><stop offset="1" stop-color="${tint(color, 0.65)}"/>`;
  return radial
    ? `<radialGradient id="${id}" cx=".28" cy=".22" r=".88">${stops}</radialGradient>`
    : `<linearGradient id="${id}" x1="0" y1="0" x2=".94" y2=".42">${stops}</linearGradient>`;
};
export function drawLayers(
  look,
  direction,
  state,
  frame,
  palettes,
  expression = "warm",
) {
  if (!["warm", "attentive", "soft"].includes(expression))
    throw new Error("INVALID_M1_EXPRESSION");
  const q = pose(state, frame),
    back = direction === "up",
    left = direction === "left",
    side = left || direction === "right",
    sign = left ? -1 : 1;
  const skin = palettes.skin[look.skin],
    hairColor = palettes.hairColour[look.hairColour],
    cloth = palettes.top[look.top];
  const ink =
    'stroke="#29312f" stroke-opacity=".42" stroke-width=".65" stroke-linejoin="round"';
  const defs = `<defs><filter id="soft-volume" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.4"/></filter>${grad("skin", skin, true)}${grad("limb", skin)}${grad("cloth", cloth, true)}${grad("sleeve", cloth)}${grad("hair", hairColor, true)}${grad("denim", "#405362")}${grad("shoe", palettes.shoes[look.shoes], true)}${grad("bag", "#a77c50", true)}${grad("scarf", "#ddbd90", true)}</defs>`;
  const bodyTransform = `translate(${q.sway},${q.bob}) rotate(${q.twist * (side ? 0.7 : 0.9)},64,91)`;
  const wrap = (s) => `<g transform="${bodyTransform}">${s}</g>`;
  function leg(near) {
    const p = near ? q.near : q.far,
      hip = side ? (near ? 66 : 59) : near ? 74 : 54;
    const dx = side ? p.travel * sign : p.travel * 0.09;
    const ankle = hip + dx;
    const floor =
      state === "idle"
        ? 172
        : side
          ? 172 - p.lift
          : 168 + p.travel * (back ? -0.55 : 0.55) - p.lift;
    const knee =
      hip + (side ? (p.travel * 0.4 + p.bend * 0.52) * sign : dx * 0.5);
    const kneeY =
      143 - p.lift * 0.42 + (side ? 0 : p.travel * (back ? -0.16 : 0.16));
    const trouser = look.bottom === "trousers";
    const shape =
      P(
        `M${hip - 7} 116 Q${hip} 113 ${hip + 7} 116 Q${knee + 7} ${kneeY - 12} ${knee + 5} ${kneeY} Q${ankle + 5} ${floor - 13} ${ankle + 4} ${floor} Q${ankle} ${floor + 2} ${ankle - 4} ${floor} Q${ankle - 5} ${floor - 14} ${knee - 5} ${kneeY + 1} Q${knee - 9} ${kneeY - 13} ${hip - 7} 116Z`,
        trouser ? "url(#denim)" : "url(#limb)",
        ink,
      ) +
      P(
        `M${hip - 5} 120 Q${knee - 6} ${kneeY - 3} ${knee - 2} ${kneeY + 4} L${ankle - 2} ${floor - 6} Q${ankle - 5} ${floor - 13} ${knee - 5} ${kneeY + 1}Z`,
        trouser ? "#718291" : tint(skin, 1.25),
        'opacity=".22"',
      ) +
      (trouser
        ? L(
            `M${knee - 4} ${kneeY - 2} Q${knee} ${kneeY + 2} ${knee + 4} ${kneeY} M${knee - 3} ${kneeY + 3} L${knee + 2} ${kneeY + 5} M${ankle - 3} ${floor - 5} Q${ankle} ${floor - 2} ${ankle + 4} ${floor - 5}`,
            0.42,
            0.65,
          )
        : E(knee - 1, kneeY - 1, 3.4, 2.5, tint(skin, 1.2), 'opacity=".16"'));
    // Separate sole and upper; rolling rotates about the ankle, never the whole leg.
    const toe = side ? sign * 8 : back ? -1 : 2;
    const foot =
      `<g transform="rotate(${side ? p.roll * sign : p.roll * 0.25},${ankle},${floor})">` +
      P(
        left
          ? `M${ankle + 4} ${floor - 4} Q${ankle} ${floor - 6} ${ankle - 4} ${floor - 2} Q${ankle - 13} ${floor} ${ankle - 15} ${floor + 2} Q${ankle - 15} ${floor + 6} ${ankle - 5} ${floor + 6} L${ankle + 6} ${floor + 4} Q${ankle + 7} ${floor} ${ankle + 4} ${floor - 4}Z`
          : `M${ankle - 4} ${floor - 4} Q${ankle + 2} ${floor - 6} ${ankle + 5} ${floor - 2} Q${ankle + toe + 7} ${floor} ${ankle + toe + 7} ${floor + 3} Q${ankle + toe} ${floor + 7} ${ankle - 7} ${floor + 4} Q${ankle - 9} ${floor} ${ankle - 4} ${floor - 4}Z`,
        "url(#shoe)",
        ink,
      ) +
      P(
        left
          ? `M${ankle - 15} ${floor + 2} Q${ankle - 6} ${floor + 5} ${ankle + 6} ${floor + 2} L${ankle + 6} ${floor + 5} Q${ankle - 4} ${floor + 8} ${ankle - 15} ${floor + 5}Z`
          : `M${ankle - 7} ${floor + 2} Q${ankle + toe} ${floor + 5} ${ankle + toe + 7} ${floor + 1} L${ankle + toe + 7} ${floor + 4} Q${ankle + toe} ${floor + 8} ${ankle - 7} ${floor + 5}Z`,
        "#e2dfd3",
        ink,
      ) +
      L(
        `M${ankle - 2} ${floor - 1} L${ankle + 3} ${floor} M${ankle - 2} ${floor + 1} L${ankle + 4} ${floor + 2}`,
        0.58,
        0.65,
        look.shoes === "white" ? "#667276" : "#c1bdb1",
      ) +
      "</g>";
    return {
      leg: `<g opacity="${side && !near ? 0.87 : 1}">${shape}</g>`,
      shoes: foot,
    };
  }
  function arm(near) {
    const p = near ? q.near : q.far,
      swing = -p.travel;
    const shoulder = side ? (near ? 67 : 59) : near ? 83 : 45;
    const elbow =
      shoulder + (side ? swing * sign * 0.42 : (near ? 4 : -4) + swing * 0.08);
    const wrist = shoulder + (side ? swing * sign * 0.83 : swing * 0.16);
    const ey = 101 - Math.abs(swing) * 0.1,
      wy = 124 - Math.abs(swing) * 0.26 + (side ? 0 : swing * 0.22);
    const sleeve = P(
      `M${shoulder - 5} 73 Q${shoulder + 3} 69 ${shoulder + 7} 78 Q${elbow + 6} ${ey - 5} ${elbow + 5} ${ey + 2} Q${elbow} ${ey + 5} ${elbow - 5} ${ey + 1} Q${elbow - 8} ${ey - 8} ${shoulder - 8} 82 Q${shoulder - 9} 77 ${shoulder - 5} 73Z`,
      "url(#sleeve)",
      ink,
    );
    const forearm =
      P(
        `M${elbow - 4} ${ey} Q${elbow + 1} ${ey - 2} ${elbow + 4} ${ey + 1} Q${wrist + 3} ${wy - 9} ${wrist + 4} ${wy - 3} Q${wrist + 7} ${wy + 1} ${wrist + 3} ${wy + 4} Q${wrist} ${wy + 7} ${wrist - 3} ${wy + 3} L${wrist - 5} ${wy - 2} Q${wrist - 3} ${wy - 5} ${elbow - 4} ${ey}Z`,
        "url(#limb)",
        ink,
      ) +
      P(
        `M${wrist - 3} ${wy - 2} Q${wrist - 7} ${wy - 5} ${wrist - 6} ${wy - 1} Q${wrist - 5} ${wy + 2} ${wrist - 2} ${wy + 2}Z`,
        "url(#skin)",
        ink,
      ) +
      L(
        `M${wrist + 1} ${wy + 1} L${wrist + 2} ${wy + 3} M${wrist + 3} ${wy} L${wrist + 4} ${wy + 2}`,
        0.27,
        0.45,
      );
    return wrap(
      forearm +
        sleeve +
        L(
          `M${shoulder - 4} 85 Q${elbow - 1} ${ey - 10} ${elbow + 3} ${ey - 7} M${elbow - 4} ${ey} Q${elbow} ${ey + 2} ${elbow + 4} ${ey - 1}`,
          0.27,
        ),
    );
  }
  const torsoShape = side
    ? left
      ? "M59 61 Q69 61 74 72 Q79 84 75 99 Q75 110 71 116 Q62 120 51 114 Q50 101 50 91 Q47 75 53 67Z"
      : "M54 62 Q64 60 70 67 Q78 76 77 89 Q78 106 74 115 Q62 120 53 115 Q49 102 50 88 Q46 73 54 62Z"
    : "M53 63 Q63 68 74 63 Q82 65 87 76 Q89 83 83 88 L80 98 Q81 108 79 116 Q63 122 48 116 Q46 108 48 98 L44 87 Q37 83 41 75 Q44 66 53 63Z";
  const torso = wrap(
    P(torsoShape, "url(#cloth)", ink) +
      P(
        side
          ? "M52 80 Q60 80 64 88 L62 114 Q56 118 52 113Z"
          : "M46 83 Q55 89 55 98 Q53 108 56 117 L48 114 Q46 105 48 97Z",
        tint(cloth, 0.7),
        'opacity=".25"',
      ) +
      P(
        side
          ? "M58 71 Q65 69 70 75 L69 100 Q65 103 62 99Z"
          : "M54 74 Q63 78 72 74 Q77 86 74 94 Q64 91 57 98 Q52 87 54 74Z",
        tint(cloth, 1.25),
        'opacity=".23" filter="url(#soft-volume)"',
      ) +
      P(
        back
          ? "M51 64 Q64 73 77 64 Q80 78 65 83 Q51 80 49 71Z"
          : side
            ? left
              ? "M56 63 Q64 67 70 65 L71 73 Q59 75 54 69Z"
              : "M55 65 Q62 68 69 63 L72 70 Q61 76 53 70Z"
            : "M52 64 Q64 75 76 64 L79 70 Q65 83 49 71Z",
        "url(#sleeve)",
        ink,
      ) +
      L(
        side
          ? "M54 90 Q58 94 55 101 M70 99 Q73 105 69 110 M54 114 Q63 118 72 113"
          : "M49 91 Q54 94 51 102 M76 92 Q71 100 76 106 M50 111 Q61 115 69 111 M74 111 Q76 111 79 109",
        0.25,
        0.8,
      ) +
      P(
        side
          ? "M53 113 Q65 117 74 113 L73 118 Q64 122 53 118Z"
          : "M48 114 Q64 120 80 114 L79 119 Q64 125 49 119Z",
        tint(cloth, 0.87),
        ink,
      ) +
      (!back
        ? L(
            side
              ? "M60 75 L59 87 M65 74 L67 85"
              : "M58 77 Q57 82 57 89 M70 77 Q72 82 72 88",
            0.85,
            0.8,
            "#eadfc7",
          )
        : "") +
      (!back && !side
        ? P(
            "M56 97 Q65 99 73 96 L73 107 Q64 112 54 107Z",
            tint(cloth, 0.91),
            'stroke="#3c5140" stroke-opacity=".22" stroke-width=".5"',
          ) + L("M57 99 Q55 101 56 104 M72 98 Q75 100 73 105", 0.25)
        : ""),
  );
  const skirtSway = q.twist * 1.4;
  const lower =
    look.bottom === "skirt"
      ? wrap(
          P(
            side
              ? `M52 116 Q64 120 75 115 Q78 131 ${81 + skirtSway} 148 Q65 156 ${45 + skirtSway} 148 Q50 133 52 116Z`
              : `M48 116 Q64 120 80 115 Q83 131 ${88 + skirtSway} 148 Q64 158 ${40 + skirtSway} 148 Q45 132 48 116Z`,
            "url(#denim)",
            ink,
          ) +
            P(
              side
                ? "M55 120 Q60 124 58 147 L51 150 Q52 134 55 120Z"
                : "M52 120 Q57 125 53 149 L45 151 Q49 135 52 120Z",
              "#7c8b92",
              'opacity=".24"',
            ) +
            L(
              side
                ? "M58 122 Q56 136 54 146 M71 122 Q71 136 76 148"
                : `M53 122 Q51 138 ${48 + skirtSway} 149 M64 123 Q62 138 64 151 M75 122 Q77 138 ${82 + skirtSway} 149`,
              0.36,
              0.75,
            ) +
            L(
              side ? "M47 147 Q64 154 80 147" : "M42 147 Q64 155 86 147",
              0.4,
              0.7,
            ),
        )
      : wrap(
          P(
            side
              ? "M51 116 Q65 121 75 116 L76 125 Q65 128 51 125Z"
              : "M48 116 Q65 121 80 116 L80 124 Q65 129 48 124Z",
            "url(#denim)",
            "",
          ) +
            L(
              side
                ? "M57 120 Q56 125 53 126"
                : "M51 120 Q53 125 49 127 M76 120 Q74 125 79 127 M64 120 L64 129",
              0.4,
            ),
        );
  // Softer cheeks and a short rounded profile nose; small upper eyelids carry expression.
  const headShape = back
    ? "M49 29 Q51 21 64 21 Q77 21 80 31 L79 46 Q77 57 65 61 Q53 59 49 48Z"
    : left
      ? "M72 26 Q61 21 52 27 Q48 31 48 37 Q47 40 45 42 Q44 44 48 45 Q48 49 51 53 Q54 60 63 60 Q72 59 77 50 Q80 38 76 30Z"
      : side
        ? "M55 26 Q66 21 75 27 Q79 31 79 37 Q80 40 82 42 Q83 44 79 45 Q79 49 76 53 Q73 60 64 60 Q55 59 50 50 Q47 38 51 30Z"
        : "M50 30 Q52 22 64 22 Q76 22 79 31 Q81 40 77 49 Q74 57 66 61 Q59 62 54 57 Q47 51 48 42 Q46 35 50 30Z";
  let face =
    P("M58 51 Q65 53 71 51 L72 65 Q65 71 57 65Z", "url(#skin)", ink) +
    P(
      "M58 56 Q65 63 71 57 L71 62 Q65 66 58 63Z",
      tint(skin, 0.68),
      'opacity=".34"',
    ) +
    P(headShape, "url(#skin)", ink);
  if (!back) {
    face +=
      E(side ? (left ? 74 : 54) : 48, 42, 2.8, 4.7, "url(#skin)", ink) +
      (side ? "" : E(79, 42, 2.8, 4.7, "url(#skin)", ink)) +
      L(
        side
          ? left
            ? "M74 40 Q72 41 74 44"
            : "M54 40 Q56 41 54 44"
          : "M48 40 Q51 41 48 44 M79 40 Q76 41 79 44",
        0.28,
        0.5,
      );
    if (side) {
      const ex = left ? 53 : 74;
      face +=
        E(ex, 37.9, 3.3, expression === "soft" ? 1 : 1.8, "#e8ddc9") +
        E(
          ex + (left ? -0.8 : 0.8),
          38.1,
          1.35,
          expression === "soft" ? 0.85 : 1.7,
          "#302d26",
        ) +
        E(ex + (left ? -1.2 : 0.4), 37.6, 0.42, 0.45, "#f8eac9") +
        L(
          `M${ex - 3.4} 37.2 Q${ex} ${expression === "soft" ? 37 : 35.5} ${ex + 3.3} 37`,
          0.8,
          0.75,
        ) +
        L(
          `M${ex - 3.6} 33.7 Q${ex} 32 ${ex + 3.3} 33.6`,
          0.75,
          1.1,
          tint(hairColor, 0.8),
        ) +
        P(
          left
            ? "M49 42 Q51 43 49 45 Q46 46 46 44Z"
            : "M78 42 Q76 43 78 45 Q81 46 81 44Z",
          tint(skin, 0.87),
          'opacity=".48"',
        ) +
        L(
          left
            ? expression === "attentive"
              ? "M49 51 Q54 51.5 58 51"
              : "M49 50 Q54 53 59 50"
            : expression === "attentive"
              ? "M70 51 Q75 51.5 79 51"
              : "M69 50 Q74 53 79 50",
          0.55,
          0.65,
          "#704638",
        ) +
        P(
          left
            ? "M50 50 Q53 53 57 51 Q53 54 50 51Z"
            : "M72 51 Q76 53 78 50 Q78 53 73 53Z",
          tint(skin, 1.32),
          'opacity=".3"',
        );
    } else {
      for (const [ex, offset] of [
        [55.5, 0.3],
        [72.2, -0.5],
      ])
        face +=
          E(ex, 38, 3.4, expression === "soft" ? 0.95 : 1.8, "#e9decb") +
          E(
            ex + offset,
            38.1,
            1.38,
            expression === "soft" ? 0.85 : 1.7,
            "#332c25",
          ) +
          E(ex + offset - 0.35, 37.5, 0.45, 0.5, "#f8edcf") +
          L(
            `M${ex - 3.7} 37.4 Q${ex} ${expression === "soft" ? 37 : 35.4} ${ex + 3.6} 37.3`,
            0.85,
            0.7,
          );
      face +=
        L(
          "M52 33.5 Q56 32 59 34 M68.5 34 Q72 32 75.5 33.5",
          0.85,
          1.1,
          tint(hairColor, 0.8),
        ) +
        P(
          "M63 37 Q61 42 61.5 45 Q64 47 67 44 Q66 43 65.3 43 L65 37Z",
          tint(skin, 0.88),
          'opacity=".65"',
        ) +
        E(63, 43, 1.3, 1, tint(skin, 1.28), 'opacity=".52"') +
        L("M61.5 45 Q64 46.5 66.5 44.5", 0.29, 0.55) +
        (expression === "warm"
          ? P(
              "M57 50 Q60 49 63 50 Q67 51 72 49 Q70 54 64 54 Q59 54 57 50Z",
              tint(skin, 0.72),
              'opacity=".65"',
            ) +
            P(
              "M59 50.8 Q65 52 70 50.5 Q66 54 60 52Z",
              "#ece0c8",
              'opacity=".8"',
            )
          : L(
              expression === "soft"
                ? "M58 51 Q64 54.5 71 50.7"
                : "M59 51.7 Q64 52.5 70 51.5",
              0.62,
              0.7,
              tint(skin, 0.65),
            )) +
        L("M60 55 Q64 56 68 54.7", 0.18, 0.6, "#ffe4ba") +
        P(
          "M50 41 Q54 40 57 43 Q58 47 54 50 Q50 49 50 41Z",
          tint(skin, 1.35),
          'opacity=".2" filter="url(#soft-volume)"',
        );
    }
  }
  const head = `<g transform="translate(${q.sway * 0.3},${q.bob * 0.45})">${face}</g>`;
  let hair;
  if (look.hair === "covered") {
    hair =
      P(
        back
          ? "M45 43 Q38 21 58 17 Q81 13 86 33 L83 56 Q85 65 88 71 Q66 81 42 70 Q46 57 45 43Z"
          : side
            ? left
              ? "M76 52 Q84 29 73 21 Q60 13 49 23 Q43 29 45 39 L50 29 Q59 23 67 30 Q75 39 72 53 Q67 62 53 61 L49 69 Q66 79 83 70 Q75 63 76 52Z"
              : "M52 52 Q44 29 55 21 Q68 13 79 23 Q85 29 83 39 L78 29 Q69 23 61 30 Q53 39 56 53 Q61 62 75 61 L79 69 Q62 79 45 70 Q53 63 52 52Z"
            : "M46 44 Q39 24 52 19 Q67 11 80 21 Q88 28 83 44 L78 40 Q81 26 67 25 Q52 23 49 39 L49 49 Q54 64 66 65 Q76 64 79 54 L86 71 Q66 80 42 70 Q48 57 46 44Z",
        "url(#scarf)",
        ink,
      ) +
      L(
        back
          ? "M50 26 Q66 19 79 27 M61 29 Q60 48 68 64 M45 67 Q67 75 84 68"
          : side
            ? left
              ? "M52 24 Q66 16 77 31 M58 62 Q66 68 77 66 M53 68 Q66 74 79 68"
              : "M76 24 Q62 16 51 31 M70 62 Q62 68 51 66 M75 68 Q62 74 49 68"
            : "M50 28 Q59 19 73 24 M50 59 Q56 69 77 67 M46 69 Q66 75 82 69",
        0.25,
        0.85,
      ) +
      P(
        back
          ? "M52 26 Q59 21 64 23 L63 28Z"
          : side
            ? left
              ? "M48 28 Q59 18 72 24 L70 26 Q58 23 50 31Z"
              : "M80 28 Q69 18 56 24 L58 26 Q70 23 78 31Z"
            : "M48 28 Q59 18 72 24 L70 26 Q58 23 50 31Z",
        "#f0d8ac",
        'opacity=".28"',
      );
  } else {
    const cap = back
      ? "M46 42 Q40 26 50 20 Q62 12 77 20 Q86 25 82 44 Q78 57 65 59 Q51 56 46 42Z"
      : side
        ? left
          ? "M75 46 Q85 29 77 21 Q62 12 50 22 Q44 27 47 34 Q53 27 60 29 Q70 27 73 39Z"
          : "M53 46 Q43 29 51 21 Q66 12 78 22 Q84 27 81 34 Q75 27 68 29 Q58 27 55 39Z"
        : "M47 42 Q42 38 44 32 Q40 28 45 25 Q43 21 50 20 Q53 15 59 18 Q64 13 69 18 Q76 15 80 22 Q87 24 82 33 L80 42 L76 32 Q71 27 66 30 Q60 27 55 31 L49 34Z";
    hair = P(cap, "url(#hair)", ink);
    if (look.hair === "afro") {
      hair = P(
        side
          ? left
            ? "M76 49 Q85 47 85 39 Q91 34 86 28 Q87 20 80 18 Q77 10 70 14 Q64 8 58 13 Q50 9 46 18 Q37 17 39 26 Q34 33 40 38 Q38 44 46 45 L50 31 Q59 26 64 30 Q72 28 76 39Z"
            : "M52 49 Q43 47 43 39 Q37 34 42 28 Q41 20 48 18 Q51 10 58 14 Q64 8 70 13 Q78 9 82 18 Q91 17 89 26 Q94 33 88 38 Q90 44 82 45 L78 31 Q69 26 64 30 Q56 28 52 39Z"
          : "M43 44 Q36 41 39 35 Q33 30 39 24 Q38 17 46 17 Q47 9 55 13 Q61 7 67 12 Q75 8 80 16 Q89 16 88 24 Q96 28 90 35 Q93 42 83 45 L78 34 Q74 27 67 31 Q60 27 54 32 L48 36Z",
        "url(#hair)",
        ink,
      );
      if (back)
        hair = P(
          "M43 44 Q36 41 39 35 Q33 30 39 24 Q38 17 46 17 Q47 9 55 13 Q61 7 67 12 Q75 8 80 16 Q89 16 88 24 Q96 28 90 35 Q93 42 83 45 Q84 53 76 58 Q64 64 51 57 Q44 53 43 44Z",
          "url(#hair)",
          ink,
        );
      for (const [x, y, r] of [
        [47, 23, 3.2],
        [57, 18, 3.6],
        [67, 17, 3],
        [76, 23, 3.7],
        [43, 32, 2.7],
        [82, 32, 3],
        [54, 27, 2.8],
        [68, 25, 2.7],
      ])
        hair += L(
          `M${x - r} ${y} Q${x} ${y - r} ${x + r} ${y + 1}`,
          0.17,
          1.2,
          tint(hairColor, 2),
        );
    } else if (look.hair === "braids") {
      for (let i = 0; i < 6; i++)
        hair += L(
          `M${49 + i * 5} 29 Q${48 + i * 5} 22 ${56 + i * 3.5} 19`,
          0.26,
          1,
          tint(hairColor, 1.9),
        );
      for (const x of side ? [left ? 75 : 53] : [47, 81]) {
        const drift = q.twist * (x < 64 ? -1 : 1) * 1.2;
        hair += P(
          `M${x - 2} 32 Q${x + 4} 45 ${x + drift + 2} 58 Q${x + drift - 1} 67 ${x + drift + 3} 73 Q${x + drift} 77 ${x + drift - 3} 73 Q${x - 5} 60 ${x - 3} 48Z`,
          "url(#hair)",
          ink,
        );
        for (let y = 40; y < 72; y += 4)
          hair += L(
            `M${x - 2} ${y} Q${x + 2} ${y + 1} ${x + 1} ${y + 3}`,
            0.3,
            0.65,
            tint(hairColor, 1.8),
          );
      }
    } else {
      for (const [x, y] of [
        [49, 25],
        [54, 22],
        [59, 21],
        [65, 20],
        [71, 23],
        [76, 25],
        [51, 29],
        [57, 27],
        [69, 27],
      ])
        hair += L(
          `M${x - 1} ${y + 1} Q${x} ${y - 1} ${x + 2} ${y}`,
          0.18,
          0.9,
          tint(hairColor, 2),
        );
      hair += P(
        side
          ? left
            ? "M73 34 L76 32 76 44 73 48Z"
            : "M55 34 L52 32 52 44 55 48Z"
          : back
            ? "M50 47 Q64 56 78 47 Q74 59 65 59 Q56 57 50 47Z"
            : "M48 33 L51 31 50 40 48 42Z M78 32 L81 34 79 43 77 39Z",
        tint(hairColor, 0.7),
        'opacity=".55"',
      );
    }
  }
  hair = `<g transform="translate(${q.sway * 0.3},${q.bob * 0.45})">${hair}</g>`;
  let bag = "",
    straps = "";
  if (look.accessory === "backpack") {
    const bagShape = side
      ? left
        ? "M76 75 Q84 72 89 79 Q92 87 90 101 Q91 112 84 116 Q77 114 75 110 L73 86Z"
        : "M52 75 Q44 72 39 79 Q36 87 38 101 Q37 112 44 116 Q51 114 53 110 L55 86Z"
      : "M48 76 Q64 69 80 77 Q84 88 81 105 Q80 117 65 119 Q48 117 46 106 Q44 87 48 76Z";
    bag = wrap(
      P(bagShape, "url(#bag)", ink) +
        L(
          side
            ? left
              ? "M79 84 Q87 83 88 89 L87 107 Q83 113 78 108Z"
              : "M49 84 Q41 83 40 89 L41 107 Q45 113 50 108Z"
            : "M49 83 Q64 75 79 83 M49 98 Q64 92 78 98 L77 110 Q64 117 49 109Z",
          0.45,
          0.8,
        ) +
        P(
          side
            ? left
              ? "M79 78 Q84 76 87 81 L86 95 82 92Z"
              : "M49 78 Q44 76 41 81 L42 95 46 92Z"
            : "M50 80 Q60 75 65 78 L61 95 49 97Z",
          "#d2ad77",
          'opacity=".25"',
        ) +
        L(
          side
            ? left
              ? "M79 76 Q81 68 86 77"
              : "M49 76 Q47 68 42 77"
            : "M59 75 Q60 68 68 75",
          0.75,
          1.8,
        ),
    );
    straps = wrap(
      L(
        side
          ? left
            ? "M69 68 Q75 77 71 100"
            : "M59 68 Q53 77 57 100"
          : "M51 69 Q47 81 51 101 M77 69 Q81 81 77 101",
        0.9,
        3.2,
        "#525957",
      ) +
        L(
          side
            ? left
              ? "M69 69 Q73 78 70 97"
              : "M59 69 Q55 78 58 97"
            : "M52 70 Q49 82 52 98 M76 70 Q79 82 76 98",
          0.5,
          0.65,
          "#ded2b5",
        ),
    );
  }
  const far = leg(false),
    near = leg(true);
  return {
    defs,
    "ground-shadow": E(64, 178, side ? 22 : 24, 4, "#203c2c", 'opacity=".17"'),
    "back-accessory": !back ? bag : "",
    "far-leg": far.leg,
    "far-shoe": far.shoes,
    "near-leg": near.leg,
    "near-shoe": near.shoes,
    "lower-clothing": lower,
    "far-arm": arm(false),
    "torso-and-hood": torso,
    "head-and-face": head,
    "hair-or-covering": hair,
    "near-arm": arm(true),
    "backpack-or-straps": back ? bag : straps,
  };
}
