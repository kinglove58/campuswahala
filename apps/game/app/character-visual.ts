import type Phaser from "phaser";
import {
  appearanceKey,
  facingFor,
  walkPose,
  type Appearance,
  type Facing,
} from "@campuswahala/game-engine";
import { characterAssets, characterSourceHash } from "./character-assets";
type Entry = {
  id: string;
  key: string;
  bodyHeight: number;
  refs: number;
  last: number;
};
/** One serial, cancellable raster queue; six bounded reusable textures per scene.
 * SVG comes only from the exact approved B rig + canonical values. Never user SVG.
 */
export class CharacterAtlasCache {
  entries = new Map<string, Entry>();
  pending = new Map<string, Promise<Entry>>();
  failures = 0;
  generated = 0;
  transferred = 0;
  peak = 0;
  disposed = false;
  private tail: Promise<unknown> = Promise.resolve();
  private cancelImages = new Set<() => void>();
  constructor(private scene: Phaser.Scene) {}
  acquire(appearance: Appearance): Promise<Entry> {
    if (this.disposed)
      return Promise.reject(new Error("CHARACTER_SCENE_DISPOSED"));
    const id = appearanceKey(appearance),
      cached = this.entries.get(id);
    if (cached) {
      cached.refs++;
      cached.last = performance.now();
      return Promise.resolve(cached);
    }
    let pending = this.pending.get(id);
    if (!pending) {
      if (this.pending.size >= 6)
        return Promise.reject(new Error("CHARACTER_QUEUE_BUDGET"));
      pending = this.tail.then(() => this.load(appearance, id));
      this.tail = pending.catch(() => undefined);
      this.pending.set(id, pending);
      void pending
        .finally(() => this.pending.delete(id))
        .catch(() => undefined);
    }
    return pending.then((entry) => {
      entry.refs++;
      entry.last = performance.now();
      return entry;
    });
  }
  release(entry: Entry) {
    entry.refs = Math.max(0, entry.refs - 1);
    entry.last = performance.now();
    this.trim(5);
  }
  private trim(limit: number) {
    for (const [id, entry] of [...this.entries].sort(
      (a, b) => a[1].last - b[1].last,
    ))
      if (this.entries.size > limit && entry.refs === 0) {
        this.scene.textures.remove(entry.key);
        this.entries.delete(id);
      }
  }
  private async image(src: string) {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        window.clearTimeout(timer);
        this.cancelImages.delete(cancel);
        img.onload = null;
        img.onerror = null;
      };
      const cancel = () => {
        cleanup();
        img.src = "";
        reject(new Error("CHARACTER_IMAGE_CANCELLED"));
      };
      const timer = window.setTimeout(cancel, 10000);
      this.cancelImages.add(cancel);
      img.onload = () => {
        cleanup();
        resolve();
      };
      img.onerror = () => {
        cleanup();
        reject(new Error("CHARACTER_IMAGE_UNAVAILABLE"));
      };
      img.src = src;
    });
    return img;
  }
  private async load(a: Appearance, id: string): Promise<Entry> {
    if (this.disposed) throw new Error("CHARACTER_SCENE_DISPOSED");
    this.trim(5);
    if (this.entries.size >= 6) throw new Error("CHARACTER_TEXTURE_BUDGET");
    const key = `cw-b-${characterSourceHash.slice(0, 12)}-${id}`;
    const known = characterAssets.find(
      (asset) => appearanceKey(asset.appearance) === id,
    );
    let bodyHeight = 152,
      texture: Phaser.Textures.Texture | null = null;
    try {
      if (known) {
        try {
          const img = await this.image(known.path);
          if (this.disposed) throw new Error("DISPOSED");
          texture = this.scene.textures.addImage(key, img);
          bodyHeight = known.bodyHeight;
          this.transferred += known.bytes;
        } catch {
          this.failures++;
          if (this.disposed) throw new Error("DISPOSED");
        }
      }
      if (!texture) {
        const { svg } = await import("./character-art.mjs");
        const canvas = document.createElement("canvas");
        canvas.width = 1024;
        canvas.height = 960;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("CANVAS_UNAVAILABLE");
        const cells: { dir: Facing; state: "idle" | "walk"; frame: number }[] =
          [];
        for (const dir of ["down", "up", "left", "right"] as const)
          for (const state of ["idle", "walk"] as const)
            for (let frame = 0; frame < (state === "idle" ? 2 : 8); frame++)
              cells.push({ dir, state, frame });
        // Eight small SVG images at a time, not forty serial decoder round trips.
        // One atlas job remains serial; transient image RGBA is at most 786432 B.
        for (let first = 0; first < cells.length; first += 8) {
          const batch = await Promise.allSettled(
            cells.slice(first, first + 8).map(async (cell, offset) => {
              if (this.disposed) throw new Error("DISPOSED");
              const index = first + offset;
              const url = URL.createObjectURL(
                new Blob([svg(a, cell.dir, cell.state, cell.frame)], {
                  type: "image/svg+xml",
                }),
              );
              try {
                const img = await this.image(url);
                if (this.disposed) throw new Error("DISPOSED");
                ctx.drawImage(
                  img,
                  (index % 8) * 128,
                  Math.floor(index / 8) * 192,
                  128,
                  192,
                );
              } finally {
                URL.revokeObjectURL(url);
              }
            }),
          );
          const failure = batch.find((result) => result.status === "rejected");
          if (failure?.status === "rejected") throw failure.reason;
        }
        // Measure the body independently of the ground/contact shadows.
        const body = document.createElement("canvas");
        body.width = 128;
        body.height = 192;
        const b = body.getContext("2d");
        if (!b) throw new Error("BODY_CANVAS_UNAVAILABLE");
        const url = URL.createObjectURL(
          new Blob([svg(a, "down", "idle", 0, false)], {
            type: "image/svg+xml",
          }),
        );
        try {
          b.drawImage(await this.image(url), 0, 0);
        } finally {
          URL.revokeObjectURL(url);
        }
        const rgba = b.getImageData(0, 0, 128, 192).data;
        let top = 192,
          bottom = 0;
        for (let y = 0; y < 192; y++)
          for (let x = 0; x < 128; x++)
            if ((rgba[(y * 128 + x) * 4 + 3] ?? 0) >= 16) {
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
        bodyHeight = bottom - top + 1;
        if (this.disposed) throw new Error("DISPOSED");
        texture = this.scene.textures.addCanvas(key, canvas);
        this.generated++;
      }
      if (!texture) throw new Error("TEXTURE_UNAVAILABLE");
      let i = 0;
      for (const dir of ["down", "up", "left", "right"])
        for (const state of ["idle", "walk"])
          for (let n = 0; n < (state === "idle" ? 2 : 8); n++, i++)
            texture.add(
              `${dir}-${state}-${n}`,
              0,
              (i % 8) * 128,
              Math.floor(i / 8) * 192,
              128,
              192,
            );
      const entry = { id, key, bodyHeight, refs: 0, last: performance.now() };
      this.entries.set(id, entry);
      this.peak = Math.max(this.peak, this.entries.size);
      return entry;
    } catch (error) {
      this.failures++;
      if (texture) this.scene.textures.remove(key);
      throw error;
    }
  }
  dispose() {
    this.disposed = true;
    for (const cancel of this.cancelImages) cancel();
    for (const entry of this.entries.values())
      this.scene.textures.remove(entry.key);
    this.entries.clear();
  }
}
export class CharacterVisual {
  sprite: Phaser.GameObjects.Sprite;
  entry: Entry | null = null;
  appearance = "";
  facing: Facing = "down";
  distance = 0;
  state: "idle" | "walk" = "idle";
  frame = 0;
  failed = false;
  private wantVisible = true;
  private serial = 0;
  private disposed = false;
  private previous: { x: number; y: number };
  constructor(
    private scene: Phaser.Scene,
    private cache: CharacterAtlasCache,
    x: number,
    y: number,
    a: Appearance,
  ) {
    this.previous = { x, y };
    this.sprite = scene.add
      .sprite(x, y, "__DEFAULT")
      .setOrigin(0.5, 177 / 192)
      .setVisible(false);
    void this.setAppearance(a);
  }
  async setAppearance(a: Appearance) {
    const key = appearanceKey(a);
    if (key === this.appearance && !this.failed) return;
    this.appearance = key;
    this.failed = false;
    const serial = ++this.serial;
    try {
      const entry = await this.cache.acquire(a);
      if (this.disposed || serial !== this.serial) {
        this.cache.release(entry);
        return;
      }
      const old = this.entry;
      this.entry = entry;
      this.sprite
        .setTexture(entry.key, `${this.facing}-idle-0`)
        .setVisible(this.wantVisible);
      if (old) this.cache.release(old);
      this.failed = false;
    } catch {
      this.failed = true;
      // Keep the previous approved sprite during transient composition failure.
      // First load retries the approved default precomposition, never old graphics.
      if (!this.entry && serial === this.serial && !this.disposed) {
        const fallback = characterAssets[0]!.appearance;
        if (appearanceKey(fallback) !== key) void this.setAppearance(fallback);
      }
    }
  }
  update(
    x: number,
    y: number,
    time: number,
    scale: number,
    reduced: boolean,
    paused: boolean,
    visible = true,
  ) {
    this.wantVisible = visible;
    const dx = x - this.previous.x,
      dy = y - this.previous.y;
    this.previous = { x, y };
    const moving = !paused && Math.hypot(dx, dy) > 0.01;
    const facing = facingFor(dx, dy, this.facing);
    if (facing !== this.facing) this.distance = 0;
    this.facing = facing;
    if (moving) this.distance += Math.hypot(dx, dy);
    this.state = moving ? "walk" : "idle";
    this.frame =
      reduced || paused
        ? 0
        : moving
          ? walkPose(this.distance, scale, this.facing)
          : Math.floor(time / 500) % 2;
    this.sprite
      .setPosition(x, y)
      .setDepth(4000 + y)
      .setScale(scale)
      .setVisible(visible && !!this.entry);
    if (this.entry)
      this.sprite.setFrame(`${this.facing}-${this.state}-${this.frame}`);
  }
  dispose() {
    this.disposed = true;
    this.serial++;
    this.sprite.destroy();
    if (this.entry) this.cache.release(this.entry);
    this.entry = null;
  }
}
