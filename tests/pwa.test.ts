import { it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
it("cache allowlist excludes all private reads, writes, facts, pointers and arbitrary external assets", () => {
  const listeners: Record<
    string,
    (e: {
      request: { url: string; method: string; mode: string };
      respondWith: () => void;
    }) => void
  > = {};
  const sw = readFileSync("apps/game/public/sw.js", "utf8");
  const context = {
    self: {
      location: { origin: "https://game.example" },
      addEventListener: (name: string, fn: (typeof listeners)[string]) => {
        listeners[name] = fn;
      },
    },
    URL,
  };
  runInNewContext(sw, context);
  const allowed = (path: string) =>
    runInNewContext(
      `allowed(new URL(${JSON.stringify(path)}, "https://game.example"))`,
      context,
    );
  for (const path of [
    "/api/academic/state",
    "/api/academic/commands",
    "/api/account/me",
    "/api/account/world",
    "/api/account/session",
    "/api/guest",
    "/api/feedback",
    "/api/guide",
    "/api/world/futa/information",
    "/api/world/futa/latest",
    "/api/world/futa/versions/2?user=x",
    "https://outside.example/world-assets/tree.abcdef123456.svg",
    "/play?campus=futa",
  ])
    expect(allowed(path)).toBe(false);
  for (const path of [
    "/api/world/futa/versions/2",
    "/world-assets/zones/futa-zone-0.abcdef123456.svg",
    "/_next/static/chunks/123abc.js",
    "/offline.html",
  ])
    expect(allowed(path)).toBe(true);
  let intercepted = false;
  listeners.fetch!({
    request: {
      url: "https://game.example/api/account/world",
      method: "POST",
      mode: "cors",
    },
    respondWith: () => {
      intercepted = true;
    },
  });
  expect(intercepted).toBe(false);
  expect(sw).not.toMatch(/addEventListener\("sync"|indexedDB|localStorage/);
});
