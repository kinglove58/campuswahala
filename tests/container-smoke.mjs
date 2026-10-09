import { readdirSync, existsSync } from "node:fs";
import assert from "node:assert/strict";
import { URL } from "node:url";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
if (process.getuid() === 0) throw new Error("RUNTIME_MUST_BE_NONROOT");
assert.equal(existsSync("/usr/local/lib/node_modules/npm"), false);
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
  if (
    process.env.PLAYER_STORE === "postgres" &&
    process.env.AUTH_PROVIDER === "local"
  ) {
    const origin = "http://127.0.0.1:4000";
    const headers = {
      Origin: "http://localhost:3001",
      "Content-Type": "application/json",
    };
    const begin = await fetch(`${origin}/v1/account/begin`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ageBand: "under_18" }),
    });
    assert.equal(begin.status, 201);
    const authorization = new URL((await begin.json()).authorizationUrl);
    const callback = await fetch(`${origin}/v1/account/callback`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        state: authorization.searchParams.get("state"),
        code: authorization.searchParams.get("code"),
      }),
    });
    assert.equal(callback.status, 201);
    const session = (await callback.json()).token;
    const accountHeaders = { ...headers, "X-Account-Token": session };
    const existing = await (
      await fetch(`${origin}/v1/account/me`, { headers: accountHeaders })
    ).json();
    const conversion = await fetch(`${origin}/v1/account/convert`, {
      method: "POST",
      headers: { ...accountHeaders, "X-Guest-Token": token },
      body: "{}",
    });
    assert.equal(conversion.status, 201);
    const character = (await conversion.json()).character;
    assert.match(character.position.stageId, /^[a-f0-9-]{36}$/);
    if (existing.character) assert.equal(character.id, existing.character.id);
    else assert.equal(character.level, 200);
    const saved = await (
      await fetch(`${origin}/v1/account/me`, { headers: accountHeaders })
    ).json();
    assert.equal(saved.privacy.visibility, "private");
    assert.equal(saved.privacy.discoverable, false);
    assert.equal(saved.privacy.analyticsConsent, false);
    assert.equal(
      (
        await fetch(`${origin}/v1/guests/me`, {
          headers: { "X-Guest-Token": token },
        })
      ).status,
      401,
    );
    assert.equal(
      (
        await fetch(`${origin}/v1/account/me`, {
          method: "DELETE",
          headers: accountHeaders,
        })
      ).status,
      200,
    );
    assert.equal(
      (await fetch(`${origin}/v1/account/me`, { headers: accountHeaders }))
        .status,
      401,
    );
    console.log(
      "PostgreSQL private account: conversion, privacy and immediate deletion revocation passed.",
    );
  }
  console.log(
    "Non-root API: ready, guest roundtrip passed, no compiler or Prisma CLI in runtime.",
  );
} finally {
  server.kill();
}
