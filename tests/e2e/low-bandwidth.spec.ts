import { writeFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";
import { validGuestFixture } from "../../packages/testing/src";
test("360x800 constrained CPU/network, offline exploration, safe private writes and reconnect", async ({
  page,
  context,
}, info) => {
  const requested = Number(process.env.CW_SOAK_MS ?? "60000");
  const soakMs = Number.isFinite(requested)
    ? Math.min(300000, Math.max(15000, requested))
    : 60000;
  test.setTimeout(180000 + soakMs);
  await page.setViewportSize({ width: 360, height: 800 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 180,
    downloadThroughput: 500000,
    uploadThroughput: 125000,
    connectionType: "cellular4g",
  });
  let bytes = 0;
  cdp.on("Network.loadingFinished", (e) => {
    bytes += e.encodedDataLength;
  });
  expect(
    (
      await context.request.post("http://localhost:3001/api/guest", {
        headers: { Origin: "http://localhost:3001" },
        data: validGuestFixture,
      })
    ).ok(),
  ).toBe(true);
  const start = Date.now();
  await page.goto("http://localhost:3001/play");
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 90000 },
  );
  const boot = Date.now() - start;
  const firstBootBytes = bytes;
  const manifestTiming = await page.evaluate(() =>
    performance
      .getEntriesByType("resource")
      .filter((entry) => entry.name.includes("/api/world/futa/latest"))
      .map((entry) => ({ durationMs: entry.duration })),
  );

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 60000 },
  );
  await context.setOffline(true);
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Campus map", exact: true }).click();
  await expect(
    page.getByRole("img", { name: "Virtual campus map" }),
  ).toBeVisible();
  const denied = await page.evaluate(async () => {
    try {
      await fetch("/api/account/world", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      return false;
    } catch {
      return true;
    }
  });
  expect(denied).toBe(true);
  const cached = await page.evaluate(async () => {
    const results: string[] = [];
    for (const key of await caches.keys())
      for (const req of await (await caches.open(key)).keys())
        results.push(new URL(req.url).pathname);
    return results;
  });
  expect(
    cached.some((p) => /^\/api\/(account|guest|feedback|guide)/.test(p)),
  ).toBe(false);
  expect(
    cached.some((p) => p.endsWith("/latest") || p.endsWith("/information")),
  ).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "The network has stepped out." }),
  ).toBeVisible();
  await context.setOffline(false);
  await page.goto("http://localhost:3001/play");
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 60000 },
  );
  // Bounded movement soak with actual renderer updates; physical 20-minute acceptance remains separate.
  for (let elapsed = 0; elapsed < soakMs; elapsed += 10000) {
    const key = elapsed % 20000 ? "ArrowLeft" : "ArrowRight";
    await page.keyboard.down(key);
    await page.waitForTimeout(Math.min(10000, soakMs - elapsed));
    await page.keyboard.up(key);
  }
  const diagnostics = await page.getByTestId("campus-world").evaluate((el) => ({
    frameMs: el.getAttribute("data-average-frame-ms"),
    heapWarning: el.getAttribute("data-memory-warning"),
    failures: el.getAttribute("data-asset-failures"),
  }));
  const measurement = {
    viewport: "360x800",
    cpuSlowdown: 4,
    latencyMs: 180,
    downloadBytesPerSecond: 500000,
    bootMs: boot,
    firstBootBytes,
    sessionTransferredBytes: bytes,
    manifestTiming,
    diagnostics,
    soakMs,
    note: "Chromium emulation, not a physical device benchmark; encoded network bytes cover this page, excluding APIRequest fixture setup.",
  };
  const measurementPath = info.outputPath("constrained-network.json");
  await writeFile(measurementPath, JSON.stringify(measurement, null, 2));
  await info.attach("constrained-network-measurement", {
    path: measurementPath,
    contentType: "application/json",
  });
});
test("manifest failure offers retry and optional art failure keeps world usable", async ({
  page,
  context,
}) => {
  test.setTimeout(90000);
  await context.request.post("http://localhost:3001/api/guest", {
    headers: { Origin: "http://localhost:3001" },
    data: validGuestFixture,
  });
  await page.route("**/api/world/futa/latest", (r) =>
    r.fulfill({ status: 503, contentType: "application/json", body: "{}" }),
  );
  await page.goto("http://localhost:3001/play");
  await expect(
    page.getByText("Campus gates are temporarily closed. Please retry."),
  ).toBeVisible();
  await page.unroute("**/api/world/futa/latest");
  await page.route("**/world-assets/**", (r) => r.abort());
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await expect(
    page.getByRole("dialog", { name: "CW Pocket virtual phone" }),
  ).toBeVisible();
});
