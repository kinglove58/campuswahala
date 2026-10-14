/** Original CampusWahala vector source rig, 2026. No reference-game assets.
 * Editable paths; elevated orthographic view; light from upper left.
 * All geometry is visual: feet anchor (64,148), not collision authority.
 */
export const frame = { width: 128, height: 160, foot: { x: 64, y: 148 } };
export const directions = ["down", "left", "up", "right"];
export const parts = [
  "skin",
  "top",
  "trousers",
  "skirt",
  "shoes",
  "crop",
  "afro",
  "braids",
  "covered",
  "backpack",
];
export const palettes = {
  skin: {
    deep: "#704838",
    brown: "#a5704e",
    warm: "#c58e65",
    light: "#e8ba91",
  },
  top: { lime: "#bad06b", clay: "#d78161", blue: "#719eb4" },
  hairColour: { black: "#302e31", brown: "#6c4c3e" },
  shoes: { dark: "#39454e", white: "#f4ecda" },
};
const path = (d, fill, extra = "") =>
  `<path d="${d}" fill="${fill}" ${extra}/>`;
const line = (d, color, width = 1.2) =>
  path(
    d,
    "none",
    `stroke="${color}" stroke-width="${width}" stroke-linecap="round"`,
  );
const ellipse = (x, y, rx, ry, fill, extra = "") =>
  `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
export function studentPart(
  part,
  direction = "down",
  state = "idle",
  index = 0,
) {
  const side = direction === "left" || direction === "right",
    back = direction === "up";
  const phase = state === "walk" ? Math.sin((index * Math.PI) / 3) : 0;
  const lift = state === "walk" ? Math.abs(phase) * 1.6 : index * 0.5;
  const arm = phase * 4,
    leg = phase * 4;
  const defs = `<defs>
 <linearGradient id="form" x1="0" y1="0" x2="1" y2=".35"><stop stop-color="#fff"/><stop offset=".5" stop-color="#e5e5e5"/><stop offset="1" stop-color="#939393"/></linearGradient>
 <radialGradient id="face" cx=".3" cy=".25" r=".85"><stop stop-color="#fff"/><stop offset=".65" stop-color="#e3e3e3"/><stop offset="1" stop-color="#969696"/></radialGradient>
 <linearGradient id="cloth" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff"/><stop offset=".5" stop-color="#dfdfdf"/><stop offset="1" stop-color="#a4a4a4"/></linearGradient>
 <linearGradient id="navy" x2=".85" y2=".5"><stop stop-color="#5a6c77"/><stop offset=".45" stop-color="#394c58"/><stop offset="1" stop-color="#243541"/></linearGradient>
 <linearGradient id="bag" x2="1" y2=".8"><stop stop-color="#b58a59"/><stop offset=".5" stop-color="#916f47"/><stop offset="1" stop-color="#604c35"/></linearGradient>
 <linearGradient id="scarf" x2="1" y2="1"><stop stop-color="#e5bc86"/><stop offset=".5" stop-color="#c18456"/><stop offset="1" stop-color="#865a43"/></linearGradient>
 </defs>`;
  let content = "";
  if (part === "skin") {
    // Neck, asymmetric natural hands and a sculpted jaw. Face details are un-tinted overlays in source composites.
    content = path(
      side
        ? "M57 53 Q70 51 72 61 L69 74 57 71Z"
        : "M53 51 Q64 58 75 51 L73 71 Q64 78 55 69Z",
      "url(#form)",
    );
    content += `<g transform="translate(0,${-lift})">`;
    content += path(
      side
        ? `M53 72 Q48 76 47 88 L${45 - arm / 2} 102 Q44 108 49 109 Q54 108 54 103 L58 79Z`
        : `M44 72 Q38 76 37 85 L${35 - arm} 100 Q34 107 39 109 Q44 109 45 104 L49 81Z`,
      "url(#form)",
    );
    if (!side)
      content += path(
        `M83 73 Q89 78 90 87 L${92 + arm} 100 Q94 108 89 110 Q84 110 83 103 L78 82Z`,
        "url(#form)",
      );
    content += side
      ? path(
          "M60 13 Q76 13 83 26 Q88 34 88 38 L94 43 Q94 47 88 47 L88 53 Q84 66 71 64 Q57 59 54 44 L51 29 Q51 18 60 13Z",
          "url(#face)",
        )
      : path(
          "M46 21 Q49 11 64 10 Q79 12 83 26 L83 42 Q83 55 73 62 Q64 68 54 61 Q44 53 44 40Z",
          "url(#face)",
        );
    if (!side)
      content +=
        ellipse(43, 38, 4, 7, "url(#form)") +
        ellipse(84, 38, 4, 7, "url(#form)");
    if (!back) {
      // Modelled cheek/nose planes. Avoid ethnic caricature; the same features apply to every palette.
      content += side
        ? path("M85 36 Q89 41 92 43 L85 45Z", "#b7b7b7") +
          line("M83 53 Q87 54 89 52", "#8e8e8e", 1.2)
        : path("M62 35 Q59 44 60 46 Q65 49 69 46 L66 37Z", "#b8b8b8") +
          ellipse(52, 47, 5, 3, "#fff", 'opacity=".09"') +
          line("M57 54 Q64 58 72 53", "#929292", 1.6);
    }
    content += "</g>";
  }
  if (part === "top") {
    content =
      `<g transform="translate(0,${-lift})">` +
      path(
        side
          ? "M60 64 Q70 61 78 68 L82 89 78 102 Q65 108 51 100 L52 81 48 80 49 72Z"
          : "M51 62 Q64 69 76 62 Q87 64 92 80 L82 86 79 78 81 100 Q65 106 47 100 L49 78 45 85 35 80 Q40 65 51 62Z",
        "url(#cloth)",
      );
    content += line(
      side ? "M53 99 Q66 103 77 99" : "M48 98 Q63 102 80 98",
      "#8a8a8a",
      1.4,
    );
    content += path(
      side
        ? "M62 63 Q71 65 76 64 L74 68 Q65 70 60 67Z"
        : "M53 62 Q65 70 75 62 L73 69 Q63 73 54 68Z",
      "#b1b1b1",
    );
    content += line(side ? "M76 73 L78 89" : "M76 77 L77 93", "#fff", 1.1);
    if (!back)
      content += path(
        side ? "M69 78 L73 79 73 83 69 83Z" : "M69 79 L76 79 76 86 69 86Z",
        "#fff",
        'opacity=".3"',
      );
    content += "</g>";
  }
  if (part === "trousers") {
    const one = (x, l) =>
      `<g transform="translate(0,${l})">` +
      path(
        `M${x} 97 Q${x + 7} 94 ${x + 15} 98 L${x + 13} 137 Q${x + 8} 141 ${x + 1} 137Z`,
        "url(#navy)",
      ) +
      line(`M${x + 11} 109 L${x + 9} 134`, "#69808b", 0.8) +
      "</g>";
    content = side
      ? one(54, -leg / 2) + one(62, leg / 2)
      : one(48, leg) + one(65, -leg);
    content += path(
      side
        ? "M53 95 L77 95 77 106 52 105Z"
        : "M47 95 Q64 99 81 95 L81 107 Q64 111 47 107Z",
      "url(#navy)",
    );
  }
  if (part === "skirt") {
    content =
      path(
        side
          ? "M52 112 L63 112 64 138 55 139Z"
          : "M51 112 L60 113 60 138 52 138Z",
        "url(#form)",
      ) +
      path(
        side
          ? "M65 112 L76 112 74 140 66 139Z"
          : "M68 113 L77 112 76 138 68 138Z",
        "url(#form)",
      );
    // Legs are warm neutral source tones; runtime overlays the same selected skin tint.
    content =
      `<g data-part="legs">${content}</g>` +
      path(
        side
          ? "M53 98 Q67 104 77 98 L83 124 Q67 131 47 124Z"
          : "M48 98 Q64 104 80 98 L87 125 Q63 134 41 125Z",
        "url(#navy)",
      ) +
      line(
        side ? "M65 103 L66 124" : "M56 104 L52 127 M72 105 L76 127",
        "#71848e",
        1.2,
      );
  }
  if (part === "shoes") {
    const one = (x, offset) =>
      `<g transform="translate(0,${offset})">` +
      path(
        `M${x} 134 Q${x + 6} 138 ${x + 12} 134 L${x + 16} 143 Q${x + 14} 149 ${x} 147 L${x - 2} 142Z`,
        "url(#cloth)",
      ) +
      line(`M${x - 1} 145 Q${x + 7} 149 ${x + 14} 145`, "#777", 1.5) +
      line(
        `M${x + 3} 139 L${x + 10} 140 M${x + 3} 141 L${x + 11} 142`,
        "#fff",
        1,
      ) +
      "</g>";
    content = side
      ? one(53, -leg / 2) + one(64, leg / 2)
      : one(47, leg) + one(66, -leg);
  }
  if (["crop", "afro", "braids"].includes(part)) {
    const silhouette = side
      ? "M52 43 Q43 19 57 10 Q72 3 83 16 L87 27 79 29 Q78 21 69 21 Q61 24 58 35 L59 43Z"
      : "M43 39 Q36 24 43 14 Q50 4 65 5 Q83 5 88 23 L84 38 78 32 Q75 24 64 25 Q53 26 48 35Z";
    content = path(silhouette, "url(#form)");
    if (part === "afro") {
      content = path(
        side
          ? "M53 44 Q42 36 40 22 Q41 6 55 4 Q65 -1 78 4 Q94 8 93 25 Q93 34 84 35 L79 25 Q63 21 58 35Z"
          : "M43 40 Q29 31 35 16 Q38 3 49 5 Q58 -3 66 1 Q80 -2 86 8 Q98 9 97 24 Q96 37 84 40 L79 28 Q65 20 49 31Z",
        "url(#form)",
      );
      for (let n = 0; n < 14; n++)
        content += ellipse(
          41 + ((n * 13) % 48),
          7 + ((n * 7) % 20),
          3,
          2,
          "#fff",
          'opacity=".1"',
        );
    }
    if (part === "braids") {
      content += path(
        side
          ? "M52 26 Q48 47 54 66 L48 69 Q41 44 46 22Z"
          : "M45 27 Q39 47 44 69 L37 68 Q34 47 39 27Z",
        "url(#form)",
      );
      if (!side)
        content += path(
          "M82 26 Q91 47 87 69 L80 69 Q84 44 78 26Z",
          "url(#form)",
        );
      for (let n = 0; n < 6; n++)
        content += line(
          `M${46 + n * 5} 12 Q${53 + n * 4} 14 ${50 + n * 5} 24`,
          "#aaa",
          0.7,
        );
      for (let n = 0; n < 7; n++)
        content += line(`M40 ${32 + n * 5} L45 ${35 + n * 5}`, "#aaa", 0.7);
    }
    if (back)
      content += path("M45 29 Q63 17 83 29 L81 52 Q63 61 47 50Z", "url(#form)");
    content = `<g transform="translate(0,${-lift})">${content}</g>`;
  }
  if (part === "covered") {
    content = path(
      side
        ? "M52 13 Q66 0 83 16 Q90 28 88 34 L79 23 Q67 18 58 30 L61 50 Q65 58 79 57 L90 75 Q69 85 44 70 L46 51 Q41 27 52 13Z"
        : "M41 20 Q47 2 65 2 Q84 4 89 27 L90 50 Q87 68 94 75 Q63 88 34 74 L41 53Z",
      "url(#scarf)",
    );
    if (!back)
      content += path(
        side
          ? "M58 30 Q64 18 76 23 Q86 25 86 38 L89 43 85 48 Q85 60 72 63 Q58 59 57 48Z"
          : "M48 30 Q52 18 64 19 Q78 21 81 32 L80 45 Q78 58 65 63 Q51 60 48 45Z",
        "url(#face)",
      );
    content += line(
      side ? "M49 51 Q51 71 75 72" : "M42 51 Q43 73 66 78 M85 50 Q81 73 67 77",
      "#f3d2a2",
      1.7,
    );
    content = `<g transform="translate(0,${-lift})">${content}</g>`;
  }
  if (part === "backpack") {
    content = back
      ? path(
          "M48 67 Q64 59 80 67 L82 96 Q81 104 64 106 Q46 104 46 94Z",
          "url(#bag)",
        ) +
        path("M49 84 Q63 80 78 85 L77 99 Q64 103 50 98Z", "#a08053") +
        line("M50 86 Q64 83 77 86", "#ead5a2", 1.3) +
        path("M60 63 L60 58 68 58 69 64", "#72583d")
      : side
        ? path(
            "M50 65 Q43 62 40 70 L39 93 Q39 102 52 100 L56 81Z",
            "url(#bag)",
          ) +
          line("M46 71 L44 90", "#d2b085", 1.5) +
          path("M61 66 L65 66 63 94 59 94Z", "#8b704f")
        : path("M47 66 Q50 65 53 68 L53 90 49 91Z", "#a88658") +
          path("M75 66 L79 66 79 91 75 90Z", "#80643f");
    content = `<g transform="translate(0,${-lift})">${content}</g>`;
  }
  // Eyes/brows are intentionally in the hair layer so they are not skin tinted.
  if (["crop", "afro", "braids", "covered"].includes(part) && !back) {
    let face = side
      ? ellipse(81, 34, 3.2, 2.8, "#fff") +
        ellipse(82, 34, 1.6, 2.3, "#252d30") +
        line("M77 28 Q81 26 84 29", "#393334", 1.6)
      : ellipse(54, 35, 4, 3, "#fff") +
        ellipse(73, 35, 4, 3, "#fff") +
        ellipse(55, 35, 2, 2.8, "#252d30") +
        ellipse(72, 35, 2, 2.8, "#252d30") +
        ellipse(54.5, 34.2, 0.65, 0.65, "#fff") +
        ellipse(71.5, 34.2, 0.65, 0.65, "#fff") +
        line("M49 29 Q54 26 58 29 M69 29 Q74 26 78 29", "#393334", 1.7);
    if (!side)
      face +=
        path("M58 54 Q65 57 71 53 Q65 62 58 54Z", "#694536") +
        line("M60 55 L68 55", "#f6dfc4", 0.8);
    content += `<g transform="translate(0,${-lift})">${face}</g>`;
  }
  return `${defs}<g ${direction === "left" ? 'transform="translate(128,0) scale(-1,1)"' : ""}>${content}</g>`;
}
export function partSvg(...args) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="160" viewBox="0 0 128 160">${studentPart(...args)}</svg>`;
}
