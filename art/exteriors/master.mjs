/** Original CampusWahala exterior vector master. No imported art/textures.
 * Elevated orthographic planes, north-west light, ground pivot at cell bottom.
 * Exported as one reusable 1024x768 SVG atlas per campus, not world-sized images.
 */
export const palettes = {
  futa: {
    style: "pitched",
    wall: "#edddbb",
    shade: "#c1ae85",
    roof: "#a65e43",
    roofLight: "#d18a61",
    glass: "#487379",
    leaf: "#426c4b",
    leafLight: "#91ad63",
    accent: "#b16e46",
    paving: 0xd8c5a1,
    ground: 0xb7c493,
  },
  oau: {
    style: "terrace",
    wall: "#dfd6bd",
    shade: "#aea590",
    roof: "#8f8877",
    roofLight: "#bab19a",
    glass: "#43696b",
    leaf: "#566e45",
    leafLight: "#a9b674",
    accent: "#a88b51",
    paving: 0xcac6af,
    ground: 0xc0c7a4,
  },
  unilag: {
    style: "canopy",
    wall: "#f1e8cc",
    shade: "#b8c7b9",
    roof: "#3f747a",
    roofLight: "#80abad",
    glass: "#356f81",
    leaf: "#337962",
    leafLight: "#8ac29a",
    accent: "#cf9c53",
    paving: 0xd4d6bd,
    ground: 0xb2cbb5,
  },
};
export const buildingKinds = [
  "lecture",
  "library",
  "hostel",
  "admin",
  "food",
  "pavilion",
];
export const propKinds = [
  "tree",
  "tree-wide",
  "palm",
  "shrub",
  "bench",
  "lamp",
  "notice",
  "bin",
  "sign",
  "kiosk",
  "shelter",
  "car",
  "shuttle",
  "planter",
  "cycle",
  "banner",
];
const rect = (x, y, w, h, fill, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" ${extra}/>`;
const path = (d, fill, extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
const ellipse = (x, y, rx, ry, fill, extra = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
function building(kind, p) {
  const tall = kind === "hostel" || kind === "library",
    bottom = 226,
    top = tall ? 58 : 94;
  let s = path(
    "M28 236L206 245L245 222L223 113L44 116Z",
    "#263d32",
    'opacity=".16"',
  );
  s += path(
    `M28 ${top + 20}L211 ${top + 20}L231 ${top + 5}V211L211 ${bottom}H28Z`,
    p.shade,
  );
  s += rect(28, top + 20, 183, bottom - top - 20, "url(#wall)");
  s += path(`M211 ${top + 20}L231 ${top + 5}V211L211 ${bottom}Z`, p.shade);
  s += rect(29, bottom - 10, 182, 10, "#aa9979");
  // Large roof planes and architectural grammar, not a recolored flat box.
  if (p.style === "pitched") {
    s += path(
      `M15 ${top + 24}L49 ${top - 18}L221 ${top - 18}L240 ${top + 10}L207 ${top + 36}Z`,
      p.roof,
    );
    s += path(
      `M15 ${top + 24}L49 ${top - 18}L207 ${top + 9}L207 ${top + 36}Z`,
      p.roofLight,
    );
    s += path(
      `M49 ${top - 18}L221 ${top - 18}L240 ${top + 10}L207 ${top + 9}Z`,
      p.roof,
    );
    for (let x = 25; x < 205; x += 12)
      s += path(
        `M${x} ${top + 25}L${x + 28} ${top - 12}`,
        "none",
        'stroke="#784b39" stroke-width="1" opacity=".4"',
      );
    s += path(
      `M16 ${top + 26}L207 ${top + 38}L240 ${top + 12}`,
      "none",
      'stroke="#6d4e3b" stroke-width="5"',
    );
  } else if (p.style === "terrace") {
    s += path(
      `M17 ${top + 16}L43 ${top - 10}H240L213 ${top + 16}Z`,
      p.roofLight,
    );
    s += rect(17, top + 16, 196, 14, p.roof);
    s += path(
      `M213 ${top + 16}L240 ${top - 10}V${top + 4}L213 ${top + 30}Z`,
      p.shade,
    );
    s += rect(22, top + 9, 186, 7, "#ece4ce");
    for (let x = 38; x < 210; x += 28)
      s += rect(x, top + 27, 9, bottom - top - 27, "#c5bda8");
  } else {
    s += path(
      `M12 ${top + 18}L44 ${top - 12}H239L207 ${top + 18}Z`,
      p.roofLight,
    );
    s += rect(12, top + 18, 195, 10, p.roof);
    s += path(
      `M207 ${top + 18}L239 ${top - 12}V${top - 2}L207 ${top + 28}Z`,
      p.roof,
    );
    s += rect(38, top + 30, 4, bottom - top - 30, "#f9f1d9");
    s += rect(196, top + 30, 4, bottom - top - 30, "#f9f1d9");
  }
  const rows = tall ? 2 : 1,
    wy = top + 50;
  for (let row = 0; row < rows; row++)
    for (let i = 0; i < 5; i++) {
      const x = 42 + i * 32,
        y = wy + row * 46;
      s += rect(x - 2, y - 2, 25, 28, "#eae3cb");
      s += rect(x, y, 21, 24, "url(#glass)");
      s += path(
        `M${x + 3} ${y + 2}H${x + 14}L${x + 3} ${y + 17}Z`,
        "#b4d1cc",
        'opacity=".5"',
      );
      s += rect(x + 10, y, 1, 24, "#b5c8bb");
      s += rect(x, y + 12, 21, 1, "#b5c8bb");
      s += rect(x - 3, y + 26, 27, 3, p.shade);
    }
  if (kind === "library") {
    s += rect(54, top + 30, 120, 16, p.accent);
    for (let i = 0; i < 6; i++)
      s += rect(59 + i * 19, top + 34, 12, 2, "#efe8d2");
  }
  if (kind === "lecture" || kind === "admin") {
    s += path("M69 192L94 175H172L153 192Z", p.roofLight);
    s += rect(69, 192, 84, 7, p.roof);
    for (const x of [75, 145]) {
      s += rect(x, 199, 6, 27, "#f2e9d1");
      s += rect(x - 2, 224, 10, 3, "#c4b493");
    }
  }
  if (kind === "hostel") {
    s += rect(32, 139, 173, 6, p.accent);
    s += rect(32, 147, 173, 12, p.shade);
    for (let i = 0; i < 14; i++) s += rect(35 + i * 12, 139, 2, 22, "#e7dfc8");
  }
  s += rect(106, 192, 29, 34, "#385552");
  s += rect(108, 194, 25, 30, "url(#glass)");
  s += rect(119, 193, 2, 32, "#cec7ac");
  s += rect(124, 211, 3, 2, "#dfc18b");
  s += path("M98 227H143L149 233H93Z", "#ece1c6");
  s += path("M93 233H149L155 239H87Z", "#cbbda0");
  s += path("M87 239H155L161 245H81Z", "#e4d7b9");
  if (kind === "food") {
    s += path("M24 167H207L214 188H17Z", p.accent);
    for (let i = 0; i < 10; i++)
      s += path(
        `M${24 + i * 18} 167H${33 + i * 18}L${35 + i * 18} 188H${16 + i * 18}Z`,
        "#f0d9a8",
      );
    s += rect(17, 188, 197, 5, p.roof);
    s += rect(40, 205, 50, 17, "#8f714d");
    s += rect(158, 205, 38, 17, "#8f714d");
  }
  if (kind === "pavilion") {
    s += rect(32, top + 52, 63, 55, p.shade);
    s += rect(147, top + 52, 57, 55, p.shade);
    s += path(`M30 ${top + 54}Q62 ${top + 19} 96 ${top + 54}Z`, p.wall);
  }
  s += rect(32, 217, 27, 9, p.accent);
  s += rect(176, 217, 28, 9, p.accent);
  return s;
}
function prop(kind, p) {
  let s = ellipse(73, 111, 35, 10, "#293f34", 'opacity=".16"');
  if (kind === "tree" || kind === "tree-wide") {
    s += path("M56 113L58 56L68 46L75 53L70 115Z", "#786247");
    s += path("M59 93L46 59L50 55L63 78L81 45L84 49L68 90Z", "#8e7551");
    s += path(
      "M17 69C2 52 15 39 26 35C21 11 43 4 58 14C73 0 102 12 104 29C128 30 129 56 115 66C117 83 92 93 79 82C62 96 39 82 31 84C14 85 8 76 17 69Z",
      "url(#leaf)",
    );
    for (let i = 0; i < 18; i++) {
      let x = 22 + ((i * 23) % 80),
        y = 23 + ((i * 19) % 49);
      s += path(
        `M${x} ${y}q5 -8 13 -4q-2 8 -13 4Z`,
        i % 3 ? p.leafLight : "#c6cd86",
        `opacity="${i % 3 ? 0.35 : 0.45}"`,
      );
    }
    s += path(
      "M22 40Q29 17 50 23M73 21Q97 18 104 40",
      "none",
      'stroke="#cad18d" stroke-width="3" opacity=".4"',
    );
  } else if (kind === "palm") {
    s += path("M59 114Q67 67 63 37L69 37Q76 72 68 115Z", "#968560");
    for (let i = 0; i < 7; i++) {
      const x = 12 + i * 16;
      s += path(
        `M65 36Q${x} ${i % 2 ? 9 : 18} ${x} ${i % 2 ? 56 : 47}Q${x + 12} 31 65 36Z`,
        i % 2 ? p.leaf : p.leafLight,
      );
    }
  } else if (kind === "shrub" || kind === "planter") {
    if (kind === "planter") s += path("M33 94H96L90 115H39Z", p.accent);
    s += path(
      "M27 93Q17 77 37 73Q34 56 56 65Q67 49 81 65Q105 59 103 80Q118 89 100 97Z",
      p.leaf,
    );
    s += path(
      "M33 79Q42 66 55 75M69 72Q89 66 96 80",
      "none",
      `stroke="${p.leafLight}" stroke-width="8"`,
    );
  } else if (kind === "bench") {
    for (let y = 74; y <= 91; y += 6)
      s += path(
        `M17 ${y}L89 ${y}L105 ${y - 10}H33Z`,
        "#aa8055",
        'stroke="#73583d" stroke-width="1"',
      );
    s += rect(19, 92, 5, 22, "#4f5b53");
    s += rect(86, 92, 5, 22, "#4f5b53");
    s += rect(34, 67, 68, 4, "#bc9664");
  } else if (kind === "lamp") {
    s += rect(61, 21, 4, 95, "#526459");
    s += path(
      "M63 22Q70 13 88 19",
      "none",
      'stroke="#526459" stroke-width="4"',
    );
    s += ellipse(88, 21, 10, 4, "#efe1aa");
    s += rect(56, 112, 15, 4, "#7a8676");
  } else if (kind === "notice" || kind === "sign" || kind === "banner") {
    s += rect(35, 68, 4, 48, "#746647");
    s += rect(92, 68, 4, 48, "#746647");
    s += rect(28, 47, 75, 47, p.accent, 'rx="3"');
    s += rect(33, 52, 65, 36, "#e7dbb8");
    for (let i = 0; i < 3; i++) {
      s += rect(39 + i * 18, 57, 13, 23, i === 1 ? "#91a7a2" : "#f8edd6");
      s += rect(41 + i * 18, 61, 9, 2, p.accent);
    }
    s += path("M26 47L38 40H110L103 47Z", p.roof);
  } else if (kind === "bin") {
    s += path("M47 77H87L83 114H51Z", "#426a59");
    s += ellipse(67, 76, 22, 6, "#618977");
    s += rect(61, 88, 14, 17, "#bacbc0");
  } else if (kind === "kiosk" || kind === "shelter") {
    s += rect(24, 63, 80, 42, kind === "kiosk" ? p.wall : "#b5c8bb");
    s += path("M11 63L35 40H117L98 63Z", p.roofLight);
    s += rect(11, 63, 87, 7, p.roof);
    s += rect(18, 70, 5, 45, p.shade);
    s += rect(92, 70, 5, 45, p.shade);
    s += rect(35, 76, 51, 22, p.glass);
    s += rect(27, 99, 70, 7, p.accent);
  } else if (kind === "car" || kind === "shuttle") {
    const bus = kind === "shuttle";
    s += path(`M12 93L25 62H${bus ? 104 : 90}L116 90V109H12Z`, p.accent);
    s += path("M25 62L40 47H103L116 62Z", p.roofLight);
    s += path("M27 65H100L109 88H19Z", "url(#glass)");
    for (let x = 44; x < 100; x += 22) s += rect(x, 65, 3, 23, p.wall);
    s += rect(13, 91, 102, 14, bus ? "#d9ba72" : "#bdc9bd");
    s += rect(19, 103, 10, 5, "#f6e0ad");
    s += rect(102, 102, 8, 5, "#9e6550");
    for (const x of [32, 94]) {
      s += ellipse(x, 110, 10, 8, "#35483e");
      s += ellipse(x, 110, 5, 4, "#96a293");
    }
  } else if (kind === "cycle") {
    for (const x of [31, 96])
      s += ellipse(x, 102, 19, 14, "none", 'stroke="#57675b" stroke-width="3"');
    s += path(
      "M31 102L56 77L75 102H31L67 70L96 102M54 74H67M65 70L74 65H81",
      "none",
      `stroke="${p.accent}" stroke-width="4"`,
    );
  }
  return s;
}
export function exteriorAtlas(campus) {
  const p = palettes[campus],
    frames = {},
    defs = `<defs><linearGradient id="wall" x2="0" y2="1"><stop stop-color="${p.wall}"/><stop offset="1" stop-color="${p.shade}"/></linearGradient><linearGradient id="glass" x2=".8" y2="1"><stop stop-color="${p.glass}"/><stop offset="1" stop-color="#294c55"/></linearGradient><radialGradient id="leaf" cx=".32" cy=".24" r=".8"><stop stop-color="${p.leafLight}"/><stop offset=".65" stop-color="${p.leaf}"/><stop offset="1" stop-color="#284f3f"/></radialGradient></defs>`;
  let s = defs;
  buildingKinds.forEach((kind, i) => {
    const x = (i % 4) * 256,
      y = Math.floor(i / 4) * 256;
    frames[kind] = { x, y, width: 256, height: 256, pivotX: 128, pivotY: 246 };
    s += `<g transform="translate(${x} ${y})">${building(kind, p)}</g>`;
  });
  propKinds.forEach((kind, i) => {
    const x = (i % 8) * 128,
      y = 512 + Math.floor(i / 8) * 128;
    frames[kind] = { x, y, width: 128, height: 128, pivotX: 64, pivotY: 115 };
    s += `<g transform="translate(${x} ${y})">${prop(kind, p)}</g>`;
  });
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="768" viewBox="0 0 1024 768">${s}</svg>`,
    frames,
    palette: p,
  };
}
