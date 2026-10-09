import { readdirSync } from "node:fs";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
if (process.getuid() === 0) throw new Error("RUNTIME_MUST_BE_NONROOT");
const tools = readdirSync("/app/node_modules/.pnpm").filter(
  (name) => name.startsWith("typescript@") || name.startsWith("prisma@"),
);
if (tools.length) throw new Error("BUILD_TOOLS_PRESENT_IN_RUNTIME");
const server = spawn(process.execPath, ["dist/main.js"], { stdio: "ignore" });
try {
  const deadline = Date.now() + 40000;
  let ready = false;
  while (Date.now() < deadline) {
    try {
      ready = (await fetch("http://127.0.0.1:4000/health/ready")).ok;
    } catch {
      /* Wait for startup. */
    }
    if (ready) break;
    await delay(300);
  }
  if (!ready) throw new Error("API_NOT_READY");
  const created = await fetch("http://127.0.0.1:4000/v1/guests", {
    method: "POST",
    headers: {
      Origin: "http://localhost:3001",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      campusId: "futa",
      programmeId: "computing-demo",
      level: 200,
      durationYears: 4,
      nickname: "Campus Explorer",
      avatar: "lime",
    }),
  });
  if (created.status !== 201) throw new Error("GUEST_CREATION_FAILED");
  const { player, token } = await created.json();
  const response = await fetch("http://127.0.0.1:4000/v1/guests/me", {
    headers: { "X-Guest-Token": token },
  });
  if (!response.ok || (await response.json()).id !== player.id)
    throw new Error("GUEST_READ_FAILED");
  console.log(
    "Non-root API: ready, guest roundtrip passed, no compiler or Prisma CLI in runtime.",
  );
} finally {
  server.kill();
}
