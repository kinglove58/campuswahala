import { test, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { validGuestFixture } from "../../packages/testing/src";
import { characterAssets } from "../../apps/game/app/character-assets";

test("M2 actual cold-network transfer: composed default and saved approved look", async ({
  browser,
}, info) => {
  test.skip(
    info.project.name !== "desktop" || process.env.CAPTURE_VISUALS !== "1",
    "One cold-network measurement; normal PWA coverage runs separately on both projects.",
  );
  const context = await browser.newContext({
    viewport: { width: 360, height: 800 },
    deviceScaleFactor: 1,
    serviceWorkers: "block",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  let bytes = 0;
  cdp.on("Network.loadingFinished", (event) => {
    bytes += event.encodedDataLength;
  });
  try {
    expect(
      (
        await context.request.post("http://localhost:3001/api/guest", {
          headers: { Origin: "http://localhost:3001" },
          data: validGuestFixture,
        })
      ).ok(),
    ).toBe(true);
    await page.goto("http://localhost:3001/play?campus=futa");
    const world = page.getByTestId("campus-world");
    await expect(world).toHaveAttribute("data-character-ready", "true", {
      timeout: 15000,
    });
    await expect
      .poll(
        async () => Number(await world.getAttribute("data-character-pending")),
        { timeout: 15000 },
      )
      .toBe(0);
    const composed = {
      bytes,
      textures: Number(await world.getAttribute("data-character-textures")),
    };
    // Save through the existing UI, then reload with HTTP cache still disabled.
    await page.getByRole("button", { name: "Open virtual phone" }).click();
    await page.getByRole("button", { name: "My chapter", exact: true }).click();
    const look = characterAssets[0].appearance;
    await page
      .getByRole("combobox", { name: "Shoes", exact: true })
      .selectOption(look.shoes);
    await page
      .getByRole("button", { name: "Keep this look", exact: true })
      .click();
    await page.keyboard.press("Escape");
    await expect(world).toHaveAttribute("data-appearance", /white-backpack$/);
    bytes = 0;
    await page.reload();
    await expect(world).toHaveAttribute("data-appearance", /white-backpack$/, {
      timeout: 15000,
    });
    await expect
      .poll(
        async () => Number(await world.getAttribute("data-character-pending")),
        { timeout: 15000 },
      )
      .toBe(0);
    const saved = {
      bytes,
      textures: Number(await world.getAttribute("data-character-textures")),
      nominalPngBytes: Number(
        await world.getAttribute("data-character-transfer-bytes"),
      ),
    };
    expect(saved.nominalPngBytes).toBe(characterAssets[0].bytes);
    // Existing 1.5 MiB first-campus envelope; optional later look changes are not first boot.
    expect(composed.bytes).toBeLessThan(1.5 * 1024 * 1024);
    expect(saved.bytes).toBeLessThan(1.5 * 1024 * 1024);
    await mkdir("artifacts/m2-production", { recursive: true });
    await writeFile(
      "artifacts/m2-production/cold-network.json",
      JSON.stringify(
        {
          checkoutCommit: execFileSync("git", ["rev-parse", "HEAD"], {
            encoding: "utf8",
          }).trim(),
          source:
            "Actual production game; normal guest/save UI; CDP network cache disabled and service workers blocked in this measurement context only. No APIRequest setup bytes. Normal PWA/low-bandwidth/offline/reconnect tests remain enabled.",
          viewport: "360x800 DPR1",
          composed,
          saved,
        },
        null,
        2,
      ),
    );
  } finally {
    await context.close();
  }
});
