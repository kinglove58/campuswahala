import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
/* global AbortSignal */
assert.notEqual(process.getuid(), 0);
assert.equal(existsSync("/usr/local/lib/node_modules/npm"), false);
const server = spawn(process.execPath, ["apps/marketing/server.js"], {
  stdio: "inherit",
  env: {
    ...process.env,
    APP_ENV: "local",
    HOSTNAME: "127.0.0.1",
    PORT: "3000",
  },
});
try {
  let ready = false;
  for (let i = 0; i < 40; i++) {
    try {
      const response = await fetch("http://127.0.0.1:3000", {
        signal: AbortSignal.timeout(1000),
      });
      if (
        response.status === 200 &&
        (await response.text()).includes("CampusWahala")
      ) {
        ready = true;
        break;
      }
    } catch {
      /* Wait only for this owned server. */
    }
    await setTimeout(250);
  }
  assert(
    ready,
    "Marketing must serve HTTP 200 from the isolated non-root image",
  );
  console.log("Non-root web: HTTP 200, no npm runtime.");
} finally {
  server.kill("SIGTERM");
}
