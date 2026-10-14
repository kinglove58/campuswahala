import { studentPart, palettes } from "./student-rig.mjs";
function colorize(svg, color) {
  const rgb = color.match(/\w\w/g).map((x) => parseInt(x, 16));
  return svg.replace(/stop-color="#([a-f0-9]{3,6})"/g, (_m, hex) => {
    if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
    const channels = hex.match(/../g).map((x) => parseInt(x, 16));
    if (channels[0] !== channels[1] || channels[1] !== channels[2]) return _m;
    return `stop-color="#${rgb
      .map((n) =>
        Math.round((n * channels[0]) / 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")}"`;
  });
}
export function composed(look, dir, state = "idle", index = 0) {
  const selected = [
    "skin",
    look.bottom,
    "shoes",
    "top",
    look.hair,
    ...(look.accessory === "backpack" ? ["backpack"] : []),
  ];
  return selected
    .map((p, i) => {
      const color =
        p === "skin"
          ? palettes.skin[look.skin]
          : p === "top"
            ? palettes.top[look.top]
            : p === "shoes"
              ? palettes.shoes[look.shoes]
              : p === look.hair && p !== "covered"
                ? palettes.hairColour[look.hairColour]
                : null;
      let s = studentPart(p, dir, state, index)
        .replaceAll('id="', 'id="p' + i + "-")
        .replaceAll("url(#", "url(#p" + i + "-");
      if (color) s = colorize(s, color);
      if (p === "covered") s = colorize(s, palettes.skin[look.skin]);
      return s;
    })
    .join("");
}
