/** Shared data-only world contracts. All coordinates are compressed fictional game geography. */
export type CampusId = "futa" | "oau" | "unilag";
export type Point = { x: number; y: number };
export type Rect = Point & { width: number; height: number };
export type Identity =
  | { kind: "fictional"; fixture: true }
  | { kind: "approximate"; factKey: string; category: string };
export type Zone = Rect & {
  id: string;
  name: string;
  type:
    | "academic"
    | "hostel"
    | "admin"
    | "social"
    | "sports"
    | "commercial"
    | "religious"
    | "transport";
  bundle: string;
};
export type Command =
  | "ENTER_VENUE"
  | "TALK_TO_NPC"
  | "OPEN_SERVICE"
  | "VIEW_NOTICE"
  | "TRAVEL"
  | "REST";
export type Interaction = Point & {
  id: string;
  zoneId: string;
  label: string;
  command: Command;
  venueId?: string;
  npcId?: string;
  transportId?: string;
  radius: number;
};
export type Venue = {
  id: string;
  zoneId: string;
  buildingId: string;
  name: string;
  description: string;
  type:
    | "lecture_hall"
    | "library"
    | "hostel"
    | "clinic"
    | "food"
    | "sports"
    | "admin"
    | "religious"
    | "commercial"
    | "social"
    | "transport";
  identity: Identity;
  presentation: "interior" | "panel" | "zone";
  safeSpawnId: string;
  hours?: [number, number];
  futureActivities: string[];
};
export type Spawn = Point & { id: string; zoneId: string };
export type Appearance = {
  skin: "deep" | "brown" | "warm" | "light";
  hair: "crop" | "afro" | "braids" | "covered";
  hairColour: "black" | "brown";
  top: "lime" | "clay" | "blue";
  bottom: "trousers" | "skirt";
  shoes: "dark" | "white";
  accessory: "none" | "backpack";
};
export const defaultAppearance: Appearance = {
  skin: "brown",
  hair: "crop",
  hairColour: "black",
  top: "lime",
  bottom: "trousers",
  shoes: "dark",
  accessory: "backpack",
};
export const appearanceChoices = {
  skin: ["deep", "brown", "warm", "light"],
  hair: ["crop", "afro", "braids", "covered"],
  hairColour: ["black", "brown"],
  top: ["lime", "clay", "blue"],
  bottom: ["trousers", "skirt"],
  shoes: ["dark", "white"],
  accessory: ["none", "backpack"],
} as const;
export function parseAppearance(input: unknown): Appearance {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("INVALID_APPEARANCE");
  const data = input as Record<string, unknown>;
  if (
    Object.keys(data).length !== Object.keys(appearanceChoices).length ||
    Object.entries(appearanceChoices).some(
      ([key, values]) => !(values as readonly unknown[]).includes(data[key]),
    )
  )
    throw new Error("INVALID_APPEARANCE");
  return { ...data } as Appearance;
}
export type WorldManifest = {
  schemaVersion: 1;
  campusId: CampusId;
  version: number;
  sourceRevision: string;
  geography: "compressed campus geography";
  bounds: Rect;
  defaultSpawnId: string;
  palette: {
    ground: number;
    roof: number;
    wall: number;
    foliage: number;
    water: number;
  };
  zones: Zone[];
  roads: Array<{ id: string; points: Point[]; width: number }>;
  paths: Array<{ id: string; points: Point[]; width: number }>;
  buildings: Array<
    Rect & {
      id: string;
      zoneId: string;
      silhouette: "hall" | "tower" | "bungalow" | "market";
      entrance: Point;
    }
  >;
  venues: Venue[];
  spawnPoints: Spawn[];
  transportNodes: Array<
    Point & {
      id: string;
      zoneId: string;
      name: string;
      type: "shuttle" | "walk";
      destinations: Array<{ spawnId: string; virtualMinutes: number }>;
    }
  >;
  interactionPoints: Interaction[];
  decorations: Array<
    Point & {
      id: string;
      zoneId: string;
      type: "tree" | "palm" | "bench" | "lamp" | "notice" | "shuttle" | "water";
      fixture: true;
      placementId?: string;
    }
  >;
  npcSpawns: Array<
    Spawn & {
      role: "student" | "vendor" | "security" | "shuttle_operator" | "staff";
      appearance: Appearance;
      pattern: "idle" | "wander" | "patrol" | "stationary";
      route: Point[];
      dialogue: string[];
      activeHours: [number, number];
      fictional: true;
    }
  >;
  assetBundles: Array<{
    id: string;
    path: string;
    bytes: number;
    hash: string;
  }>;
};
export const isCampus = (v: unknown): v is CampusId =>
  ["futa", "oau", "unilag"].includes(String(v));
