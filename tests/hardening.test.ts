import { describe, expect, it } from "vitest";
import { createGuestSchema } from "../packages/domain/src";
import {
  campuses,
  metadataSchema,
  packSchema,
  previewPackSchema,
  programmeSchema,
  validAcademicPosition,
} from "../packages/campus-content/src";
import {
  ReplayGuard,
  localTrustKey,
  pseudonym,
  readClientCookie,
  signedClientCookie,
  signContext,
  verifyContext,
} from "../packages/security/src";
import { validGuestFixture } from "../packages/testing/src";
import { MemoryPlayerRepository } from "../apps/api/src/players";
import { cleanupGuests } from "../apps/worker/src/cleanup";
import { createApi } from "../apps/api/src/app";
import { readConfig } from "../packages/config/src";

describe("explicit academic positions", () => {
  it("does not infer stage validity from duration", () => {
    const input = {
      ...validGuestFixture,
      programmeId: "engineering-demo",
      level: 600,
      durationYears: 4,
    };
    expect(createGuestSchema.safeParse(input).success).toBe(true);
    expect(validAcademicPosition(input)).toBe(true);
    expect(validAcademicPosition({ ...input, level: 700 })).toBe(false);
    expect(
      validAcademicPosition({
        ...input,
        programmeId: "computing-demo",
        level: 500,
      }),
    ).toBe(false);
  });
  it("accepts nonstandard codes and configurable SIWES without numeric progression", () => {
    const programme = structuredClone(campuses[0]!.programmes[0]!);
    programme.levels = [7, 42];
    programme.structure.stages = programme.structure.stages
      .slice(0, 2)
      .map((stage, i) => ({
        ...stage,
        code: programme.levels[i]!,
        activityTags: i ? ["siwes"] : [],
        entryModes: ["direct_entry", "transfer"],
      }));
    expect(programmeSchema.safeParse(programme).success).toBe(true);
    programme.structure.stages[1]!.code = 7;
    expect(programmeSchema.safeParse(programme).success).toBe(false);
  });
});
describe("typed fixtures and provenance", () => {
  it("rejects unknown placeholders, broken references and accidental publication", () => {
    const pack = structuredClone(campuses[0]!);
    expect(packSchema.safeParse({ ...pack, schemaVersion: 1 }).success).toBe(
      false,
    );
    expect(
      packSchema.safeParse({ ...pack, routes: [{ anything: true }] }).success,
    ).toBe(false);
    expect(
      packSchema.safeParse({
        ...pack,
        buildings: [
          {
            id: "demo",
            label: "Demo",
            locationId: "missing",
            venueKinds: [],
            metadata: pack.metadata,
          },
        ],
      }).success,
    ).toBe(false);
    const candidatePack = {
      ...pack,
      contentStatus: "mixed_content",
      metadata: { ...pack.metadata, status: "candidate" },
    };
    expect(packSchema.safeParse(candidatePack).success).toBe(true);
    expect(previewPackSchema.safeParse(candidatePack).success).toBe(false);
    expect(
      packSchema.safeParse({
        ...pack,
        metadata: { ...pack.metadata, status: "published", confidence: 1 },
      }).success,
    ).toBe(false);
  });
  it("applies corroboration and authoritative-source policies at entity level", () => {
    const evidence = {
      reference: "source reference",
      sourceId: "source",
      authority: "community" as const,
      retrievedAt: "2026-10-09T00:00:00Z",
      lastObservedAt: "2026-10-09T00:00:00Z",
      independentGroup: "one",
    };
    const cultural = {
      ...campuses[0]!.metadata,
      status: "published",
      category: "cultural",
      authorityClass: "cultural",
      confidence: 0.9,
      retrievedAt: evidence.retrievedAt,
      lastObservedAt: evidence.lastObservedAt,
      evidence: [evidence, { ...evidence, independentGroup: "two" }],
    };
    expect(metadataSchema.safeParse(cultural).success).toBe(true);
    expect(
      metadataSchema.safeParse({ ...cultural, evidence: [evidence, evidence] })
        .success,
    ).toBe(false);
    expect(
      metadataSchema.safeParse({ ...cultural, authorityClass: "critical" })
        .success,
    ).toBe(false);
    expect(
      metadataSchema.safeParse({
        ...cultural,
        authorityClass: "official",
        category: "programme",
        evidence: [{ ...evidence, authority: "official" }],
      }).success,
    ).toBe(true);
  });
});
describe("service trust", () => {
  it("binds client, route, body, timestamp and key; rejects replay and cookie tampering", () => {
    const context = {
      client: "a".repeat(32),
      network: pseudonym("192.0.2.1", "network-key"),
    };
    const signed = signContext(
      context,
      "POST",
      "/v1/guests",
      "{}",
      localTrustKey,
      1000,
    );
    expect(
      verifyContext(signed, "POST", "/v1/guests", "{}", localTrustKey, 1001),
    ).toMatchObject(context);
    expect(
      verifyContext(signed, "POST", "/v1/guests", "{}", localTrustKey, 31000),
    ).toBeNull();
    for (const [method, path, body, key, now] of [
      ["GET", "/v1/guests", "{}", localTrustKey, 1000],
      ["POST", "/other", "{}", localTrustKey, 1000],
      ["POST", "/v1/guests", "tampered", localTrustKey, 1000],
      ["POST", "/v1/guests", "{}", "wrong-key", 1000],
      ["POST", "/v1/guests", "{}", localTrustKey, 40000],
    ] as const)
      expect(verifyContext(signed, method, path, body, key, now)).toBeNull();
    const replay = new ReplayGuard();
    expect(replay.accept("nonce", 1000)).toBe(true);
    expect(replay.accept("nonce", 1001)).toBe(false);
    expect(replay.accept("nonce", 62000)).toBe(true);
    const cookie = signedClientCookie(context.client, localTrustKey);
    expect(readClientCookie(cookie, localTrustKey)).toBe(context.client);
    expect(readClientCookie(cookie + "x", localTrustKey)).toBeNull();
    expect(pseudonym("192.0.2.1", "key", "2026-10-09")).not.toBe(
      pseudonym("192.0.2.1", "key", "2026-10-10"),
    );
  });
  it("separates two clients behind one BFF and rejects spoofed/replayed headers", async () => {
    const instance = await createApi(readConfig({}));
    try {
      await instance.app.listen(0, "127.0.0.1");
      const base = await instance.app.getUrl();
      const body = JSON.stringify(validGuestFixture);
      const send = (
        client: string,
        header = signContext(
          { client, network: pseudonym("192.0.2.1", "test-network-key") },
          "POST",
          "/v1/guests",
          body + "\n",
          localTrustKey,
        ),
      ) =>
        fetch(`${base}/v1/guests`, {
          method: "POST",
          headers: {
            Origin: "http://localhost:3001",
            "Content-Type": "application/json",
            "X-CW-Context": header,
            "X-Forwarded-For": "203.0.113.99",
            "X-CW-Client": "forged",
          },
          body,
        });
      for (let i = 0; i < 10; i++)
        expect((await send("a".repeat(32))).status).toBe(201);
      expect((await send("a".repeat(32))).status).toBe(429);
      for (let i = 0; i < 10; i++)
        expect((await send("b".repeat(32))).status).toBe(201);
      expect((await send("b".repeat(32), "forged")).status).toBe(401);
      const signed = signContext(
        {
          client: "c".repeat(32),
          network: pseudonym("192.0.2.1", "test-network-key"),
        },
        "POST",
        "/v1/guests",
        body + "\n",
        localTrustKey,
      );
      expect((await send("c".repeat(32), signed)).status).toBe(201);
      expect((await send("c".repeat(32), signed)).status).toBe(401);
    } finally {
      await instance.app.close();
      await instance.repository.close();
    }
  });
  it("requires service authentication in nonlocal mode without browser CORS", async () => {
    const config = readConfig({
      APP_ENV: "staging",
      PLAYER_STORE: "postgres",
      DATABASE_URL: "postgresql://unused",
      GAME_ORIGIN: "https://game.example.test",
      SESSION_SECRET: "s".repeat(32),
      BFF_SERVICE_SECRET: "b".repeat(32),
      NETWORK_HMAC_SECRET: "n".repeat(32),
    });
    const instance = await createApi(config, new MemoryPlayerRepository());
    try {
      await instance.app.listen(0, "127.0.0.1");
      const base = await instance.app.getUrl();
      const denied = await fetch(`${base}/v1/campuses`, {
        headers: { Origin: config.GAME_ORIGIN, "X-Forwarded-For": "192.0.2.2" },
      });
      expect(denied.status).toBe(401);
      expect((await fetch(`${base}/V1/campuses`)).status).toBe(401);
      expect(denied.headers.get("access-control-allow-origin")).toBeNull();
      const signed = signContext(
        {
          client: "a".repeat(32),
          network: pseudonym("192.0.2.1", "test-network-key"),
        },
        "GET",
        "/v1/campuses",
        "\n",
        config.BFF_SERVICE_SECRET!,
      );
      expect(
        (
          await fetch(`${base}/v1/campuses`, {
            headers: { "X-CW-Context": signed },
          })
        ).status,
      ).toBe(200);
    } finally {
      await instance.app.close();
      await instance.repository.close();
    }
  });
});
it("cleans expired guests in bounded idempotent batches without touching active sessions", async () => {
  const repo = new MemoryPlayerRepository(() => 0);
  for (let i = 0; i < 5; i++)
    await repo.create({
      tokenHash: `row-${i}`,
      player: {
        ...validGuestFixture,
        id: `row-${i}`,
        createdAt: new Date(0).toISOString(),
        expiresAt: new Date(i < 4 ? 100 : 10000).toISOString(),
      },
    });
  expect(await cleanupGuests(repo, () => 100, 2, 1)).toBe(2);
  expect(await cleanupGuests(repo, () => 100, 2, 2)).toBe(2);
  expect(await cleanupGuests(repo, () => 100, 2, 2)).toBe(0);
  expect(await repo.findByTokenHash("row-4")).not.toBeNull();
  await expect(repo.deleteExpired(new Date(), 1001)).rejects.toThrow();
  await repo.close();
});
