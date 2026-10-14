"use client";
import { useEffect, useRef, useState } from "react";
import {
  WorldEngine,
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
    const zoneBuildings = new Map(
      manifest.zones.map((z) => [
        z.id,
        manifest.buildings.filter((b) => b.zoneId === z.id),
      ]),
    );
    const zoneDecorations = new Map(
      manifest.zones.map((z) => [
        z.id,
        manifest.decorations.filter((d) => d.zoneId === z.id),
      ]),
    );
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
          labels = new Map<string, PhaserType.GameObjects.Text>();
          lastSnapshot = 0;
          lastChunk = 0;
          lastMotionTime: number | null = null;
          frames = 0;
          frameTotal = 0;
          lastMetric = 0;
          assetFailures = 0;
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
                manifest.palette.ground,
              )
              .setDepth(-100);
            const roads = this.add.graphics().setDepth(-90);
            for (const road of [...manifest.roads, ...manifest.paths]) {
              roads.lineStyle(road.width + 12, 0xe7dbc1, 1);
              roads.strokePoints(road.points);
              roads.lineStyle(
                road.width,
                road.id.includes("road") ? 0x7f8580 : 0xe7d6ac,
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
                roads.lineStyle(2, 0xf7e9bf, 0.6);
                roads.strokePoints(road.points);
              }
            }
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
              const bundle = manifest.assetBundles.find(
                (b) => b.id === zone.bundle,
              )!;
              if (
                !this.loadedBundles.has(bundle.id) &&
                !this.loadingBundles.has(bundle.id) &&
                !this.failedBundles.has(bundle.id)
              ) {
                this.loadingBundles.add(bundle.id);
                const start = performance.now();
                this.load.svg(bundle.id, bundle.path, {
                  width: 64,
                  height: 80,
                });
                this.load.once(`filecomplete-svg-${bundle.id}`, () => {
                  this.loadingBundles.delete(bundle.id);
                  this.loadedBundles.add(bundle.id);
                  performance.measure("cw.asset_load_ms", {
                    start,
                    end: performance.now(),
                  });
                });
                const failed = (file: PhaserType.Loader.File) => {
                  if (file.key !== bundle.id) return;
                  this.assetFailures++;
                  this.failedBundles.add(bundle.id);
                  this.loadingBundles.delete(bundle.id);
                  this.load.off("loaderror", failed);
                };
                this.load.on("loaderror", failed);
                this.load.once(`filecomplete-svg-${bundle.id}`, () =>
                  this.load.off("loaderror", failed),
                );
                if (!this.load.isLoading()) this.load.start();
              }
              const g = this.add.graphics();
              chunk.add(g);
              // Ground variation is deterministic, cosmetic and drawn once per chunk.
              for (let j = 0; j < 48; j++) {
                const x = zone.x + 32 + ((j * 131) % (zone.width - 64));
                const y = zone.y + 32 + ((j * 197) % (zone.height - 64));
                g.fillStyle(
                  j % 2 ? 0xf3e6bc : manifest.palette.foliage,
                  j % 2 ? 0.2 : 0.09,
                );
                g.fillEllipse(x, y, 25 + (j % 13), 12);
              }
              if (
                manifest.artDirection.waterfrontSocialZone &&
                zone.type === "social"
              ) {
                g.fillStyle(manifest.palette.water, 0.8);
                g.fillRoundedRect(
                  zone.x + 12,
                  zone.y + 12,
                  zone.width - 24,
                  125,
                  30,
                );
                g.lineStyle(2, 0xd6eee3, 0.7);
                for (let j = 0; j < 10; j++)
                  g.lineBetween(
                    zone.x + 60 + j * 90,
                    zone.y + 65,
                    zone.x + 100 + j * 90,
                    zone.y + 65,
                  );
              }
              for (const b of zoneBuildings.get(zone.id) ?? []) {
                // Long projected shadow and visible wall base give roofs height.
                g.fillStyle(0x20342c, 0.2);
                g.fillRoundedRect(b.x + 12, b.y + 16, b.width, b.height, 5);
                g.fillStyle(0x8e7b62);
                g.fillRoundedRect(b.x + 4, b.y + 18, b.width, b.height, 5);
                g.fillStyle(manifest.palette.wall);
                g.fillRoundedRect(b.x, b.y, b.width, b.height, 5);
                g.fillStyle(manifest.palette.roof);
                g.fillRoundedRect(
                  b.x - 8,
                  b.y - 14,
                  b.width + 16,
                  b.silhouette === "tower" ? 48 : 38,
                  4,
                );
                if (manifest.artDirection.roofStyle === "pitched") {
                  g.fillStyle(0xb98060);
                  g.fillTriangle(
                    b.x - 8,
                    b.y - 14,
                    b.x + b.width / 2,
                    b.y - 42,
                    b.x + b.width + 8,
                    b.y - 14,
                  );
                  g.lineStyle(1, 0x713f2d, 0.45);
                  for (let j = 0; j < 8; j++)
                    g.lineBetween(
                      b.x + (j * b.width) / 8,
                      b.y - 8,
                      b.x + (j * b.width) / 8,
                      b.y + 20,
                    );
                } else if (manifest.artDirection.roofStyle === "brutalist") {
                  g.fillStyle(0xb5aa8d);
                  g.fillRect(b.x - 14, b.y - 26, b.width + 28, 16);
                  g.fillStyle(0xe9dfc2);
                  for (let j = 0; j < 8; j++)
                    g.fillRect(b.x + (j * b.width) / 8, b.y - 32, 8, 32);
                  g.fillStyle(0x725f4a, 0.25);
                  g.fillRect(b.x - 8, b.y + 16, b.width + 16, 8);
                } else {
                  g.fillStyle(0x39666f);
                  g.fillRoundedRect(b.x - 6, b.y - 25, b.width + 12, 15, 4);
                  g.fillStyle(0xf4efd9);
                  for (let j = 0; j < 5; j++)
                    g.fillRect(b.x + 15 + j * 40, b.y + 18, 6, b.height - 28);
                }
                if (b.silhouette === "hall") {
                  g.fillStyle(0xf5ecd6);
                  for (let i = 0; i < 5; i++)
                    g.fillRect(b.x + 12 + i * 35, b.y + 34, 8, 85);
                }
                g.fillStyle(0x52747c);
                for (let i = 0; i < 4; i++) {
                  g.fillRect(b.x + 15 + i * 42, b.y + 43, 22, 20);
                  if (b.silhouette === "tower")
                    g.fillRect(b.x + 15 + i * 42, b.y + 76, 22, 16);
                }
                g.lineStyle(2, 0xc6bea8);
                for (let j = 0; j < 4; j++)
                  g.strokeRect(b.x + 15 + j * 42, b.y + 43, 22, 20);
                g.fillStyle(0x31513c);
                g.fillRoundedRect(
                  b.x + b.width / 2 - 32,
                  b.y + b.height - 50,
                  64,
                  15,
                  3,
                );
                g.fillStyle(0xf0e0bb);
                g.fillRect(b.x + b.width / 2 - 15, b.y + b.height + 3, 30, 6);
                g.fillRect(b.x + b.width / 2 - 22, b.y + b.height + 10, 44, 6);
                g.fillStyle(0x694e37);
                g.fillRect(b.x + b.width / 2 - 12, b.y + b.height - 32, 24, 32);
                if (b.silhouette === "market") {
                  g.fillStyle(0xd8a858);
                  g.fillRect(b.x - 6, b.y + 55, b.width + 12, 24);
                  g.fillStyle(0xf8e8bb);
                  for (let i = 0; i < 7; i++)
                    g.fillRect(b.x + i * 28, b.y + 55, 14, 24);
                }
                const venue = manifest.venues.find(
                  (v) => v.buildingId === b.id,
                )!;
                const label = this.add
                  .text(
                    b.x + b.width / 2,
                    b.y + b.height + 48,
                    props.current.venueNames[venue.id] ?? venue.name,
                    {
                      fontFamily: "Arial",
                      fontSize: "14px",
                      color: "#263a2e",
                      backgroundColor: "#f7edda",
                      padding: { x: 8, y: 5 },
                    },
                  )
                  .setOrigin(0.5);
                chunk.add(label);
                this.labels.set(venue.id, label);
              }
              for (const d of zoneDecorations.get(zone.id) ?? []) {
                if (d.type === "tree" || d.type === "palm") {
                  if (this.textures.exists(bundle.id) && d.type === "tree") {
                    chunk.add(
                      this.add.image(d.x, d.y, bundle.id).setOrigin(0.5, 1),
                    );
                  } else {
                    g.fillStyle(0x24372b, 0.13);
                    g.fillEllipse(d.x + 7, d.y + 2, 50, 16);
                    g.fillStyle(0x94704b);
                    g.fillRect(d.x - 3, d.y - 22, 6, 25);
                    g.fillStyle(manifest.palette.foliage);
                    if (d.type === "palm") {
                      for (let j = 0; j < 6; j++) {
                        const a = (j * Math.PI) / 3;
                        g.fillTriangle(
                          d.x,
                          d.y - 35,
                          d.x + Math.cos(a) * 37,
                          d.y - 35 + Math.sin(a) * 23,
                          d.x + Math.cos(a + 0.5) * 18,
                          d.y - 35 + Math.sin(a + 0.5) * 15,
                        );
                      }
                    } else {
                      g.fillCircle(d.x, d.y - 35, 26);
                      g.fillStyle(0xa8b97a, 0.5);
                      g.fillCircle(d.x - 9, d.y - 44, 14);
                    }
                  }
                }
                if (d.type === "bench") {
                  g.fillStyle(0x2e4134, 0.15);
                  g.fillEllipse(d.x + 4, d.y + 9, 48, 14);
                  g.fillStyle(0x8d6845);
                  g.fillRoundedRect(d.x - 24, d.y - 5, 48, 7, 2);
                  g.fillRoundedRect(d.x - 24, d.y - 16, 48, 6, 2);
                  g.fillStyle(0x3c493e);
                  g.fillRect(d.x - 18, d.y + 1, 4, 10);
                  g.fillRect(d.x + 14, d.y + 1, 4, 10);
                }
                if (d.type === "banner") {
                  g.fillStyle(0x536149);
                  g.fillRect(d.x - 2, d.y - 46, 4, 50);
                  g.fillStyle(0xc87651);
                  g.fillRoundedRect(d.x + 2, d.y - 46, 31, 37, 2);
                  g.lineStyle(3, 0xf4d9a5);
                  g.lineBetween(d.x + 9, d.y - 34, d.x + 25, d.y - 34);
                }
                if (d.type === "lamp") {
                  g.fillStyle(0x5b6050);
                  g.fillRect(d.x - 2, d.y - 44, 4, 46);
                  g.fillStyle(0xf4d88b);
                  g.fillCircle(d.x, d.y - 45, 7);
                }
                if (d.type === "notice") {
                  g.fillStyle(0x72563e);
                  g.fillRect(d.x - 22, d.y - 26, 44, 32);
                  g.fillRect(d.x - 18, d.y + 6, 4, 18);
                  g.fillRect(d.x + 14, d.y + 6, 4, 18);
                  g.fillStyle(0xf2dfb9);
                  g.fillRect(d.x - 17, d.y - 21, 34, 22);
                  g.lineStyle(2, 0xb57550);
                  g.lineBetween(d.x - 11, d.y - 14, d.x + 10, d.y - 14);
                }
                if (d.type === "shuttle") {
                  g.fillStyle(0xdfb34e);
                  g.fillRoundedRect(d.x - 32, d.y - 15, 64, 31, 7);
                  g.fillStyle(0x456169);
                  g.fillRoundedRect(d.x - 23, d.y - 12, 44, 11, 3);
                  g.fillStyle(0x303932);
                  g.fillCircle(d.x - 18, d.y + 16, 6);
                  g.fillCircle(d.x + 18, d.y + 16, 6);
                }
              }
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
              for (const [id, label] of this.labels) {
                if (label.active)
                  label.setText(
                    p.venueNames[id] ??
                      manifest.venues.find((v) => v.id === id)!.name,
                  );
              }
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
          type: Phaser.AUTO,
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
