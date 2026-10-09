import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApi } from "../apps/api/src/app";
import { readConfig } from "../packages/config/src";
import { validGuestFixture } from "../packages/testing/src";
import { MemoryPlayerRepository, PlayerService } from "../apps/api/src/players";
import { hashGuestToken, issueGuestToken } from "../packages/auth/src";
describe("API contracts and guest authorization", () => {
  let instance: Awaited<ReturnType<typeof createApi>>;
  let base: string;
  const headers = {
    "Content-Type": "application/json",
    Origin: "http://localhost:3001",
  };
  beforeAll(async () => {
    instance = await createApi(readConfig({}));
    await instance.app.listen(0, "127.0.0.1");
    base = await instance.app.getUrl();
  });
  afterAll(async () => {
    await instance.app.close();
    await instance.repository.close();
  });
  it("serves liveness/readiness and validated packs", async () => {
    expect((await fetch(`${base}/health/live`)).status).toBe(200);
    expect((await fetch(`${base}/health/ready`)).status).toBe(200);
    expect(
      (await (await fetch(`${base}/v1/campuses`)).json()).campuses,
    ).toHaveLength(3);
  });
  it("creates, resumes only with capability, and revokes", async () => {
    const r = await fetch(`${base}/v1/guests`, {
      method: "POST",
      headers,
      body: JSON.stringify(validGuestFixture),
    });
    expect(r.status).toBe(201);
    const { player, token } = await r.json();
    expect(player.campusId).toBe("futa");
    expect(player.tokenHash).toBeUndefined();
    expect((await fetch(`${base}/v1/guests/me`)).status).toBe(401);
    expect(
      (
        await fetch(`${base}/v1/guests/${player.id}`, {
          headers: { "X-Guest-Token": token },
        })
      ).status,
    ).toBe(404);
    const self = await fetch(`${base}/v1/guests/me`, {
      headers: { "X-Guest-Token": token },
    });
    expect(self.status).toBe(200);
    expect((await self.json()).id).toBe(player.id);
    const second = await (
      await fetch(`${base}/v1/guests`, {
        method: "POST",
        headers,
        body: JSON.stringify({ ...validGuestFixture, avatar: "blue" }),
      })
    ).json();
    const other = await (
      await fetch(`${base}/v1/guests/me`, {
        headers: { "X-Guest-Token": second.token },
      })
    ).json();
    expect(other.id).toBe(second.player.id);
    expect(other.id).not.toBe(player.id);
    await fetch(`${base}/v1/guests/me`, {
      method: "DELETE",
      headers: { ...headers, "X-Guest-Token": token },
    });
    expect(
      (
        await fetch(`${base}/v1/guests/me`, {
          headers: { "X-Guest-Token": token },
        })
      ).status,
    ).toBe(401);
  });
  it("rejects CSRF, malformed JSON, wrong media and large body", async () => {
    expect(
      (
        await fetch(`${base}/v1/guests`, {
          method: "POST",
          headers: { ...headers, Origin: "https://evil.test" },
          body: "{}",
        })
      ).status,
    ).toBe(403);
    expect(
      (await fetch(`${base}/v1/guests`, { method: "POST", headers, body: "{" }))
        .status,
    ).toBe(400);
    expect(
      (
        await fetch(`${base}/v1/guests`, {
          method: "POST",
          headers: { Origin: headers.Origin, "Content-Type": "text/plain" },
          body: "{}",
        })
      ).status,
    ).toBe(415);
    expect(
      (
        await fetch(`${base}/v1/guests`, {
          method: "POST",
          headers,
          body: JSON.stringify({ value: "x".repeat(9000) }),
        })
      ).status,
    ).toBe(413);
  });
  it.each([
    { roles: ["admin"] },
    { programmeId: "foreign-programme" },
    { campusId: "unknown" },
    { money: -100 },
    { level: 1e10 },
  ])("rejects tampering %j", async (change) => {
    const r = await fetch(`${base}/v1/guests`, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...validGuestFixture, ...change }),
    });
    expect(r.status).toBe(400);
    const data = await r.json();
    expect(data.error.requestId).toBeTruthy();
    expect(JSON.stringify(data)).not.toContain("stack");
  });
  it("denies non-existent privileged endpoints", async () =>
    expect((await fetch(`${base}/admin/users`)).status).toBe(404));
});
describe("bounded memory adapter", () => {
  it("expires sessions server-side even if a capability remains on the client", async () => {
    const repo = new MemoryPlayerRepository();
    const token = issueGuestToken();
    await repo.create({
      tokenHash: hashGuestToken(token, "test-key"),
      player: {
        ...validGuestFixture,
        id: "expired",
        createdAt: new Date(0).toISOString(),
        expiresAt: new Date(1).toISOString(),
      },
    });
    const service = new PlayerService(repo, "test-key");
    await expect(service.self(token)).rejects.toThrow("GUEST_SESSION_EXPIRED");
    expect(
      await repo.findByTokenHash(hashGuestToken(token, "test-key")),
    ).toBeNull();
  });
  it("purges expired guests and enforces capacity", async () => {
    let now = Date.now();
    const repo = new MemoryPlayerRepository(() => now, 1);
    const row = {
      player: {
        ...validGuestFixture,
        id: "id",
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + 1000).toISOString(),
      },
      tokenHash: "first",
    };
    await repo.create(row);
    await expect(repo.create({ ...row, tokenHash: "second" })).rejects.toThrow(
      "GUEST_CAPACITY_REACHED",
    );
    now += 2000;
    await repo.create({ ...row, tokenHash: "second" });
    expect(await repo.findByTokenHash("first")).toBeNull();
    await repo.close();
  });
});

it("limits repeated guest creation independently of read requests", async () => {
  const instance = await createApi(readConfig({}));
  try {
    await instance.app.listen(0, "127.0.0.1");
    const base = await instance.app.getUrl();
    for (let i = 0; i < 10; i++) {
      const response = await fetch(`${base}/v1/guests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "http://localhost:3001",
        },
        body: "{}",
      });
      expect(response.status).toBe(400);
    }
    const denied = await fetch(`${base}/v1/guests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "http://localhost:3001",
      },
      body: "{}",
    });
    expect(denied.status).toBe(429);
    expect((await denied.json()).error.code).toBe("RATE_LIMITED");
    expect((await fetch(`${base}/health/live`)).status).toBe(200);
  } finally {
    await instance.app.close();
    await instance.repository.close();
  }
});