export const contains = (r: Rect, p: Point, margin = 0) =>
  Number.isFinite(p.x) &&
  Number.isFinite(p.y) &&
  p.x >= r.x + margin &&
  p.y >= r.y + margin &&
  p.x <= r.x + r.width - margin &&
  p.y <= r.y + r.height - margin;
export const blocked = (w: WorldManifest, p: Point, radius = 12) =>
  !contains(w.bounds, p, radius) ||
  w.buildings.some(
    (b) =>
      p.x > b.x - radius &&
      p.x < b.x + b.width + radius &&
      p.y > b.y - radius &&
      p.y < b.y + b.height + radius,
  );
export function validateWorld(w: WorldManifest): WorldManifest {
  if (
    w.schemaVersion !== 1 ||
    !isCampus(w.campusId) ||
    !Number.isSafeInteger(w.version) ||
    w.version < 1 ||
    !/^geometry-[a-z0-9.-]+$/.test(w.sourceRevision)
  )
    throw new Error("INVALID_WORLD_VERSION");
  if (
    ![w.bounds.x, w.bounds.y, w.bounds.width, w.bounds.height].every(
      Number.isFinite,
    ) ||
    w.bounds.width < 320 ||
    w.bounds.height < 320 ||
    w.bounds.width > 12000 ||
    w.bounds.height > 12000
  )
    throw new Error("INVALID_BOUNDS");
  const collections = [
    w.zones,
    w.roads,
    w.paths,
    w.buildings,
    w.venues,
    w.spawnPoints,
    w.transportNodes,
    w.interactionPoints,
    w.decorations,
    w.npcSpawns,
    w.assetBundles,
  ];
  const ids = new Set<string>();
  for (const collection of collections)
    for (const item of collection) {
      if (!/^[a-z][a-z0-9-]{0,63}$/.test(item.id) || ids.has(item.id))
        throw new Error("DUPLICATE_OR_INVALID_ID");
      ids.add(item.id);
      if ("x" in item && !contains(w.bounds, item))
        throw new Error("OUT_OF_BOUNDS");
      if (
        "width" in item &&
        "height" in item &&
        (!Number.isFinite(item.width) ||
          !Number.isFinite(item.height) ||
          item.width <= 0 ||
          item.height <= 0 ||
          !contains(w.bounds, {
            x: item.x + item.width,
            y: item.y + item.height,
          }))
      )
        throw new Error("OUT_OF_BOUNDS");
      if ("zoneId" in item && !w.zones.some((z) => z.id === item.zoneId))
        throw new Error("UNKNOWN_ZONE");
    }
  const spawn = (id: string) => w.spawnPoints.find((s) => s.id === id);
  if (!spawn(w.defaultSpawnId)) throw new Error("UNKNOWN_SPAWN");
  for (const s of [
    ...w.spawnPoints,
    ...w.interactionPoints,
    ...w.transportNodes,
    ...w.npcSpawns,
  ])
    if (blocked(w, s) || !contains(w.zones.find((z) => z.id === s.zoneId)!, s))
      throw new Error("UNSAFE_POINT");
  for (const z of w.zones)
    if (!w.assetBundles.some((b) => b.id === z.bundle))
      throw new Error("UNKNOWN_BUNDLE");
  for (const b of w.buildings)
    if (!contains(w.bounds, b.entrance) || blocked(w, b.entrance))
      throw new Error("INVALID_ENTRANCE");
  for (const v of w.venues) {
    if (
      !w.buildings.some((b) => b.id === v.buildingId && b.zoneId === v.zoneId)
    )
      throw new Error("UNKNOWN_BUILDING");
    if (!spawn(v.safeSpawnId) || spawn(v.safeSpawnId)!.zoneId !== v.zoneId)
      throw new Error("UNKNOWN_SPAWN");
    if (
      v.identity.kind === "approximate" &&
      (!/^[a-z0-9._-]{1,120}$/.test(v.identity.factKey) ||
        !["building", "location", "hostel"].includes(v.identity.category))
    )
      throw new Error("BAD_SOURCE_ENTITY_LINK");
    if (
      v.identity.kind !== "approximate" &&
      (v.identity.kind !== "fictional" || v.identity.fixture !== true)
    )
      throw new Error("BAD_SOURCE_ENTITY_LINK");
  }
  for (const i of w.interactionPoints) {
    if (i.venueId && !w.venues.some((v) => v.id === i.venueId))
      throw new Error("UNKNOWN_VENUE");
    if (i.npcId && !w.npcSpawns.some((n) => n.id === i.npcId))
      throw new Error("UNKNOWN_NPC");
    if (i.transportId && !w.transportNodes.some((t) => t.id === i.transportId))
      throw new Error("UNKNOWN_TRANSPORT");
    if (!Number.isFinite(i.radius) || i.radius < 16 || i.radius > 160)
      throw new Error("INVALID_RADIUS");
    if (
      (i.command === "ENTER_VENUE" && !i.venueId) ||
      (i.command === "TRAVEL" && !i.transportId) ||
      (i.command === "TALK_TO_NPC" && !i.npcId)
    )
      throw new Error("INVALID_COMMAND_TARGET");
  }
  for (const t of w.transportNodes)
    for (const d of t.destinations)
      if (
        !spawn(d.spawnId) ||
        !Number.isFinite(d.virtualMinutes) ||
        d.virtualMinutes < 1
      )
        throw new Error("INVALID_TRANSPORT_DESTINATION");
  for (const n of w.npcSpawns) {
    parseAppearance(n.appearance);
    if (!n.fictional || n.route.some((p) => blocked(w, p)))
      throw new Error("INVALID_NPC");
  }
  for (const road of [...w.roads, ...w.paths])
    if (
      road.points.length < 2 ||
      road.points.some((p) => !contains(w.bounds, p)) ||
      road.width < 1 ||
      road.width > 150
    )
      throw new Error("INVALID_PATH");
  for (const b of w.assetBundles)
    if (
      !/^\/world-assets\/[a-z0-9/-]+\.[a-f0-9]{12}\.svg$/.test(b.path) ||
      !/^[a-f0-9]{64}$/.test(b.hash) ||
      !Number.isSafeInteger(b.bytes) ||
      b.bytes > 65536
    )
      throw new Error("INVALID_ASSET");
  if (new TextEncoder().encode(JSON.stringify(w)).length > 160000)
    throw new Error("MANIFEST_BUDGET");
  return w;
}
export type PublishedWorldFact = {
  id: string;
  campus: string;
  category: string;
  key: string;
  value: unknown;
  lastObservedAt: string | Date;
  staleAt: string | Date | null;
  sources: string[];
};
/** This adapter accepts ONLY the server published-catalogue read model. Never pass candidates here. */
export function compileWorldInformation(
  w: WorldManifest,
  published: PublishedWorldFact[],
  now = Date.now(),
) {
  return w.venues.map((v) => {
    const identity = v.identity;
    const fact =
      identity.kind === "approximate"
        ? published.find(
            (f) =>
              f.campus === w.campusId &&
              f.key === identity.factKey &&
              f.category === identity.category &&
              typeof f.value === "string" &&
              f.staleAt &&
              new Date(f.staleAt).getTime() > now &&
              new Date(f.lastObservedAt).getTime() <= now,
          )
        : undefined;
    return {
      venueId: v.id,
      name: fact ? String(fact.value) : v.name,
      verification: fact
        ? ("verified-identity" as const)
        : ("fictional" as const),
      geometry: "approximate" as const,
      ...(fact
        ? {
            factId: fact.id,
            lastObservedAt: fact.lastObservedAt,
            staleAt: fact.staleAt,
            sources: fact.sources.filter((s) => {
              try {
                return new URL(s).protocol === "https:";
              } catch {
                return false;
              }
            }),
          }
        : {}),
    };
  });
}
export type SafeLocation = {
  campusId: CampusId;
  worldVersion: number;
  spawnId: string;
  zoneId: string;
};
export function safeLocation(
  w: WorldManifest,
  saved?: { worldVersion: number; spawnId: string } | null,
): SafeLocation {
  const point =
    w.spawnPoints.find((s) => s.id === saved?.spawnId) ??
    w.spawnPoints.find((s) => s.id === w.defaultSpawnId)!;
  return {
    campusId: w.campusId,
    worldVersion: w.version,
    spawnId: point.id,
    zoneId: point.zoneId,
  };
}
export function parseWorldState(
  input: unknown,
  w: WorldManifest,
): SafeLocation & { appearance: Appearance } {
  if (!input || typeof input !== "object" || Array.isArray(input))
    throw new Error("INVALID_WORLD_STATE");
  const p = input as Record<string, unknown>;
  if (
    Object.keys(p).some(
      (k) => !["campusId", "worldVersion", "spawnId", "appearance"].includes(k),
    ) ||
    p.campusId !== w.campusId ||
    p.worldVersion !== w.version ||
    typeof p.spawnId !== "string" ||
    !w.spawnPoints.some((s) => s.id === p.spawnId)
  )
    throw new Error("INVALID_WORLD_STATE");
  return {
    ...safeLocation(w, { worldVersion: w.version, spawnId: p.spawnId }),
    appearance: parseAppearance(p.appearance),
  };
}
