/* global Phaser, document, window, performance */
import { WorldEngine, blocked } from "../../../packages/game-engine/src/index";
// This file is bundled only by the isolated proof server; no app imports it.
const spec = await (await fetch("/spec.json")).json();
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const directionInput = document.querySelector("#direction");
const motionInput = document.querySelector("#motion");
const lookInput = document.querySelector("#look");
const engine = new WorldEngine(spec.world);
engine.npcMotion = !reduced;
const observations = {
  errors: [],
  frameMs: [],
  direction: "down",
  state: "idle",
  look: 0,
  authorityRequests: 0,
  reduced,
};
window.__cwM1 = observations;
let selected = 0,
  lastFacing = "down",
  scene;
const proofZoom = window.innerWidth < 600 ? 0.88 : 1.05;
const scale = Math.min(
  0.65,
  ((window.innerHeight - 69) * 0.1) /
    (spec.atlases[0].frames[0].bodyAlpha.height * proofZoom),
);
class Proof extends Phaser.Scene {
  constructor() {
    super({ key: "cw-m1-proof" });
  }
  preload() {
    const visible = engine.visibleZones({
      x: engine.position.x - window.innerWidth / proofZoom / 2,
      y: engine.position.y - (window.innerHeight - 69) / proofZoom / 2,
      width: window.innerWidth / proofZoom,
      height: (window.innerHeight - 69) / proofZoom,
    });
    for (const asset of spec.world.assetBundles.filter((a) =>
      visible.some((z) => z.bundle === a.id),
    ))
      this.load.svg(asset.id, asset.path);
    for (const look of [0, 4, 5])
      this.load.image(`look-${look}`, `/atlas/${spec.atlases[look].path}`);
    this.load.on("loaderror", (file) => observations.errors.push(file.key));
  }
  create() {
    scene = this.scene.get("cw-m1-proof");
    const w = spec.world;
    this.add
      .rectangle(
        w.bounds.width / 2,
        w.bounds.height / 2,
        w.bounds.width,
        w.bounds.height,
        w.palette.ground,
      )
      .setDepth(-100);
    const roads = this.add.graphics().setDepth(-90);
    for (const road of [...w.roads, ...w.paths]) {
      roads.lineStyle(road.width + 12, 0xe7dbc1);
      roads.strokePoints(road.points);
      roads.lineStyle(
        road.width,
        road.id.includes("road") ? 0x7f8580 : 0xe7d6ac,
      );
      roads.strokePoints(road.points);
    }
    for (const asset of w.assetBundles) {
      const zone = w.zones.find((z) => z.bundle === asset.id);
      if (zone && this.textures.exists(asset.id))
        this.add
          .image(zone.x, zone.y, asset.id)
          .setOrigin(0)
          .setDepth(-60)
          .setDisplaySize(zone.width, zone.height);
    }
    // Unmodified v2 geometry/palette: deliberately not an M3 exterior upgrade.
    for (const b of w.buildings) {
      this.add
        .rectangle(
          b.x + b.width / 2,
          b.y + b.height / 2,
          b.width,
          b.height,
          b.color ?? w.palette.wall,
        )
        .setDepth(100 + b.y);
      this.add
        .rectangle(
          b.x + b.width / 2,
          b.y + 12,
          b.width + 10,
          30,
          w.palette.roof,
        )
        .setDepth(101 + b.y);
    }
    for (const id of [0, 4, 5]) this.register(id);
    this.player = this.add
      .sprite(engine.position.x, engine.position.y, "look-0", "down-idle-0")
      .setOrigin(0.5, spec.geometry.foot.y / spec.geometry.height)
      .setScale(scale);
    const free = [];
    for (const offset of [
      { x: -65, y: 15 },
      { x: 65, y: 15 },
      { x: 0, y: 65 },
      { x: 0, y: -65 },
    ]) {
      const point = {
        x: engine.position.x + offset.x,
        y: engine.position.y + offset.y,
      };
      if (!blocked(w, point)) free.push(point);
    }
    if (free.length < 2)
      throw new Error("M1 NPC proof requires safe existing-ground positions");
    this.npcs = [4, 5].map((id, index) =>
      this.add
        .sprite(free[index].x, free[index].y, `look-${id}`, "down-idle-0")
        .setOrigin(0.5, spec.geometry.foot.y / spec.geometry.height)
        .setScale(scale),
    );
    this.keys = this.input.keyboard.addKeys(
      "UP,DOWN,LEFT,RIGHT,W,A,S,D",
      false,
    );
    this.input.on("pointerdown", (pointer) =>
      engine.moveTo(this.cameras.main.getWorldPoint(pointer.x, pointer.y)),
    );
    this.cameras.main
      .setBounds(0, 0, w.bounds.width, w.bounds.height)
      .setZoom(window.innerWidth < 600 ? 0.88 : 1.05);
    this.cameras.main.startFollow(
      this.player,
      true,
      reduced ? 1 : 0.1,
      reduced ? 1 : 0.1,
    );
    this.cameras.main.roundPixels = true;
    this.game.canvas.tabIndex = 0;
    observations.peakAtlasCount = 3;
    observations.ready = true;
  }
  register(id) {
    const atlas = spec.atlases[id],
      texture = this.textures.get(`look-${id}`);
    for (const f of atlas.frames)
      texture.add(f.name, 0, f.x, f.y, f.width, f.height);
    for (const dir of spec.directions)
      for (const state of ["idle", "walk"])
        this.anims.create({
          key: `${id}-${dir}-${state}`,
          frames: atlas.frames
            .filter((f) => f.direction === dir && f.state === state)
            .map((f) => ({ key: `look-${id}`, frame: f.name })),
          frameRate: state === "idle" ? 2 : 8,
          repeat: -1,
        });
  }
  update(_time, delta) {
    if (!this.player) return;
    const old = { ...engine.position };
    engine.tick(delta, {
      x:
        Number(this.keys.RIGHT.isDown || this.keys.D.isDown) -
        Number(this.keys.LEFT.isDown || this.keys.A.isDown),
      y:
        Number(this.keys.DOWN.isDown || this.keys.S.isDown) -
        Number(this.keys.UP.isDown || this.keys.W.isDown),
    });
    const dx = engine.position.x - old.x,
      dy = engine.position.y - old.y;
    const moving = Math.hypot(dx, dy) > 0.01;
    if (moving) {
      lastFacing =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? "left"
            : "right"
          : dy < 0
            ? "up"
            : "down";
      directionInput.value = lastFacing;
    }
    const facing = moving ? lastFacing : directionInput.value;
    const state = moving || motionInput.value === "walk" ? "walk" : "idle";
    this.player
      .setPosition(engine.position.x, engine.position.y)
      .setDepth(200 + engine.position.y);
    for (const [sprite, id] of [
      [this.player, selected],
      ...this.npcs.map((sprite, index) => [sprite, index + 4]),
    ]) {
      sprite.setDepth(200 + sprite.y);
      if (reduced) {
        sprite.anims.stop();
        sprite.setFrame(`${facing}-${state}-0`);
      } else sprite.play(`${id}-${facing}-${state}`, true);
    }
    const frame = spec.atlases[selected].frames.find(
      (f) => f.name === this.player.frame.name,
    );
    const bodyHeight = frame.bodyAlpha.height * scale * this.cameras.main.zoom;
    observations.direction = facing;
    observations.state = state;
    observations.look = selected;
    observations.frame = this.player.frame.name;
    const key = `${selected}-${facing}-${state}`;
    observations.seen ??= {};
    observations.seen[key] ??= [];
    if (!observations.seen[key].includes(this.player.frame.name))
      observations.seen[key].push(this.player.frame.name);
    observations.position = { ...engine.position };
    observations.zoom = this.cameras.main.zoom;
    observations.canvas = {
      width: this.scale.width,
      height: this.scale.height,
    };
    observations.bodyHeight = bodyHeight;
    observations.bodyPercent = (bodyHeight / this.scale.height) * 100;
    observations.foot = {
      x: spec.geometry.foot.x,
      y: spec.geometry.foot.y,
      originX: this.player.originX,
      originY: this.player.originY,
    };
    observations.loadedAtlases = this.textures
      .getTextureKeys()
      .filter((key) => key.startsWith("look-"));
    observations.decodedAtlasBytes =
      observations.loadedAtlases.length * 1024 * 960 * 4;
    observations.activeNpcCount = this.npcs.length;
    if (observations.frameMs.length < 180 && delta < 250)
      observations.frameMs.push(delta);
    document.querySelector("#metrics").textContent =
      `${facing} ${state} · ${bodyHeight.toFixed(1)}px / ${observations.bodyPercent.toFixed(1)}% canvas · art review pending`;
  }
}
const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: "world",
  width: window.innerWidth,
  height: window.innerHeight - 69,
  backgroundColor: "#b9c996",
  scene: Proof,
  render: { antialias: true, roundPixels: true },
});
lookInput.addEventListener("change", () => {
  const next = Number(lookInput.value);
  if (![0, 1, 2, 3].includes(next) || !scene || selected === next) return;
  const old = selected;
  observations.switching = true;
  scene.load.image(`look-${next}`, `/atlas/${spec.atlases[next].path}`);
  scene.load.once("complete", () => {
    observations.peakAtlasCount = Math.max(
      observations.peakAtlasCount,
      scene.textures.getTextureKeys().filter((key) => key.startsWith("look-"))
        .length,
    );
    scene.register(next);
    scene.player.anims.stop();
    scene.player.setTexture(`look-${next}`, "down-idle-0");
    selected = next;
    for (const dir of spec.directions)
      for (const state of ["idle", "walk"])
        scene.anims.remove(`${old}-${dir}-${state}`);
    scene.textures.remove(`look-${old}`);
    observations.switching = false;
  });
  scene.load.start();
});
window.addEventListener("beforeunload", () => {
  engine.dispose();
  game.destroy(true);
});
observations.bootAt = performance.now();
