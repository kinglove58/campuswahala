import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  // Visual capture is opt-in; functional/security assertions retain their own time budgets.
  timeout: 60000,
  fullyParallel: false,
  workers: 1,
  use: { trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    {
      command: "node apps/api/dist/main.js",
      env: {
        APP_ENV: "local",
        PLAYER_STORE: process.env.TEST_DATABASE_URL ? "postgres" : "memory",
        DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
        SESSION_SECRET: "local-only-playwright-account-session-secret-2026",
        AUTH_PROVIDER: process.env.TEST_DATABASE_URL ? "local" : "disabled",
      },
      url: "http://localhost:4000/health/live",
      reuseExistingServer: false,
    },
    {
      command: "node scripts/start-web.mjs marketing 3100",
      url: "http://localhost:3100",
      reuseExistingServer: false,
    },
    {
      command: "node scripts/start-web.mjs game 3001",
      url: "http://localhost:3001",
      reuseExistingServer: false,
    },
  ],
});
