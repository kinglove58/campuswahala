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
// Canonical subject bindings can change identity labels only after the published catalogue supplies matching evidence.
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
    bindings: [
      {
        type: "lecture_hall",
        canonicalEntityId: "aa512326-0bd0-41f7-ada9-8e1ec2e7a83e",
        displayProperty: "name",
        category: "faculty",
      },
      {
        type: "hostel",
        canonicalEntityId: "860f48f1-ebca-44f1-ad8d-9512fa68f308",
        displayProperty: "name",
        category: "hostel",
      },
      {
        type: "library",
        canonicalEntityId: "277acbd3-0f06-4b11-a1d8-5d3ee8be90a0",
        displayProperty: "name",
        category: "building",
      },
      {
        type: "admin",
        canonicalEntityId: "3df4f187-5b09-4c75-a7b6-d59c755b7f04",
        displayProperty: "name",
        category: "location",
      },
      {
        type: "clinic",
        canonicalEntityId: "78651993-f673-4578-a4b9-f25f907d06b5",
        displayProperty: "name",
        category: "location",
      },
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
      ["Care lodge", "clinic"],
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
    bindings: [
      {
        type: "hostel",
        canonicalEntityId: "19f48f7c-d3d1-4f02-a705-b8e3d0088d51",
        displayProperty: "name",
        category: "hostel",
      },
      {
        type: "lecture_hall",
        canonicalEntityId: "678e4fc0-19f1-47d9-ac41-0e4a11a26568",
        displayProperty: "name",
        category: "building",
      },
      {
        type: "library",
        canonicalEntityId: "7472c1e3-edee-4fdf-a8f7-f7ae997c382c",
        displayProperty: "name",
        category: "building",
      },
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
    bindings: [
      {
        type: "lecture_hall",
        canonicalEntityId: "45ee2e4e-a860-4694-ac94-8e6112706a7b",
        displayProperty: "name",
        category: "building",
      },
      {
        type: "library",
        canonicalEntityId: "9c21c49a-d0b8-458e-ab1b-27ae23592497",
        displayProperty: "name",
        category: "building",
      },
      {
        type: "admin",
        canonicalEntityId: "9f32b58d-8002-4982-af73-10fb0c3532c3",
        displayProperty: "name",
        category: "building",
      },
    ],
    venues: [
      ["Study court", "library"],
      ["Lecture hall", "lecture_hall"],
      ["Shuttle shelter", "transport"],
      ["Residence lounge", "hostel"],
      ["Food courtyard", "food"],
      ["Civic room", "admin"],
      ["Quiet courtyard", "religious"],
    ],
  },
};
export function createCampusWorld(campusId: CampusId): WorldManifest {
  const c = configurations[campusId];
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
    bundle: `${campusId}-zone-${i}`,
  }));
  const w: WorldManifest = {
    schemaVersion: 2,
    campusId,
    version: 2,
    sourceRevision: "geometry-2026-10-10.25",
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
    assetBundles: environmentAssets
      .filter((a) => a.id.startsWith(`${campusId}-zone-`))
      .map((a) => ({ ...a })),
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
    for (let j = 1; j <= 2; j++)
      w.npcSpawns.push({
        ...w.npcSpawns[w.npcSpawns.length - 1]!,
        id: `ambient-${i}-${j}`,
        role: "student",
        x: cx + j * 44,
        y: cy + 14,
        pattern: j === 1 ? "wander" : "stationary",
        route: [{ x: cx + j * 44, y: cy + 90 }],
        appearance: {
          ...defaultAppearance,
          skin: j === 1 ? "deep" : "warm",
          hair: j === 1 ? "braids" : "afro",
          top: j === 1 ? "lime" : "clay",
          accessory: j === 1 ? "none" : "backpack",
        },
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
      presentation: ["library", "lecture_hall", "hostel"].includes(type!)
        ? "interior"
        : "panel",
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
  for (const binding of c.bindings) {
    const venue = w.venues.find((v) => v.type === binding.type);
    if (venue)
      venue.identity = {
        kind: "approximate",
        canonicalEntityId: binding.canonicalEntityId,
        displayProperty: binding.displayProperty,
        category: binding.category,
      };
  }
  return validateWorld(w);
}
