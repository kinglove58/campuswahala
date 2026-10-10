import { it, expect } from "vitest";
import { createApi } from "../apps/api/src/app";
import { readConfig } from "../packages/config/src";
it("world endpoints are allowlisted, cache geometry only and reject guest durable state", async () => {
  const { app, accounts } = await createApi(
    readConfig({ APP_ENV: "local", PLAYER_STORE: "memory" }),
  );
  await app.listen(0, "127.0.0.1");
  const url = await app.getUrl();
  try {
    const r = await fetch(`${url}/v1/worlds/futa/versions/1`);
    expect(r.status).toBe(200);
    expect(r.headers.get("cache-control")).toContain("immutable");
    const w = await r.json();
    expect(w.campusId).toBe("futa");
    expect(JSON.stringify(w)).not.toContain("tokenHash");
    expect((await fetch(`${url}/v1/worlds/nope/versions/1`)).status).toBe(404);
    expect((await fetch(`${url}/v1/worlds/futa/versions/999`)).status).toBe(
      404,
    );
    const state = await fetch(`${url}/v1/account/world`, {
      method: "POST",
      headers: {
        Origin: "http://localhost:3001",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        campusId: "futa",
        spawnId: "spawn-arrival",
        worldVersion: 1,
      }),
    });
    expect(state.status).toBe(401);
    expect(state.headers.get("cache-control")).toBe("no-store");
    const info = await fetch(`${url}/v1/worlds/futa/information`);
    expect(info.headers.get("cache-control")).toBe("no-store");
    expect(
      (await info.json()).venues.every(
        (v: { verification: string }) => v.verification === "fictional",
      ),
    ).toBe(true);
  } finally {
    await app.close();
    await accounts.close();
  }
});
