import {
  blocked,
  contains,
  safeLocation,
  type WorldManifest,
  type Point,
  type Interaction,
  type Appearance,
  defaultAppearance,
} from "./world";
export type WorldEvents = {
  PLAYER_ENTERED_ZONE: { zoneId: string };
  PLAYER_APPROACHED_VENUE: { venueId: string };
  PLAYER_ENTERED_VENUE: { venueId: string };
  PHONE_OPENED: Record<string, never>;
  TIME_PERIOD_CHANGED: { period: string };
  TRANSPORT_USED: { nodeId: string; spawnId: string };
  NPC_INTERACTED: { npcId: string };
  INTENT: { interaction: Interaction };
};
export class WorldEventBus {
  private listeners = new Map<keyof WorldEvents, Set<(value: never) => void>>();
  on<K extends keyof WorldEvents>(
    name: K,
    listener: (value: WorldEvents[K]) => void,
  ) {
    const list = this.listeners.get(name) ?? new Set();
    list.add(listener as (value: never) => void);
    this.listeners.set(name, list);
    return () => {
      list.delete(listener as (value: never) => void);
    };
  }
  emit<K extends keyof WorldEvents>(name: K, value: WorldEvents[K]) {
    this.listeners.get(name)?.forEach((fn) => fn(value as never));
  }
  clear() {
    this.listeners.clear();
  }
}
export type Weather = "clear" | "cloudy" | "rain";
export function campusTime(elapsedMs: number) {
  const total = 7 * 60 + Math.floor(Math.max(0, elapsedMs) / 1500),
    day = Math.floor(total / 1440),
    minutes = total % 1440,
    hour = Math.floor(minutes / 60);
  return {
    day: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ][day % 7]!,
    week: 1 + Math.floor(day / 7),
    hour,
    minute: minutes % 60,
    label: `${String(hour).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
    period:
      hour < 6
        ? "night"
        : hour < 12
          ? "morning"
          : hour < 17
            ? "afternoon"
            : hour < 20
              ? "evening"
              : "night",
    semesterContext: null,
    weather: (Math.floor(total / 120) % 3 === 2
      ? "rain"
      : Math.floor(total / 120) % 3 === 1
        ? "cloudy"
        : "clear") as Weather,
  };
}
export const defaultDevice = {
  model: "CW Pocket One",
  batteryCapacity: 100,
  cameraQuality: "basic",
  performanceTier: "standard",
  prestige: 0,
} as const;
export class PocketBattery {
  value = 100;
  tick(seconds: number, open: boolean) {
    this.value = Math.max(
      20,
      this.value - Math.max(0, seconds) * (open ? 0.006 : 0.001),
    );
  }
}
/** Runtime is independent of React and rendering. Cosmetic time/NPC/movement never award resources. */
export class WorldEngine {
  academicMinute: number | null = null;
  readonly bus = new WorldEventBus();
  readonly battery = new PocketBattery();
  position: Point;
  appearance: Appearance = { ...defaultAppearance };
  path: Point[] = [];
  mapRoute = false;
  waypoint: string | null = null;
  elapsedMs = 0;
  paused = false;
  phoneOpen = false;
  npcMotion = true;
  zoneId = "";
  nearby: Interaction | null = null;
  private period = "";
  constructor(
    readonly manifest: WorldManifest,
    spawnId?: string,
  ) {
    const safe = safeLocation(
      manifest,
      spawnId ? { spawnId, worldVersion: manifest.version } : null,
    );
    const s = manifest.spawnPoints.find((p) => p.id === safe.spawnId)!;
    this.position = { x: s.x, y: s.y };
    this.zoneId = s.zoneId;
  }
  get time() {
    return campusTime(
      this.academicMinute === null
        ? this.elapsedMs
        : Math.max(0, this.academicMinute - 420) * 1500,
    );
  }
  setPhone(open: boolean) {
    this.phoneOpen = open;
    this.paused = open;
    this.path = [];
    this.mapRoute = false;
    if (open) this.bus.emit("PHONE_OPENED", {});
  }
  moveTo(target: Point, mapRoute = false) {
    this.path = findPath(this.manifest, this.position, target);
    this.mapRoute = mapRoute && this.path.length > 0;
  }
  /** Presentation only: a validated manifest spawn grants no server presence/credit. */
  resumeAtSpawn(spawnId: string) {
    const spawn = this.manifest.spawnPoints.find((s) => s.id === spawnId);
    if (!spawn) return false;
    this.position = { x: spawn.x, y: spawn.y };
    this.zoneId = spawn.zoneId;
    this.path = [];
    this.mapRoute = false;
    this.waypoint = null;
    return true;
  }
  setWaypoint(venueId: string) {
    const v = this.manifest.venues.find((v) => v.id === venueId);
    if (!v) return false;
    this.waypoint = v.id;
    return true;
  }
  travel(nodeId: string, spawnId: string) {
    const t = this.manifest.transportNodes.find((t) => t.id === nodeId);
    if (
      !t ||
      Math.hypot(t.x - this.position.x, t.y - this.position.y) > 120 ||
      !t.destinations.some((d) => d.spawnId === spawnId)
    )
      return false;
    const p = this.manifest.spawnPoints.find((s) => s.id === spawnId)!;
    this.position = { x: p.x, y: p.y };
    this.path = [];
    this.mapRoute = false;
    this.bus.emit("TRANSPORT_USED", { nodeId, spawnId });
    return true;
  }
  intent() {
    if (!this.nearby) return;
    const i = this.nearby;
    this.bus.emit("INTENT", { interaction: i });
    if (i.venueId)
      this.bus.emit("PLAYER_ENTERED_VENUE", { venueId: i.venueId });
    if (i.npcId) this.bus.emit("NPC_INTERACTED", { npcId: i.npcId });
  }
  tick(delta: number, direction: Point = { x: 0, y: 0 }, cosmeticSpeed = 230) {
    const dt = Math.max(0, Math.min(delta, 50));
    this.elapsedMs += dt;
    this.battery.tick(dt / 1000, this.phoneOpen);
    const time = this.time;
    if (time.period !== this.period) {
      this.period = time.period;
      this.bus.emit("TIME_PERIOD_CHANGED", { period: time.period });
    }
    if (this.paused) return;
    // Renderers may choose a cosmetic navigation pace; elapsed/academic time and
    // collision rules are independent. Default preserves existing consumers.
    const speed =
      (dt / 1000) *
      (Number.isFinite(cosmeticSpeed)
        ? Math.max(0, Math.min(230, cosmeticSpeed))
        : 230);
    let target = this.path[0];
    if (direction.x || direction.y) {
      this.path = [];
      this.mapRoute = false;
      const len = Math.hypot(direction.x, direction.y);
      target = {
        x: this.position.x + (direction.x / len) * speed,
        y: this.position.y + (direction.y / len) * speed,
      };
    }
    if (target) {
      const d = Math.hypot(
          target.x - this.position.x,
          target.y - this.position.y,
        ),
        r = d ? Math.min(1, speed / d) : 0;
      const next = {
        x: this.position.x + (target.x - this.position.x) * r,
        y: this.position.y + (target.y - this.position.y) * r,
      };
      if (!blocked(this.manifest, next)) this.position = next;
      else {
        const x = { x: next.x, y: this.position.y },
          y = { x: this.position.x, y: next.y };
        if (!blocked(this.manifest, x)) this.position = x;
        else if (!blocked(this.manifest, y)) this.position = y;
        else this.path = [];
      }
      if (d <= speed) this.path.shift();
    }
    if (!this.path.length) this.mapRoute = false;
    const zone = this.manifest.zones.find((z) => contains(z, this.position));
    if (zone && zone.id !== this.zoneId) {
      this.zoneId = zone.id;
      this.bus.emit("PLAYER_ENTERED_ZONE", { zoneId: zone.id });
    }
    const location = (i: Interaction) => {
      const npc = this.manifest.npcSpawns.find((n) => n.id === i.npcId);
      return npc && this.npcMotion ? npcPosition(npc, this.elapsedMs) : i;
    };
    const nearby =
      this.manifest.interactionPoints
        .filter((i) => {
          const npc = this.manifest.npcSpawns.find((n) => n.id === i.npcId);
          return (
            !npc ||
            (time.hour >= npc.activeHours[0] && time.hour < npc.activeHours[1])
          );
        })
        .filter(
          (i) =>
            Math.hypot(
              location(i).x - this.position.x,
              location(i).y - this.position.y,
            ) <= i.radius,
        )
        .sort(
          (a, b) =>
            Math.hypot(
              location(a).x - this.position.x,
              location(a).y - this.position.y,
            ) -
            Math.hypot(
              location(b).x - this.position.x,
              location(b).y - this.position.y,
            ),
        )[0] ?? null;
    if (nearby?.id !== this.nearby?.id && nearby?.venueId)
      this.bus.emit("PLAYER_APPROACHED_VENUE", { venueId: nearby.venueId });
    this.nearby = nearby;
  }
  visibleZones(
    view: { x: number; y: number; width: number; height: number },
    pad = 180,
  ) {
    return this.manifest.zones.filter(
      (z) =>
        z.x < view.x + view.width + pad &&
        z.y < view.y + view.height + pad &&
        z.x + z.width > view.x - pad &&
        z.y + z.height > view.y - pad,
    );
  }
  dispose() {
    this.bus.clear();
  }
}
/** Bounded grid A*: no diagonal corner cutting; paths are cosmetic and never server authority. */
export function findPath(w: WorldManifest, from: Point, to: Point): Point[] {
  if (blocked(w, to)) return [];
  // Nearby taps should not overshoot a grid centre and turn back for the final
  // pixel. A short, conservatively sampled clear segment needs no A* detour.
  // Obstructed/long routes retain the existing bounded grid search below.
  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  if (distance <= 128) {
    const steps = Math.max(1, Math.ceil(distance / 4));
    let clear = true;
    for (let i = 0; i <= steps; i++) {
      const fraction = i / steps;
      if (
        blocked(
          w,
          {
            x: from.x + (to.x - from.x) * fraction,
            y: from.y + (to.y - from.y) * fraction,
          },
          18,
        )
      ) {
        clear = false;
        break;
      }
    }
    if (clear) return [to];
  }
  const cell = 32,
    cols = Math.ceil(w.bounds.width / cell),
    rows = Math.ceil(w.bounds.height / cell);
  const key = (x: number, y: number) => y * cols + x,
    point = (k: number) => ({
      x: (k % cols) * cell + cell / 2,
      y: Math.floor(k / cols) * cell + cell / 2,
    });
  const start = key(Math.floor(from.x / cell), Math.floor(from.y / cell)),
    end = key(Math.floor(to.x / cell), Math.floor(to.y / cell));
  const open = new Set([start]),
    cost = new Map([[start, 0]]),
    parent = new Map<number, number>();
  const heuristic = (k: number) => {
    const p = point(k);
    return Math.abs(p.x - to.x) + Math.abs(p.y - to.y);
  };
  let iterations = 0;
  while (open.size && iterations++ < 16000) {
    let current = -1,
      best = Infinity;
    for (const k of open) {
      const score = cost.get(k)! + heuristic(k);
      if (score < best) {
        current = k;
        best = score;
      }
    }
    if (current === end) {
      const out: Point[] = [to];
      let k = current;
      while (k !== start) {
        out.unshift(point(k));
        k = parent.get(k)!;
      }
      return out;
    }
    open.delete(current);
    const x = current % cols,
      y = Math.floor(current / cols);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const nx = x + dx!,
        ny = y + dy!;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      const next = key(nx, ny);
      if (blocked(w, point(next), 18)) continue;
      const score = cost.get(current)! + cell;
      if (score < (cost.get(next) ?? Infinity)) {
        parent.set(next, current);
        cost.set(next, score);
        open.add(next);
      }
    }
  }
  return [];
}
export function npcPosition(
  n: WorldManifest["npcSpawns"][number],
  elapsed: number,
): Point {
  if (n.pattern === "idle" || n.pattern === "stationary" || !n.route.length)
    return n;
  const route = [n, ...n.route, n],
    step = elapsed / 8000,
    idx = Math.floor(step) % (route.length - 1),
    a = route[idx]!,
    b = route[idx + 1]!,
    ratio = step % 1;
  return { x: a.x + (b.x - a.x) * ratio, y: a.y + (b.y - a.y) * ratio };
}
