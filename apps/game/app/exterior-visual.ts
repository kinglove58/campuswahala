import type Phaser from "phaser";
import {
  exteriorAssets,
  exteriorLayout,
  exteriorDepth,
  buildingArchetype,
  type WorldManifest,
  type Zone,
  type Rect,
  type ExteriorKind,
} from "@campuswahala/game-engine";
/** One local hashed atlas; static chunk ground; independent ground-Y image ordering. */
export class ExteriorVisual {
  readonly asset;
  readonly key;
  labels = new Map<string, Phaser.GameObjects.Text>();
  ready = false;
  failed = false;
  peakObjects = 0;
  chunks = new Map<string, Phaser.GameObjects.GameObject[]>();
  images = new Map<string, Phaser.GameObjects.Image[]>();
  constructor(
    private scene: Phaser.Scene,
    private world: WorldManifest,
    private names: () => Record<string, string>,
  ) {
    this.asset = exteriorAssets[world.campusId];
    this.key = `exterior-${world.campusId}-v1`;
  }
  load() {
    this.scene.load.svg(this.key, this.asset.path, {
      width: this.asset.width,
      height: this.asset.height,
    });
    this.scene.load.once(`filecomplete-svg-${this.key}`, () => {
      const texture = this.scene.textures.get(this.key);
      for (const [kind, f] of Object.entries(this.asset.frames))
        texture.add(kind, 0, f.x, f.y, f.width, f.height);
      this.ready = true;
    });
    const error = (file: Phaser.Loader.File) => {
      if (file.key === this.key) {
        this.failed = true;
        this.scene.load.off("loaderror", error);
      }
    };
    this.scene.load.on("loaderror", error);
    this.scene.load.once(`filecomplete-svg-${this.key}`, () =>
      this.scene.load.off("loaderror", error),
    );
    this.scene.events.once("shutdown", () =>
      this.scene.load.off("loaderror", error),
    );
    if (!this.scene.load.isLoading()) this.scene.load.start();
  }
  update(zones: Zone[], view: Rect) {
    if (!this.ready && !this.failed) return;
    for (const [id, objects] of this.chunks)
      if (!zones.some((z) => z.id === id)) {
        for (const o of objects) o.destroy();
        this.chunks.delete(id);
        this.images.delete(id);
      }
    for (const z of zones) if (!this.chunks.has(z.id)) this.draw(z);
    // Zone ownership is coarse; explicit sprite bounds culling avoids drawing
    // entire off-screen groves on desktop software renderers.
    for (const images of this.images.values())
      for (const image of images) {
        const f = this.asset.frames[image.frame.name as ExteriorKind];
        const left = image.x - f.pivotX * image.scaleX;
        const top = image.y - f.pivotY * image.scaleY;
        image.setVisible(
          left + image.displayWidth >= view.x - 12 &&
            left <= view.x + view.width + 12 &&
            top + image.displayHeight >= view.y - 12 &&
            top <= view.y + view.height + 12,
        );
      }
    this.peakObjects = Math.max(
      this.peakObjects,
      [...this.chunks.values()].reduce((n, c) => n + c.length, 0),
    );
  }
  private draw(z: Zone) {
    if (!this.ready) {
      this.drawFallback(z);
      return;
    }
    const scene = this.scene,
      owned: Phaser.GameObjects.GameObject[] = [],
      images: Phaser.GameObjects.Image[] = [];
    const g = scene.add.graphics().setDepth(-70);
    owned.push(g);
    // Small paving joints and planted beds batched once per visible chunk.
    const p = this.asset.palette;
    // Graphics commands are tessellated during rendering, even outside the
    // camera. Keep floor accents to cheap quads; detail/density lives in the
    // shared textured props instead of hundreds of repeated vector ellipses.
    for (let i = 0; i < 24; i++) {
      const x = z.x + 35 + ((i * 137) % (z.width - 70));
      const y = z.y + 35 + ((i * 229) % (z.height - 70));
      g.fillStyle(0xe4dcb7, 0.12);
      g.fillRect(x, y, 8, 2);
    }
    for (const b of this.world.buildings.filter((b) => b.zoneId === z.id)) {
      g.fillStyle(p.paving, 1);
      g.fillRoundedRect(b.x - 16, b.y + b.height - 8, b.width + 32, 65, 6);
      g.lineStyle(1, 0xa9997d, 0.3);
      for (let x = b.x - 16; x < b.x + b.width + 16; x += 18)
        g.lineBetween(x, b.y + b.height, x, b.y + b.height + 55);
      for (let y = b.y + b.height; y < b.y + b.height + 60; y += 14)
        g.lineBetween(b.x - 16, y, b.x + b.width + 16, y);
    }
    if (this.world.artDirection.waterfrontSocialZone && z.type === "social") {
      g.fillStyle(this.world.palette.water);
      g.fillRoundedRect(z.x + 15, z.y + 15, z.width - 30, 128, 20);
      g.lineStyle(2, 0xd5e8d8, 0.55);
      for (let j = 0; j < 16; j++)
        g.lineBetween(z.x + 35 + j * 65, z.y + 75, z.x + 65 + j * 65, z.y + 75);
      g.lineStyle(6, 0xe8d8b5);
      g.lineBetween(z.x + 15, z.y + 145, z.x + z.width - 15, z.y + 145);
    }
    const add = (
      kind: ExteriorKind,
      x: number,
      y: number,
      sx: number,
      sy = sx,
    ) => {
      const f = this.asset.frames[kind],
        img = scene.add
          .image(x, y, this.key, kind)
          .setOrigin(f.pivotX / f.width, f.pivotY / f.height)
          .setScale(sx, sy)
          .setDepth(exteriorDepth(y));
      owned.push(img);
      images.push(img);
      return img;
    };
    for (const b of this.world.buildings.filter((b) => b.zoneId === z.id)) {
      const v = this.world.venues.find((v) => v.buildingId === b.id)!;
      add(
        buildingArchetype(v.type),
        b.x + b.width / 2,
        b.y + b.height,
        (b.width + 40) / 256,
        (b.height + 115) / 256,
      );
      const label = scene.add
        .text(
          b.x + b.width / 2,
          b.y + b.height + 49,
          this.names()[v.id] ?? v.name,
          {
            fontFamily: "Arial",
            fontSize: "12px",
            color: "#344c40",
            backgroundColor: "#f2e6c9",
            padding: { x: 6, y: 3 },
          },
        )
        .setOrigin(0.5)
        .setDepth(exteriorDepth(b.y + b.height + 49));
      owned.push(label);
      this.labels.set(v.id, label);
    }
    for (const d of this.world.decorations.filter((d) => d.zoneId === z.id)) {
      if (d.type === "water") continue;
      const kind: ExteriorKind = d.type === "shuttle" ? "shuttle" : d.type;
      add(
        kind,
        d.x,
        d.y,
        kind === "tree" ? 1.08 : kind === "palm" ? 1.12 : 0.8,
      );
    }
    for (const d of exteriorLayout(this.world, z))
      add(d.kind, d.x, d.y, d.scale);
    // Roadside parking and shelters use existing shuttle anchors; no new collider or command.
    for (const t of this.world.transportNodes.filter(
      (t) => t.zoneId === z.id,
    )) {
      add("shelter", t.x + 80, t.y + 55, 0.95);
      add("car", t.x + 170, t.y + 45, 0.8);
      add("sign", t.x + 35, t.y + 70, 0.7);
    }
    this.chunks.set(z.id, owned);
    this.images.set(z.id, images);
  }
  private drawFallback(z: Zone) {
    const owned: Phaser.GameObjects.GameObject[] = [];
    const g = this.scene.add.graphics().setDepth(-70);
    owned.push(g);
    for (const b of this.world.buildings.filter((b) => b.zoneId === z.id)) {
      g.fillStyle(this.world.palette.wall);
      g.fillRect(b.x, b.y, b.width, b.height);
      g.lineStyle(3, this.world.palette.roof);
      g.strokeRect(b.x, b.y, b.width, b.height);
      const v = this.world.venues.find((v) => v.buildingId === b.id)!;
      owned.push(
        this.scene.add
          .text(
            b.x + b.width / 2,
            b.y + b.height + 42,
            this.names()[v.id] ?? v.name,
            { fontSize: "12px", color: "#344c40", backgroundColor: "#f2e6c9" },
          )
          .setOrigin(0.5)
          .setDepth(exteriorDepth(b.y + b.height + 42)),
      );
    }
    this.chunks.set(z.id, owned);
    this.images.set(z.id, []);
  }
  refreshLabels() {
    for (const [id, label] of this.labels) {
      if (!label.active) {
        this.labels.delete(id);
        continue;
      }
      label.setText(
        this.names()[id] ?? this.world.venues.find((v) => v.id === id)!.name,
      );
    }
  }
  occlude(x: number, y: number) {
    // Translucency keeps the player legible behind foreground crowns and roofs.
    for (const images of this.images.values())
      for (const image of images) {
        if (!image.visible) continue;
        const f = this.asset.frames[image.frame.name as ExteriorKind];
        const left = image.x - f.pivotX * image.scaleX,
          top = image.y - f.pivotY * image.scaleY;
        const alpha =
          y < image.y &&
          x > left &&
          x < left + image.displayWidth &&
          y > top &&
          y < image.y
            ? 0.58
            : 1;
        if (image.alpha !== alpha) image.setAlpha(alpha);
      }
  }
  get objectCount() {
    return [...this.chunks.values()].reduce((n, c) => n + c.length, 0);
  }
  dispose() {
    for (const c of this.chunks.values()) for (const o of c) o.destroy();
    this.chunks.clear();
    this.images.clear();
    this.labels.clear();
    if (this.scene.textures.exists(this.key))
      this.scene.textures.remove(this.key);
  }
}
