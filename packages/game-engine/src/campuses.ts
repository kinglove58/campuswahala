import { environmentAssets } from "./assets";
import {
  defaultAppearance,
  validateWorld,
  type CampusId,
  type WorldManifest,
  type Venue,
  type Zone,
} from "./world";
// All layout points, names and routes below are generated_fixture geometry. No survey/GPS claims.
// Fact-key bindings can change identity labels only after the published catalogue supplies matching evidence.
const configurations = {
  futa: {
    width: 3072,
    height: 2304,
    cols: 3,
    roof: 0x9f6247,
    ground: 0xd4dfb6,
    wall: 0xf2dec0,
    foliage: 0x547849,
    water: 0x80a7a2,
    types: [
      "transport",
      "academic",
      "admin",
      "hostel",
      "social",
      "sports",
    ] as const,
    names: [
      "Arrival grove",
      "Learning quarter",
      "Civic court",
      "Residence gardens",
      "The commons",
      "Recreation field",
    ],
    venues: [
      ["Welcome lodge", "social"],
      ["Study house", "library"],
      ["Lecture hall", "lecture_hall"],
      ["Student support", "admin"],
      ["Hostel lounge", "hostel"],
      ["Food corner", "food"],
      ["Courtyard club", "social"],
      ["Sports pavilion", "sports"],
      ["Quiet room", "social"],
    ],
  },
  oau: {
    width: 2560,
    height: 2048,
    cols: 2,
    roof: 0x9c8565,
    ground: 0xdde2c4,
    wall: 0xf1e7cc,
    foliage: 0x6b8453,
    water: 0x8baba8,
    types: ["transport", "academic", "social", "hostel"] as const,
    names: [
      "Arrival avenue",
      "Learning terraces",
      "Meeting gardens",
      "Residence court",
    ],
    venues: [
      ["Arrival pavilion", "social"],
      ["Study terrace", "library"],
      ["Lecture hall", "lecture_hall"],
      ["Garden café", "food"],
      ["Common room", "hostel"],
    ],
  },
  unilag: {
    width: 2304,
    height: 2560,
    cols: 2,
    roof: 0x477d85,
    ground: 0xd4e3cf,
    wall: 0xf2e3c5,
    foliage: 0x43836f,
    water: 0x7daeb6,
    types: ["academic", "transport", "hostel", "social"] as const,
    names: [
      "Learning court",
      "Arrival square",
      "Residence lane",
      "Waterfront-inspired gardens",
    ],
    venues: [
      ["Study court", "library"],
      ["Lecture hall", "lecture_hall"],
      ["Shuttle shelter", "transport"],
      ["Residence lounge", "hostel"],
      ["Food courtyard", "food"],
    ],
  },
};
export function createCampusWorld(campusId: CampusId): WorldManifest {
  const c = configurations[campusId],
    asset = environmentAssets.find((a) => a.id === `${campusId}-environment`)!;
  const rows = Math.ceil(c.types.length / c.cols),
    zw = c.width / c.cols,
    zh = c.height / rows;
  const zones: Zone[] = c.types.map((type, i) => ({
    id: `zone-${i}`,
    name: c.names[i]!,
    type,
    x: (i % c.cols) * zw,
    y: Math.floor(i / c.cols) * zh,
    width: zw,
    height: zh,
    bundle: asset.id,
  }));
  const w: WorldManifest = {
    schemaVersion: 1,
    campusId,
    version: 1,
    sourceRevision: "geometry-2026-10-09.1",
    geography: "compressed campus geography",
    bounds: { x: 0, y: 0, width: c.width, height: c.height },
    defaultSpawnId: "spawn-arrival",
    palette: {
      ground: c.ground,
      roof: c.roof,
      wall: c.wall,
      foliage: c.foliage,
      water: c.water,
    },
    zones,
    roads: [],
    paths: [],
    buildings: [],
    venues: [],
    spawnPoints: [],
    transportNodes: [],
    interactionPoints: [],
    decorations: [],
    npcSpawns: [],
    assetBundles: [{ ...asset }],
  };
  zones.forEach((z, i) => {
    const cx = z.x + z.width / 2,
      cy = z.y + z.height / 2;
    w.roads.push({
      id: `road-${i}`,
      width: 72,
      points: [
        { x: z.x + 20, y: cy },
        { x: z.x + z.width - 20, y: cy },
      ],
    });
    w.paths.push({
      id: `path-${i}`,
      width: 42,
      points: [
        { x: cx, y: z.y + 20 },
        { x: cx, y: z.y + z.height - 20 },
      ],
    });
    w.spawnPoints.push({
      id: i === 0 ? "spawn-arrival" : `spawn-zone-${i}`,
      zoneId: z.id,
      x: cx,
      y: cy + 90,
    });
    w.transportNodes.push({
      id: `transport-${i}`,
      zoneId: z.id,
      name: `${z.name} shuttle`,
      type: "shuttle",
      x: cx + 110,
      y: cy + 65,
      destinations: zones
        .filter((_, j) => j !== i)
        .map((_, j) => {
          const original = zones.filter((_, k) => k !== i)[j]!;
          const idx = zones.indexOf(original);
          return {
            spawnId: idx === 0 ? "spawn-arrival" : `spawn-zone-${idx}`,
            virtualMinutes: 3 + idx,
          };
        }),
    });
    w.interactionPoints.push({
      id: `shuttle-interaction-${i}`,
      zoneId: z.id,
      x: cx + 110,
      y: cy + 65,
      label: "Take shuttle",
      command: "TRAVEL",
      transportId: `transport-${i}`,
      radius: 100,
    });
    w.decorations.push(
      {
        id: `shuttle-prop-${i}`,
        zoneId: z.id,
        x: cx + 150,
        y: cy + 55,
        type: "shuttle",
        fixture: true,
      },
      {
        id: `board-${i}`,
        zoneId: z.id,
        x: cx - 100,
        y: cy + 75,
        type: "notice",
        fixture: true,
      },
    );
    w.interactionPoints.push({
      id: `notice-${i}`,
      zoneId: z.id,
      x: cx - 100,
      y: cy + 75,
      label: "Check notice board",
      command: "VIEW_NOTICE",
      radius: 65,
    });
    for (let n = 0; n < 18; n++) {
      const x = z.x + 70 + ((n * 173) % (z.width - 140)),
        y = z.y + 60 + ((n * 229) % (z.height - 120));
      if (Math.abs(x - cx) < 85 || Math.abs(y - cy) < 110) continue;
      w.decorations.push({
        id: `tree-${i}-${n}`,
        zoneId: z.id,
        x,
        y,
        type: campusId === "unilag" && n % 3 === 0 ? "palm" : "tree",
        fixture: true,
      });
    }
    for (let n = 0; n < 4; n++)
      w.decorations.push({
        id: `lamp-${i}-${n}`,
        zoneId: z.id,
        x: z.x + 100 + (n * (z.width - 200)) / 3,
        y: cy - 55,
        type: "lamp",
        fixture: true,
      });
    const role = (
      ["student", "vendor", "security", "shuttle_operator", "staff"] as const
    )[i % 5]!;
    w.npcSpawns.push({
      id: `npc-${i}`,
      zoneId: z.id,
      x: cx - 180,
      y: cy,
      role,
      appearance: { ...defaultAppearance, top: i % 2 ? "clay" : "blue" },
      pattern: i % 2 ? "stationary" : "patrol",
      route: [{ x: cx - 60, y: cy }],
      dialogue: [
        `Welcome to ${c.names[i]}. I’m a fictional ${role.replaceAll("_", " ")}.`,
        "Open your Pocket map to choose a virtual destination. Small steps, plenty stories.",
      ],
      activeHours: [6, 22],
      fictional: true,
    });
    w.interactionPoints.push({
      id: `talk-${i}`,
      zoneId: z.id,
      x: cx - 180,
      y: cy,
      label: `Talk to ${role.replaceAll("_", " ")}`,
      command: "TALK_TO_NPC",
      npcId: `npc-${i}`,
      radius: 100,
    });
  });
  // Connect zone streets; the differing grid aspect/zone order is content, not separate engine logic.
  for (let row = 0; row < rows; row++)
    w.roads.push({
      id: `crossroad-${row}`,
      width: 72,
      points: [
        { x: 24, y: row * zh + zh / 2 },
        { x: c.width - 24, y: row * zh + zh / 2 },
      ],
    });
  for (let col = 0; col < c.cols; col++)
    w.paths.push({
      id: `spine-${col}`,
      width: 48,
      points: [
        { x: col * zw + zw / 2, y: 24 },
        { x: col * zw + zw / 2, y: c.height - 24 },
      ],
    });
  c.venues.forEach(([name, type], i) => {
    const z = zones[i % zones.length]!,
      second = i >= zones.length,
      bx = z.x + z.width / 2 + (second ? 110 : -260),
      by = z.y + z.height / 2 - 245;
    const buildingId = `building-${i}`,
      id = `venue-${i}`,
      spawnId = `spawn-venue-${i}`,
      entrance = { x: bx + 90, y: by + 155 };
    w.buildings.push({
      id: buildingId,
      zoneId: z.id,
      x: bx,
      y: by,
      width: 180,
      height: 125,
      silhouette:
        type === "food"
          ? "market"
          : campusId === "oau"
            ? "hall"
            : campusId === "unilag"
              ? "tower"
              : "bungalow",
      entrance,
    });
    w.spawnPoints.push({ id: spawnId, zoneId: z.id, ...entrance });
    w.venues.push({
      id,
      zoneId: z.id,
      buildingId,
      name: name!,
      description:
        "A fictional campus space for exploring, meeting a character and taking a quiet moment. No official service or real opening hours are implied.",
      type: type as Venue["type"],
      identity: { kind: "fictional", fixture: true },
      presentation: i % 3 === 0 ? "interior" : i % 3 === 1 ? "panel" : "zone",
      safeSpawnId: spawnId,
      hours: [6, 22],
      futureActivities: [],
    });
    w.interactionPoints.push({
      id: `enter-${i}`,
      zoneId: z.id,
      ...entrance,
      label: `Enter ${name}`,
      command: "ENTER_VENUE",
      venueId: id,
      radius: 78,
    });
    w.paths.push({
      id: `entrance-path-${i}`,
      width: 32,
      points: [entrance, { x: entrance.x, y: z.y + z.height / 2 }],
    });
  });
  // Remove overlapping decorative trees, keeping entrances/readable paths clear.
  w.decorations = w.decorations.filter(
    (d) =>
      !["tree", "palm"].includes(d.type) ||
      !w.buildings.some(
        (b) =>
          d.x > b.x - 55 &&
          d.x < b.x + b.width + 55 &&
          d.y > b.y - 75 &&
          d.y < b.y + b.height + 80,
      ),
  );
  const library = w.venues.find((v) => v.type === "library");
  if (library)
    library.identity = {
      kind: "approximate",
      factKey: "library.name",
      category: "building",
    };
  return validateWorld(w);
}
