"use client";
import { useEffect, useRef, useState } from "react";
import {
  WorldEngine,
  exteriorAssets,
  npcPosition,
  cameraProfile,
  navigationPace,
  appearanceKey,
  type WorldManifest,
  type Appearance,
  type Weather,
} from "@campuswahala/game-engine";
import type PhaserType from "phaser";
import { CharacterAtlasCache, CharacterVisual } from "./character-visual";
import { ExteriorVisual } from "./exterior-visual";
export type WorldSnapshot = {
  x: number;
  y: number;
  zoneId: string;
  nearbyId: string | null;
  clock: string;
  day: string;
  week: number;
  hour: number;
  period: string;
  weather: Weather;
  battery: number;
  fastRoute: boolean;
};
export type WorldHandle = {
  engine: WorldEngine;
  zoom: (value: number) => void;
};
export default function CampusWorld({
  manifest,
  venueNames,
  appearance,
  spawnId,
  paused,
  waypoint,
  weather,
  academicMinute,
  onSnapshot,
  onReady,
}: {
  manifest: WorldManifest;
  venueNames: Record<string, string>;
  appearance: Appearance;
  spawnId: string;
  paused: boolean;
  waypoint: string | null;
  weather: Weather | "auto";
  academicMinute: number | null;
  onSnapshot: (s: WorldSnapshot) => void;
  onReady: (h: WorldHandle) => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    props = useRef({
      venueNames,
      appearance,
      paused,
      waypoint,
      weather,
      academicMinute,
      onSnapshot,
      onReady,
    });
  useEffect(() => {
    props.current = {
      venueNames,
      appearance,
      paused,
      waypoint,
      weather,
      academicMinute,
      onSnapshot,
      onReady,
    };
  }, [
    venueNames,
    appearance,
    paused,
    waypoint,
    weather,
    academicMinute,
    onSnapshot,
    onReady,
  ]);
  const [status, setStatus] = useState<"opening" | "ready" | "failed">(
    "opening",
  );
  useEffect(() => {
    let disposed = false,
      game: PhaserType.Game | undefined;
    const npcIndex = new Map(manifest.npcSpawns.map((n) => [n.id, n]));
    const engine = new WorldEngine(manifest, spawnId),
      boot = performance.now();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    engine.npcMotion = !reduced;
    void import("phaser")
      .then(({ default: Phaser }) => {
        if (disposed || !container.current) return;
        class CampusScene extends Phaser.Scene {
          person!: CharacterVisual;
          exterior!: ExteriorVisual;
          atlas!: CharacterAtlasCache;
          profile = cameraProfile(360, 731, reduced);
          zoomFactor = 1;
          characterReady = false;
          avatarKey = "";
          avatarChangedAt = 0;
          lastAvatarAttempt = 0;
          keys!: Record<string, PhaserType.Input.Keyboard.Key>;
          chunks = new Map<string, PhaserType.GameObjects.Container>();
          loadingBundles = new Set<string>();
          loadedBundles = new Set<string>();
          failedBundles = new Set<string>();
          npcs = new Map<string, CharacterVisual>();
          overlay!: PhaserType.GameObjects.Graphics;
          rain!: PhaserType.GameObjects.Graphics;
          navigation!: PhaserType.GameObjects.Graphics;
          lastSnapshot = 0;
          lastChunk = 0;
          lastMotionTime: number | null = null;
          frames = 0;
          frameTotal = 0;
          lastMetric = 0;
          assetFailures = 0;
          wallFrames: number[] = [];
          lastWallFrame = 0;
          create() {
            this.cameras.main.setBounds(
              0,
              0,
              manifest.bounds.width,
              manifest.bounds.height,
            );
            this.add
              .rectangle(
                manifest.bounds.width / 2,
                manifest.bounds.height / 2,
                manifest.bounds.width,
                manifest.bounds.height,
                exteriorAssets[manifest.campusId].palette.ground,
              )
              .setDepth(-100);
            const roads = this.add.graphics().setDepth(-90);
            for (const road of [...manifest.roads, ...manifest.paths]) {
              roads.lineStyle(road.width + 16, 0xa99e83, 1);
              roads.strokePoints(road.points);
              roads.lineStyle(road.width + 10, 0xe4d7b7, 1);
              roads.strokePoints(road.points);
              roads.lineStyle(
                road.width,
                road.id.includes("road") ? 0x737d78 : 0xd8c7a3,
                1,
              );
              roads.beginPath();
              road.points.forEach((p, i) =>
                i ? roads.lineTo(p.x, p.y) : roads.moveTo(p.x, p.y),
              );
              roads.strokePath();
              if (road.id.includes("road")) {
                // Compressed virtual crossings, never physical road directions.
                const p = road.points[0]!;
                roads.fillStyle(0xf1ecda, 0.85);
                for (let j = 0; j < 6; j++)
                  roads.fillRect(
                    p.x + 100 + j * 13,
                    p.y - road.width / 2 + 10,
                    7,
                    road.width - 20,
                  );
                roads.fillStyle(0xf1e5bd, 0.75);
                const end = road.points.at(-1)!;
                for (let x = p.x + 25; x < end.x - 10; x += 48)
                  roads.fillRect(x, p.y - 1, 23, 2);
              }
            }
            this.exterior = new ExteriorVisual(
              this,
              manifest,
              () => props.current.venueNames,
            );
            this.exterior.load();
            this.atlas = new CharacterAtlasCache(this);
            this.profile = cameraProfile(
              this.scale.width,
              this.scale.height,
              reduced,
            );
            this.person = new CharacterVisual(
              this,
              this.atlas,
              engine.position.x,
              engine.position.y,
              props.current.appearance,
            );
            this.avatarKey = appearanceKey(props.current.appearance);
            const camera = this.cameras.main;
            const applyZoom = (factor: number) => {
              this.zoomFactor = Math.max(0.8, Math.min(1.2, factor));
              camera.setZoom(
                Math.max(
                  this.profile.minZoom,
                  Math.min(
                    this.profile.maxZoom,
                    this.profile.defaultZoom * this.zoomFactor,
                  ),
                ),
              );
            };
            applyZoom(1);
            const resize = () => {
              this.profile = cameraProfile(
                this.scale.width,
                this.scale.height,
                reduced,
              );
              applyZoom(this.zoomFactor);
            };
            this.scale.on("resize", resize);
            this.events.once("shutdown", () => {
              this.scale.off("resize", resize);
              this.person.dispose();
              for (const npc of this.npcs.values()) npc.dispose();
              this.npcs.clear();
              this.atlas.dispose();
              this.exterior.dispose();
            });
            camera.startFollow(
              this.person.sprite,
              true,
              this.profile.follow,
              this.profile.follow,
            );
            camera.roundPixels = true;
            this.keys = this.input.keyboard!.addKeys(
              "W,A,S,D,UP,DOWN,LEFT,RIGHT",
              false,
            ) as Record<string, PhaserType.Input.Keyboard.Key>;

            this.input.on("pointerdown", (p: PhaserType.Input.Pointer) => {
              if (!props.current.paused)
                engine.moveTo(camera.getWorldPoint(p.x, p.y));
            });
            this.overlay = this.add
              .graphics()
              .setScrollFactor(0)
              .setDepth(9000);
            this.rain = this.add.graphics().setScrollFactor(0).setDepth(9001);
            this.navigation = this.add.graphics().setDepth(5500);
            this.events.once("shutdown", () => engine.dispose());
            this.updateChunks();

            performance.measure("cw.world_boot_ms", {
              start: boot,
              end: performance.now(),
            });
            props.current.onReady({
              engine,
              zoom: applyZoom,
            });
          }
          updateChunks() {
            const visible = engine.visibleZones(this.cameras.main.worldView);
            this.exterior.update(visible, this.cameras.main.worldView);
            for (const [id, chunk] of this.chunks)
              if (!visible.some((z) => z.id === id)) {
                chunk.destroy(true);
                this.chunks.delete(id);
                for (const [nid, n] of this.npcs)
                  if (npcIndex.get(nid)?.zoneId === id) {
                    n.dispose();
                    this.npcs.delete(nid);
                  }
              }
            for (const zone of visible) {
              if (this.chunks.has(zone.id)) continue;
              const chunk = this.add.container(0, 0).setDepth(1);
              this.chunks.set(zone.id, chunk);
              for (const n of manifest.npcSpawns.filter(
                (n) => n.zoneId === zone.id,
              )) {
                if (this.npcs.size >= 16) break;
                const npc = new CharacterVisual(
                  this,
                  this.atlas,
                  n.x,
                  n.y,
                  n.appearance,
                );
                this.npcs.set(n.id, npc);
              }
            }
          }
          update(time: number, delta: number) {
            if (!this.person) return;
            const wallNow = performance.now();
            if (this.lastWallFrame) {
              this.wallFrames.push(wallNow - this.lastWallFrame);
              if (this.wallFrames.length > 600) this.wallFrames.shift();
            }
            this.lastWallFrame = wallNow;
            const p = props.current;
            if (engine.phoneOpen !== p.paused) engine.setPhone(p.paused);
            const down = (key: string) => (this.keys[key]?.isDown ? 1 : 0);
            const input = {
              x:
                Math.max(down("D"), down("RIGHT")) -
                Math.max(down("A"), down("LEFT")),
              y:
                Math.max(down("S"), down("DOWN")) -
                Math.max(down("W"), down("UP")),
            };
            const pace = navigationPace(
              engine.position,
              engine.path,
              engine.mapRoute && !(input.x || input.y),
            );
            const presentationDelta =
              this.lastMotionTime === null
                ? Math.min(delta, 50)
                : time - this.lastMotionTime;
            this.lastMotionTime = time;
            engine.tick(
              delta,
              input,
              pace.speed,
              pace.fast ? undefined : presentationDelta,
            );
            this.person.update(
              engine.position.x,
              engine.position.y,
              time,
              this.profile.spriteScale,
              reduced,
              p.paused,
            );
            if (appearanceKey(p.appearance) !== this.avatarKey) {
              this.avatarKey = appearanceKey(p.appearance);
              this.avatarChangedAt = time;
            }
            if (
              !p.paused &&
              time - this.avatarChangedAt >= 150 &&
              (this.person.appearance !== this.avatarKey ||
                (this.person.failed && time - this.lastAvatarAttempt > 1000))
            ) {
              this.lastAvatarAttempt = time;
              void this.person.setAppearance(p.appearance);
            }
            if (this.person.entry && !this.characterReady) {
              this.characterReady = true;
              setStatus("ready");
            }
            if (
              !this.person.entry &&
              this.person.failed &&
              this.atlas.pending.size === 0
            )
              setStatus("failed");
            const metrics = container.current;
            if (metrics) {
              metrics.dataset.exteriorCampus = manifest.campusId;
              metrics.dataset.exteriorVersion = "1";
              metrics.dataset.renderer =
                this.game.renderer.type === Phaser.CANVAS ? "canvas" : "webgl";
              metrics.dataset.exteriorReady = String(this.exterior.ready);
              metrics.dataset.exteriorFailed = String(this.exterior.failed);
              metrics.dataset.exteriorFallback = String(
                this.exterior.failed && !this.exterior.ready,
              );
              metrics.dataset.exteriorObjects = String(
                this.exterior.objectCount,
              );
              metrics.dataset.exteriorPeakObjects = String(
                this.exterior.peakObjects,
              );
              metrics.dataset.exteriorChunks = String(
                this.exterior.chunks.size,
              );
              metrics.dataset.exteriorDecodedBytes = String(
                this.exterior.ready ? this.exterior.asset.decodedBytes : 0,
              );
              metrics.dataset.characterReady = String(!!this.person.entry);
              metrics.dataset.appearance = this.person.entry?.id ?? "loading";
              metrics.dataset.requestedAppearance = this.avatarKey;
              metrics.dataset.characterFrame = `${this.person.facing}-${this.person.state}-${this.person.frame}`;
              metrics.dataset.position = JSON.stringify(engine.position);
              metrics.dataset.navigationSpeed = String(pace.speed);
              metrics.dataset.simulationElapsed = String(engine.elapsedMs);
              metrics.dataset.motionTime = String(time);
              metrics.dataset.navigationPath = JSON.stringify(engine.path);
              const inputOrigin = this.cameras.main.getWorldPoint(0, 0);
              metrics.dataset.cameraView = JSON.stringify({
                x: inputOrigin.x,
                y: inputOrigin.y,
              });
              metrics.dataset.fastRoute = String(pace.fast);
              metrics.dataset.bodyHeight = String(
                (this.person.entry?.bodyHeight ?? 152) *
                  this.profile.spriteScale *
                  this.cameras.main.zoom,
              );
              metrics.dataset.canvasHeight = String(this.scale.height);
              metrics.dataset.cameraZoom = String(this.cameras.main.zoom);
              metrics.dataset.cameraProfile = this.profile.version;
              metrics.dataset.activeNpcs = String(
                [...this.npcs.values()].filter((n) => n.sprite.visible).length,
              );
              metrics.dataset.characterTextures = String(
                this.atlas.entries.size,
              );
              metrics.dataset.decodedCharacterBytes = String(
                this.atlas.entries.size * 3932160,
              );
              metrics.dataset.characterPeakTextures = String(this.atlas.peak);
              metrics.dataset.characterGenerated = String(this.atlas.generated);
              metrics.dataset.characterTransferBytes = String(
                this.atlas.transferred,
              );
              metrics.dataset.characterFailures = String(this.atlas.failures);
              metrics.dataset.characterPending = String(
                this.atlas.pending.size,
              );
            }
            if (time - this.lastChunk > 250) {
              this.updateChunks();
              this.lastChunk = time;
            }
            engine.academicMinute = p.academicMinute;
            const clock = engine.time,
              weather = p.weather === "auto" ? clock.weather : p.weather;
            for (const [id, npc] of this.npcs) {
              const n = npcIndex.get(id)!;
              const view = this.cameras.main.worldView;
              const nearby =
                Math.abs(npc.sprite.x - engine.position.x) < view.width &&
                Math.abs(npc.sprite.y - engine.position.y) < view.height;
              const active =
                nearby &&
                clock.hour >= n.activeHours[0] &&
                clock.hour < n.activeHours[1];
              const pos =
                active && !p.paused && !reduced
                  ? npcPosition(n, engine.elapsedMs)
                  : { x: npc.sprite.x, y: npc.sprite.y };
              npc.update(
                pos.x,
                pos.y,
                time,
                this.profile.spriteScale,
                reduced,
                p.paused,
                active,
              );
            }
            this.exterior.occlude(engine.position.x, engine.position.y);
            this.overlay.clear();
            const alpha =
              { morning: 0.03, afternoon: 0, evening: 0.18, night: 0.42 }[
                clock.period
              ] ?? 0;
            this.overlay.fillStyle(
              clock.period === "evening" ? 0x6e392e : 0x15283e,
              alpha,
            );
            this.overlay.fillRect(0, 0, this.scale.width, this.scale.height);
            this.rain.clear();
            if (weather === "rain") {
              this.rain.fillStyle(0x263a4e, 0.12);
              this.rain.fillRect(0, 0, this.scale.width, this.scale.height);
              this.rain.lineStyle(1, 0xd3e0dc, 0.55);
              for (let i = 0; i < 55; i++) {
                const x = (i * 97 + time * 0.045) % this.scale.width,
                  y =
                    (i * 137 + (reduced ? 0 : time * 0.35)) % this.scale.height;
                this.rain.lineBetween(x, y, x - 4, y + 12);
              }
            }
            this.navigation.clear();
            if (p.waypoint) {
              const v = manifest.venues.find((v) => v.id === p.waypoint),
                s = manifest.spawnPoints.find((s) => s.id === v?.safeSpawnId);
              if (s) {
                this.navigation.lineStyle(3, 0x9c542e, 0.8);
                this.navigation.strokeCircle(s.x, s.y, 27);
                const angle = Math.atan2(
                    s.y - engine.position.y,
                    s.x - engine.position.x,
                  ),
                  x = engine.position.x + Math.cos(angle) * 52,
                  y = engine.position.y + Math.sin(angle) * 52;
                this.navigation.fillStyle(0x9c542e);
                this.navigation.fillTriangle(
                  x + Math.cos(angle) * 12,
                  y + Math.sin(angle) * 12,
                  x + Math.cos(angle + 2.3) * 9,
                  y + Math.sin(angle + 2.3) * 9,
                  x + Math.cos(angle - 2.3) * 9,
                  y + Math.sin(angle - 2.3) * 9,
                );
              }
            }
            if (time - this.lastSnapshot > 300) {
              this.exterior.refreshLabels();
              p.onSnapshot({
                ...engine.position,
                zoneId: engine.zoneId,
                nearbyId: engine.nearby?.id ?? null,
                clock: clock.label,
                day: clock.day,
                week: clock.week,
                hour: clock.hour,
                period: clock.period,
                weather,
                battery: Math.round(engine.battery.value),
                fastRoute: pace.fast,
              });
              this.lastSnapshot = time;
            }
            this.frames++;
            this.frameTotal += delta;
            if (time - this.lastMetric > 10000) {
              container.current?.setAttribute(
                "data-average-frame-ms",
                (this.frameTotal / this.frames).toFixed(1),
              );
              container.current?.setAttribute(
                "data-asset-failures",
                String(this.assetFailures),
              );
              const wall = [...this.wallFrames].sort((a, b) => a - b);
              container.current?.setAttribute(
                "data-wall-frame-p95-ms",
                String(wall[Math.floor(wall.length * 0.95)] ?? 0),
              );
              container.current?.setAttribute(
                "data-wall-frame-mean-ms",
                String(
                  wall.reduce((a, b) => a + b, 0) / Math.max(1, wall.length),
                ),
              );
              // Optional Chromium measurement: local diagnostic only, never transmitted.
              const memory = (
                performance as Performance & {
                  memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
                }
              ).memory;
              if (memory?.jsHeapSizeLimit) {
                container.current?.setAttribute(
                  "data-memory-warning",
                  String(memory.usedJSHeapSize / memory.jsHeapSizeLimit > 0.8),
                );
              }
              this.lastMetric = time;
            }
          }
        }
        game = new Phaser.Game({
          // This scene uses 2D sprites/Graphics only. Canvas avoids software
          // WebGL raster overhead without changing camera, source art or physics.
          type: Phaser.CANVAS,
          parent: container.current,
          width: container.current.clientWidth,
          height: container.current.clientHeight,
          scene: CampusScene,
          backgroundColor: "#d4dfb6",
          scale: { mode: Phaser.Scale.RESIZE },
          render: { antialias: true, pixelArt: false },
          fps: { target: 30 },
          audio: { noAudio: true },
          callbacks: {
            postBoot: (g) => {
              g.canvas.setAttribute(
                "aria-label",
                "Virtual campus. Use arrow keys or WASD to walk; tap a destination.",
              );
              g.canvas.setAttribute("role", "img");
              g.canvas.tabIndex = 0;
            },
          },
        });
      })
      .catch(() => {
        if (!disposed) setStatus("failed");
      });
    return () => {
      disposed = true;
      game?.destroy(true);
      engine.dispose();
    };
  }, [manifest, spawnId]);
  return (
    <div
      className="phaser-container"
      ref={container}
      data-testid="campus-world"
      data-ready={status === "ready"}
    >
      {status !== "ready" && (
        <div
          className="world-loading"
          role={status === "failed" ? "alert" : "status"}
        >
          {status === "failed" ? (
            <>
              Campus gates are temporarily closed.
              <button onClick={() => window.location.reload()}>Retry</button>
            </>
          ) : (
            `Opening ${manifest.campusId.toUpperCase()}…`
          )}
        </div>
      )}
    </div>
  );
}
