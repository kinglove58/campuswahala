import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  // The full journey also captures three visual artifacts on slower developer PCs.
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
      url: "http://localhost:4000/health/live",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node scripts/start-web.mjs marketing 3000",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "node scripts/start-web.mjs game 3001",
      url: "http://localhost:3001",
      reuseExistingServer: !process.env.CI,
    },
  ],
});
