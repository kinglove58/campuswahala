import {
  test,
  expect,
  chromium,
  type Locator,
  type Page,
} from "@playwright/test";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { dirname, basename, join } from "node:path";
import { execFileSync } from "node:child_process";
import { validGuestFixture } from "../../packages/testing/src";
import { createCampusWorld } from "../../packages/game-engine/src";

test.use({
  viewport: { width: 360, height: 800 },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  // Full-page CDP screencast adds expensive JPEG/IPC/encoder work to a timing
  // assertion. Record the actual mobile Phaser canvas directly instead.
  video: "off",
});
type Point = { x: number; y: number };
function captureFfmpeg() {
  let directory = dirname(chromium.executablePath());
  while (!/^chromium-\d+$/.test(basename(directory))) {
    const parent = dirname(directory);
    if (parent === directory)
      throw new Error("MISSING_PLAYWRIGHT_BROWSER_REGISTRY");
    directory = parent;
  }
  const registry = dirname(directory);
  const ffmpeg = readdirSync(registry).find((name) =>
    /^ffmpeg-\d+$/.test(name),
  );
  if (!ffmpeg) throw new Error("MISSING_PLAYWRIGHT_FFMPEG");
  const executable = ["ffmpeg-win64.exe", "ffmpeg-linux", "ffmpeg-mac"]
    .map((name) => join(registry, ffmpeg, name))
    .find((name) => existsSync(name));
  if (!executable) throw new Error("MISSING_PLAYWRIGHT_FFMPEG_EXECUTABLE");
  return executable;
}
const directions = [
  { facing: "right", key: "ArrowRight", x: 1, y: 0 },
  { facing: "left", key: "ArrowLeft", x: -1, y: 0 },
  { facing: "up", key: "ArrowUp", x: 0, y: -1 },
  { facing: "down", key: "ArrowDown", x: 0, y: 1 },
] as const;
async function position(world: Locator): Promise<Point> {
  return JSON.parse((await world.getAttribute("data-position"))!);
}
async function tapWorld(world: Locator, target: Point) {
  // Read-only renderer metrics convert a real touch to a world destination.
  // No scene/position/frame setter or test-only movement implementation.
  const view: Point = JSON.parse(
    (await world.getAttribute("data-camera-view"))!,
  );
  const zoom = Number(await world.getAttribute("data-camera-zoom"));
  await world.locator("canvas").tap({
    position: { x: (target.x - view.x) * zoom, y: (target.y - view.y) * zoom },
  });
}
async function sampleJourney(
  world: Locator,
  start: Point,
  target: Point,
  began: number,
  keyboard: boolean,
) {
  return world.evaluate(
    async (element, args) => {
      const data = (element as HTMLElement).dataset;
      const samples: {
        ms: number;
        position: Point;
        frame: string;
        path: Point[];
      }[] = [];
      let complete = false;
      while (performance.now() - args.began < 5000) {
        const point = JSON.parse(data.position!) as Point;
        const path = JSON.parse(data.navigationPath!) as Point[];
        samples.push({
          ms: performance.now() - args.began,
          position: point,
          frame: data.characterFrame!,
          path,
        });
        complete = args.keyboard
          ? Math.hypot(point.x - args.start.x, point.y - args.start.y) >= 96
          : !path.length &&
            Math.hypot(point.x - args.target.x, point.y - args.target.y) < 2;
        if (complete) break;
        await new Promise((resolve) => setTimeout(resolve, 25));
      }
      return {
        start: args.start,
        target: args.target,
        durationMs: performance.now() - args.began,
        complete,
        samples,
      };
    },
    { start, target, began, keyboard },
  );
}
async function startCanvasVideo(world: Locator) {
  if (
    process.env.CAPTURE_VISUALS !== "1" ||
    test.info().project.name !== "mobile"
  )
    return;
  await world.locator("canvas").evaluate((element) => {
    const canvas = element as HTMLCanvasElement & {
      evidence?: {
        recorder: MediaRecorder;
        chunks: Blob[];
        stream: MediaStream;
      };
    };
    const stream = canvas.captureStream(30);
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp8")
        ? "video/webm;codecs=vp8"
        : "video/webm",
      videoBitsPerSecond: 500000,
    });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunks.push(event.data);
    };
    canvas.evidence = { recorder, chunks, stream };
    recorder.start();
  });
}
async function saveEvidence(page: Page, kind: string, report: unknown) {
  if (process.env.CAPTURE_VISUALS !== "1") return;
  const out = "artifacts/m2-production";
  await mkdir(out, { recursive: true });
  const suffix = `${kind}-${test.info().project.name}-360x800`;
  const world = page.getByTestId("campus-world");
  const canvasPixels = await world.locator("canvas").evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    return { width: canvas.width, height: canvas.height };
  });
  if (test.info().project.name === "mobile") {
    const video = await world.locator("canvas").evaluate(async (element) => {
      const canvas = element as HTMLCanvasElement & {
        evidence?: {
          recorder: MediaRecorder;
          chunks: Blob[];
          stream: MediaStream;
        };
      };
      const recording = canvas.evidence;
      if (!recording) throw new Error("MISSING_PRODUCTION_CANVAS_RECORDING");
      await new Promise<void>((resolve) => {
        recording.recorder.onstop = () => resolve();
        recording.recorder.stop();
      });
      recording.stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(recording.chunks, { type: "video/webm" });
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]!);
        reader.onerror = () => reject(new Error("CANVAS_VIDEO_READ_FAILED"));
        reader.readAsDataURL(blob);
      });
    });
    const raw = `${out}/production-${suffix}.raw.webm`;
    const movie = `${out}/production-${suffix}.webm`;
    await writeFile(raw, Buffer.from(video, "base64"));
    // Finalize duration/seek metadata using Playwright's already-installed
    // FFmpeg. Stream copy preserves every actual canvas frame, without resizing.
    execFileSync(captureFfmpeg(), [
      "-y",
      "-i",
      raw,
      "-c",
      "copy",
      "-loglevel",
      "error",
      movie,
    ]);
    await unlink(raw);
  }
  await page.screenshot({ path: `${out}/production-${suffix}.png` });
  await writeFile(
    `${out}/production-${suffix}.json`,
    JSON.stringify(
      {
        checkoutCommit: execFileSync("git", ["rev-parse", "HEAD"], {
          encoding: "utf8",
        }).trim(),
        ciRun: process.env.GITHUB_RUN_ID ?? null,
        ciEvent: process.env.GITHUB_EVENT_NAME ?? "local",
        productionURL: "http://localhost:3001/play?campus=futa",
        threshold:
          "96 unobstructed world units within 5000ms; ordinary 22 units/s; direction duration spread <=20%",
        input:
          "Real guest API, production Phaser, actual keyboard/touch; renderer metrics read only",
        physicalAndroid: "not tested",
        video:
          test.info().project.name === "mobile"
            ? {
                method:
                  "Actual Phaser canvas.captureStream(30), no scene/frame injection or full-page screencast",
                canvasPixels,
                viewport: { width: 360, height: 800 },
              }
            : "Functional timing/still/trajectory evidence; mobile project records the real canvas",
        report,
      },
      null,
      2,
    ),
  );
}
for (const input of ["keyboard", "touch"] as const) {
  test(`M2 native mobile ${input}: four comparable 96-unit production walks within five seconds`, async ({
    page,
    context,
  }) => {
    const errors: string[] = [],
      mutations: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const guest = await context.request.post(
      "http://localhost:3001/api/guest",
      {
        headers: { Origin: "http://localhost:3001" },
        data: validGuestFixture,
      },
    );
    expect(guest.ok()).toBe(true);
    await page.goto("http://localhost:3001/play?campus=futa");
    const world = page.getByTestId("campus-world"),
      canvas = world.locator("canvas");
    await expect(world).toHaveAttribute("data-character-ready", "true");
    await expect
      .poll(async () =>
        Number(await world.getAttribute("data-character-pending")),
      )
      .toBe(0);
    page.on("request", (r) => {
      if (
        r.method() === "POST" &&
        /\/api\/(academic|life|account)/.test(r.url())
      )
        mutations.push(r.url());
    });
    const journeys = [];
    await startCanvasVideo(world);
    for (const direction of directions) {
      await expect(world).toHaveAttribute("data-character-frame", /-idle-/);
      await page.waitForTimeout(350); // Let the real follow camera settle before a touch.
      const start = await position(world);
      const target = {
        x: start.x + direction.x * 96,
        y: start.y + direction.y * 96,
      };
      await expect(world).toHaveAttribute("data-navigation-speed", "22");
      await canvas.focus();
      // Start at the actual DOM input event, excluding driver/IPC preparation.
      await canvas.evaluate(
        (element, event) => {
          // Observer only: this timestamp never drives scene/engine behaviour.
          (element as HTMLElement).dataset.observedInputTime = "";
          window.addEventListener(
            event,
            (e) => {
              (element as HTMLElement).dataset.observedInputTime = String(
                e.timeStamp,
              );
            },
            { once: true, capture: true },
          );
        },
        input === "keyboard" ? "keydown" : "pointerdown",
      );
      if (input === "keyboard") await page.keyboard.down(direction.key);
      else await tapWorld(world, target);
      const began = Number(
        await canvas.getAttribute("data-observed-input-time"),
      );
      expect(began).toBeGreaterThan(0);
      const journey = await sampleJourney(
        world,
        start,
        target,
        began,
        input === "keyboard",
      );
      if (input === "keyboard") await page.keyboard.up(direction.key);
      expect(
        journey.complete,
        JSON.stringify({
          facing: direction.facing,
          durationMs: journey.durationMs,
          start,
          target,
          last: journey.samples.at(-1),
        }),
      ).toBe(true);
      expect(journey.durationMs).toBeLessThanOrEqual(5000);
      expect(journey.durationMs).toBeGreaterThan(3500);
      const last = journey.samples.at(-1)!.position;
      const across = direction.x
        ? Math.abs(last.y - start.y)
        : Math.abs(last.x - start.x);
      expect(across).toBeLessThan(2);
      const phases = new Set(
        journey.samples
          .filter((s) => s.frame.startsWith(`${direction.facing}-walk-`))
          .map((s) => Number(s.frame.split("-").at(-1))),
      );
      expect([...phases].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
      await expect(world).toHaveAttribute("data-fast-route", "false");
      await expect(world).toHaveAttribute(
        "data-character-frame",
        new RegExp(`^${direction.facing}-idle-`),
      );
      journeys.push({ facing: direction.facing, ...journey });
    }
    const durations = journeys.map((j) => j.durationMs);
    expect(Math.max(...durations) / Math.min(...durations)).toBeLessThanOrEqual(
      1.2,
    );
    expect(errors).toEqual([]);
    expect(mutations).toEqual([]);
    expect(
      Number(await world.getAttribute("data-character-peak-textures")),
    ).toBeLessThanOrEqual(6);
    await saveEvidence(page, `${input}-pace`, {
      journeys,
      errors,
      authorityMutations: mutations,
    });
  });
}

test("M2 mobile interrupted touch walk, reduced-motion displacement and Pocket pause", async ({
  page,
  context,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const guest = await context.request.post("http://localhost:3001/api/guest", {
    headers: { Origin: "http://localhost:3001" },
    data: validGuestFixture,
  });
  expect(guest.ok()).toBe(true);
  await page.goto("http://localhost:3001/play?campus=futa");
  const world = page.getByTestId("campus-world"),
    canvas = world.locator("canvas");
  await expect(world).toHaveAttribute("data-character-ready", "true");
  await page.waitForTimeout(350);
  const start = await position(world);
  await tapWorld(world, { x: start.x + 96, y: start.y });
  await expect(world).toHaveAttribute("data-character-frame", "right-walk-0");
  await canvas.focus();
  await page.keyboard.down("ArrowUp");
  await expect(world).toHaveAttribute("data-navigation-path", "[]");
  await expect(world).toHaveAttribute("data-character-frame", "up-walk-0");
  const { before, after, elapsed } = await world.evaluate(async (element) => {
    const data = (element as HTMLElement).dataset;
    const before = JSON.parse(data.position!) as Point;
    const began = Number(data.motionTime);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const after = JSON.parse(data.position!) as Point;
    return { before, after, elapsed: Number(data.motionTime) - began };
  });
  await page.keyboard.up("ArrowUp");
  expect(before.y - after.y).toBeGreaterThan(3);
  expect(before.y - after.y).toBeCloseTo((22 * elapsed) / 1000, 5);
  expect(Math.abs(after.x - before.x)).toBeLessThan(1);
  await expect(world).toHaveAttribute("data-character-frame", "up-idle-0");
  await tapWorld(world, { x: after.x + 96, y: after.y });
  await expect(world).toHaveAttribute("data-character-frame", "right-walk-0");
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  const paused = await world.getAttribute("data-position");
  const zoom = await world.getAttribute("data-camera-zoom");
  await page.keyboard.down("ArrowDown");
  await page.waitForTimeout(500);
  await page.keyboard.up("ArrowDown");
  expect(await world.getAttribute("data-position")).toBe(paused);
  await page.keyboard.press("Escape");
  expect(await world.getAttribute("data-position")).toBe(paused);
  expect(await world.getAttribute("data-camera-zoom")).toBe(zoom);
  await expect(world).toHaveAttribute("data-navigation-path", "[]");
});

test("M2 mobile ordinary walking stops at the existing production building collider", async ({
  page,
  context,
}) => {
  const guest = await context.request.post("http://localhost:3001/api/guest", {
    headers: { Origin: "http://localhost:3001" },
    data: validGuestFixture,
  });
  expect(guest.ok()).toBe(true);
  await page.goto("http://localhost:3001/play?campus=futa");
  const world = page.getByTestId("campus-world"),
    canvas = world.locator("canvas");
  await expect(world).toHaveAttribute("data-character-ready", "true");
  await page.waitForTimeout(350);
  const building = createCampusWorld("futa").buildings[0]!;
  const approach = {
    x: building.x + building.width - 32,
    y: building.y + building.height + 64,
  };
  await tapWorld(world, approach);
  await expect
    .poll(
      async () => {
        const p = await position(world);
        return Math.hypot(p.x - approach.x, p.y - approach.y);
      },
      { timeout: 15000 },
    )
    .toBeLessThan(2);
  await expect(world).toHaveAttribute("data-navigation-path", "[]");
  await canvas.focus();
  await page.keyboard.down("ArrowUp");
  await expect(world).toHaveAttribute("data-character-frame", /^up-walk-/);
  // Held input must reach the existing wall and then idle, rather than clipping.
  await expect(world).toHaveAttribute("data-character-frame", /^up-idle-/, {
    timeout: 5000,
  });
  const stopped = await position(world);
  expect(stopped.y).toBeGreaterThanOrEqual(building.y + building.height + 12);
  expect(stopped.y).toBeLessThan(building.y + building.height + 14);
  await page.waitForTimeout(500);
  expect(await position(world)).toEqual(stopped);
  await page.keyboard.up("ArrowUp");
  await page.keyboard.down("ArrowDown");
  await expect(world).toHaveAttribute("data-character-frame", /^down-walk-/);
  await expect
    .poll(async () => (await position(world)).y - stopped.y)
    .toBeGreaterThan(3);
  await page.keyboard.up("ArrowDown");
});
