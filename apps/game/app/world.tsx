"use client";
import { useEffect, useRef, useState } from "react";
import type { CampusPack } from "@campuswahala/campus-content";
import {
  advancePosition,
  clampPosition,
  WORLD,
} from "@campuswahala/game-engine";
export default function CampusWorld({
  pack,
  avatar,
  paused,
  onNearby,
}: {
  pack: CampusPack;
  avatar: string;
  paused: boolean;
  onNearby: (location: CampusPack["locations"][number] | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(paused);
  const nearbyCallback = useRef(onNearby);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);
  useEffect(() => {
    nearbyCallback.current = onNearby;
  }, [onNearby]);
  useEffect(() => {
    let disposed = false;
    let game: import("phaser").Game | undefined;
    void import("phaser")
      .then(({ default: Phaser }) => {
        if (disposed || !container.current) return;
        class CampusScene extends Phaser.Scene {
          private person!: Phaser.GameObjects.Container;
          private keys!: Record<string, Phaser.Input.Keyboard.Key>;
          private target = { x: 480, y: 360 };
          private nearest = "";
          create() {
            const g = this.add.graphics();
            g.fillStyle(0xdce7c7);
            g.fillRect(0, 0, WORLD.width, WORLD.height);
            // Deterministic decorative grass, no real geographic claims.
            for (let i = 0; i < 140; i++) {
              g.fillStyle(i % 2 ? 0xcddbb6 : 0xe4edcf, 0.8);
              g.fillCircle((i * 137) % 960, (i * 73) % 640, 2);
            }
            g.fillStyle(0xe9dfbf);
            g.fillRoundedRect(30, 285, 900, 74, 18);
            g.fillRoundedRect(440, 35, 75, 565, 18);
            g.fillRoundedRect(150, 105, 65, 440, 15);
            g.fillRoundedRect(750, 95, 55, 450, 15);
            g.lineStyle(2, 0xd1c396, 0.8);
            for (let x = 40; x < 930; x += 35)
              g.lineBetween(x, 320, x + 15, 320);
            g.fillStyle(0xb0c894);
            g.fillEllipse(490, 375, 125, 65);
            g.fillStyle(0xf4ebcf);
            g.fillEllipse(480, 361, 97, 42);
            for (let i = 0; i < 24; i++) {
              const x = ((i * 193 + 30) % 920) + 20,
                y = ((i * 89 + 40) % 570) + 30;
              if (
                Math.abs(x - 480) < 85 ||
                Math.abs(y - 320) < 75 ||
                pack.locations.some((l) => Math.hypot(l.x - x, l.y - y) < 105)
              )
                continue;
              g.fillStyle(0x152b24, 0.12);
              g.fillEllipse(x + 8, y + 19, 48, 19);
              g.fillStyle(0x8b7151);
              g.fillRect(x - 3, y, 6, 22);
              g.fillStyle(i % 2 ? 0x729969 : 0x5f8960);
              g.fillCircle(x, y - 8, 22);
              g.fillStyle(0x86a874);
              g.fillCircle(x - 8, y - 14, 12);
            }
            pack.locations.forEach((l, index) => {
              if (l.id === "commons") {
                this.add
                  .text(l.x, l.y - 75, l.label, {
                    fontFamily: "Arial",
                    fontSize: "14px",
                    color: "#324932",
                    backgroundColor: "#f5f1e5",
                    padding: { x: 9, y: 6 },
                  })
                  .setOrigin(0.5);
                return;
              }
              const width = 155,
                height = 90;
              g.fillStyle(0x162b24, 0.13);
              g.fillRoundedRect(
                l.x - width / 2 + 12,
                l.y - height / 2 + 19,
                width,
                height,
                9,
              );
              g.fillStyle([0xf5eacd, 0xefd6bb, 0xe9d9bd, 0xd4dfd1][index % 4]!);
              g.fillRoundedRect(
                l.x - width / 2,
                l.y - height / 2,
                width,
                height,
                7,
              );
              g.fillStyle([0x8a9c80, 0xbd8864, 0xbda17c, 0x899b84][index % 4]!);
              g.fillRoundedRect(
                l.x - width / 2 - 6,
                l.y - height / 2 - 8,
                width + 12,
                25,
                5,
              );
              g.fillStyle(0x7c8e80);
              for (let j = 0; j < 3; j++)
                g.fillRect(l.x - 54 + j * 40, l.y - 7, 20, 19);
              g.fillStyle(0x735d45);
              g.fillRect(l.x - 9, l.y + 21, 18, 24);
              this.add
                .text(l.x, l.y + 65, l.label, {
                  fontFamily: "Arial",
                  fontSize: "14px",
                  color: "#324932",
                  backgroundColor: "#f5f1e5",
                  padding: { x: 9, y: 6 },
                })
                .setOrigin(0.5);
            });
            [
              [350, 290],
              [580, 350],
              [580, 180],
              [370, 475],
            ].forEach(([x, y], i) => {
              const npc = this.add.graphics();
              npc.fillStyle(0x6b4437);
              npc.fillCircle(0, -10, 6);
              npc.fillStyle([0xcc8a61, 0x8092ad, 0xb5a26b, 0x688c73][i]!);
              npc.fillRoundedRect(-7, -3, 14, 18, 4);
              npc.setPosition(x!, y!);
            });
            const shadow = this.add.ellipse(0, 18, 27, 9, 0x162b24, 0.25);
            const body = this.add
              .rectangle(
                0,
                3,
                20,
                25,
                avatar === "lime"
                  ? 0xd8ee89
                  : avatar === "clay"
                    ? 0xcb714f
                    : 0x7295c0,
              )
              .setStrokeStyle(2, 0x324932);
            const head = this.add
              .circle(0, -16, 10, 0x744f3b)
              .setStrokeStyle(2, 0x3c3526);
            const hair = this.add.arc(0, -20, 10, 180, 360, false, 0x242b23);
            this.person = this.add
              .container(480, 360, [shadow, body, head, hair])
              .setDepth(10);
            this.keys = this.input.keyboard!.addKeys(
              "W,A,S,D,UP,DOWN,LEFT,RIGHT",
            ) as Record<string, Phaser.Input.Keyboard.Key>;
            this.input.on(
              "pointerdown",
              (pointer: import("phaser").Input.Pointer) => {
                if (!pausedRef.current)
                  this.target = clampPosition({
                    x: pointer.worldX,
                    y: pointer.worldY,
                  });
              },
            );
            setReady(true);
          }
          update(_time: number, delta: number) {
            if (!this.person || pausedRef.current) return;
            const down = (key: string) => this.keys[key]?.isDown ?? false;
            const dx =
              Number(down("D") || down("RIGHT")) -
              Number(down("A") || down("LEFT"));
            const dy =
              Number(down("S") || down("DOWN")) -
              Number(down("W") || down("UP"));
            const speed = Math.min(delta, 40) * 0.19;
            if (dx || dy)
              this.target = clampPosition({
                x: this.person.x + dx * speed,
                y: this.person.y + dy * speed,
              });
            const next = advancePosition(this.person, this.target, speed);
            this.person.setPosition(next.x, next.y);
            // Keep avatars outside building footprints; labels and entrances remain reachable.
            for (const l of pack.locations) {
              if (
                l.id !== "commons" &&
                Math.abs(this.person.x - l.x) < 85 &&
                Math.abs(this.person.y - l.y) < 55
              ) {
                const side = this.person.y >= l.y ? 1 : -1;
                this.person.y = l.y + side * 56;
                this.target = { x: this.person.x, y: this.person.y };
              }
            }
            const close =
              pack.locations.find(
                (l) =>
                  Math.hypot(l.x - this.person.x, l.y - this.person.y) < 115,
              ) ?? null;
            if ((close?.id ?? "") !== this.nearest) {
              this.nearest = close?.id ?? "";
              nearbyCallback.current(close);
            }
          }
        }
        game = new Phaser.Game({
          type: Phaser.AUTO,
          parent: container.current,
          width: WORLD.width,
          height: WORLD.height,
          backgroundColor: "#dce7c7",
          scene: CampusScene,
          scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
          },
          render: { antialias: true },
          fps: { target: 30 },
          audio: { noAudio: true },
          callbacks: {
            postBoot: (g) => {
              g.canvas.setAttribute(
                "aria-label",
                "Fictional campus world. Tap to walk or use arrow keys.",
              );
              g.canvas.setAttribute("role", "img");
            },
          },
        });
      })
      .catch(() => setFailed(true));
    return () => {
      disposed = true;
      game?.destroy(true);
    };
  }, [pack, avatar]);
  if (failed)
    return (
      <div role="alert" className="world-loading">
        The world could not load. Refresh to try again.
      </div>
    );
  return (
    <div
      className="phaser-container"
      ref={container}
      data-testid="campus-world"
      data-ready={ready}
    >
      {!ready && (
        <span className="world-loading" role="status">
          Opening the campus gates…
        </span>
      )}
    </div>
  );
}
