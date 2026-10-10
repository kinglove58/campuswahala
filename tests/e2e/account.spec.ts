import { test, expect } from "@playwright/test";
import { validGuestFixture } from "../../packages/testing/src";
test.skip(
  !process.env.TEST_DATABASE_URL,
  "Durable account flow requires the disposable PostgreSQL test database.",
);
test("save guest → browser-bound sign-in → durable same world → private account → revoke", async ({
  page,
  context,
  playwright,
}) => {
  test.setTimeout(120000);
  const response = await context.request.post(
    "http://localhost:3001/api/guest",
    {
      headers: { Origin: "http://localhost:3001" },
      data: { ...validGuestFixture, avatar: "blue", level: 400 },
    },
  );
  expect(response.ok()).toBe(true);
  await page.goto("http://localhost:3001");
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 15000 },
  );
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "Account & privacy" }).click();
  await expect(
    page.getByRole("heading", { name: "Save your journey" }),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "Age band" })
    .selectOption("under_18");
  const savedRedirect = page.waitForURL(
    (url) => url.searchParams.get("saved") === "1",
  );
  await page.getByRole("button", { name: "Continue to sign in" }).click();
  await savedRedirect;
  await expect(
    page.getByRole("button", { name: "Account", exact: true }),
  ).toBeVisible();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
    { timeout: 15000 },
  );
  const cookies = await context.cookies();
  expect(cookies.find((c) => c.name === "cw_session")?.httpOnly).toBe(true);
  expect(cookies.find((c) => c.name === "cw_guest")).toBeUndefined();
  expect(await page.evaluate(() => Object.keys(localStorage))).not.toContain(
    "cw_session",
  );
  const account = await (
    await context.request.get("http://localhost:3001/api/account/me")
  ).json();
  expect(account.character).toMatchObject({
    avatar: "blue",
    level: 400,
    campusId: validGuestFixture.campusId,
  });
  expect(account.privacy).toMatchObject({
    visibility: "private",
    discoverable: false,
    analyticsConsent: false,
  });
  const other = await playwright.request.newContext();
  try {
    expect(
      (await other.get("http://localhost:3001/api/account/me")).status(),
    ).toBe(401);
    const begin = await context.request.post(
      "http://localhost:3001/api/account/begin",
      {
        headers: { Origin: "http://localhost:3001" },
        data: { ageBand: "unknown" },
      },
    );
    const { authorizationUrl } = await begin.json();
    expect((await other.get(authorizationUrl)).status()).toBe(401);
  } finally {
    await other.dispose();
  }
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "My chapter", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Skin", exact: true })
    .selectOption("deep");
  await page
    .getByRole("button", { name: "Save appearance", exact: true })
    .click();
  await expect(page.getByText("Safe return point saved.")).toBeVisible();
  const worldResponse = await context.request.get(
    "http://localhost:3001/api/account/world",
  );
  expect(worldResponse.headers()["cache-control"]).toContain("no-store");
  const worldState = await worldResponse.json();
  expect(worldState.appearance.skin).toBe("deep");
  const safeReturn = await context.request.post(
    "http://localhost:3001/api/account/world",
    {
      headers: { Origin: "http://localhost:3001" },
      data: {
        campusId: worldState.campusId,
        worldVersion: worldState.worldVersion,
        spawnId: "spawn-venue-1",
        appearance: worldState.appearance,
      },
    },
  );
  expect(safeReturn.ok()).toBe(true);
  await page.reload();
  await expect(page.getByTestId("campus-world")).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(
    (
      await (
        await context.request.get("http://localhost:3001/api/account/world")
      ).json()
    ).spawnId,
  ).toBe("spawn-venue-1");
  await page.getByRole("button", { name: "Open virtual phone" }).click();
  await page.getByRole("button", { name: "My chapter", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Skin", exact: true }),
  ).toHaveValue("deep");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Account", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Account", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your private account" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Which campus?" }),
  ).toBeVisible();
  expect(
    (
      await context.request.get("http://localhost:3001/api/account/me")
    ).status(),
  ).toBe(401);
});
