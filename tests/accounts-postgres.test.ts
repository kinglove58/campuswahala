import { defaultAppearance } from "../packages/game-engine/src";
import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { AccountService } from "../apps/api/src/accounts";
import {
  PrismaClient,
  PostgresPlayerRepository,
} from "../packages/database/src";
import {
  LocalIdentityProvider,
  hashGuestToken,
  issueGuestToken,
} from "../packages/auth/src";
import { readConfig } from "../packages/config/src";
import { validGuestFixture } from "../packages/testing/src";
import { cleanupAccounts } from "../apps/worker/src/deletion";
import { createApi } from "../apps/api/src/app";
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "private PostgreSQL accounts and conversion",
  () => {
    it("binds state, rotates sessions, isolates users, converts concurrently and deletes actual records", async () => {
      const db = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
      });
      const key = randomUUID().repeat(2);
      const config = readConfig({
        APP_ENV: "local",
        PLAYER_STORE: "postgres",
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        SESSION_SECRET: key,
      });
      const subjectA = randomUUID(),
        subjectB = randomUUID();
      const a = new AccountService(
        config,
        key,
        db,
        new LocalIdentityProvider("test", subjectA),
      );
      const b = new AccountService(
        config,
        key,
        db,
        new LocalIdentityProvider("test", subjectB),
      );
      const repo = new PostgresPlayerRepository(process.env.TEST_DATABASE_URL!);
      const client = "browser-client-a";
      const login = async (
        service: AccountService,
        band: string = "unknown",
        previous?: string,
      ) => {
        const start = await service.begin({ ageBand: band }, client);
        const url = new URL(start.authorizationUrl);
        const body = {
          state: url.searchParams.get("state"),
          code: url.searchParams.get("code"),
        };
        return { ...(await service.callback(body, client, previous)), body };
      };
      let userA: string | undefined, userB: string | undefined;
      const guests: string[] = [];
      const feedbackFactIds: string[] = [];
      try {
        const started = await a.begin({ ageBand: "under_18" }, client);
        const stateUrl = new URL(started.authorizationUrl);
        const callback = {
          state: stateUrl.searchParams.get("state"),
          code: stateUrl.searchParams.get("code"),
        };
        await expect(a.callback(callback, "browser-client-b")).rejects.toThrow(
          "AUTH_STATE_REJECTED",
        );
        const first = await a.callback(callback, client);
        userA = first.userId;
        await expect(a.callback(callback, client)).rejects.toThrow(
          "AUTH_STATE_REJECTED",
        );
        const second = await login(b);
        userB = second.userId;
        await expect(a.self(undefined)).rejects.toThrow();
        expect((await a.self(first.token)).privacy).toEqual({
          visibility: "private",
          discoverable: false,
          analyticsConsent: false,
        });
        expect((await a.self(first.token)).profile?.ageBand).toBe("under_18");
        await a.privacy(first.token, { analyticsConsent: true });
        expect((await a.self(first.token)).privacy?.analyticsConsent).toBe(
          false,
        );
        await expect(
          a.privacy(first.token, { visibility: "public", userId: userB }),
        ).rejects.toThrow("INVALID_PRIVACY_INPUT");
        const guest = issueGuestToken();
        guests.push(guest);
        await repo.create({
          tokenHash: hashGuestToken(guest, key),
          player: {
            ...validGuestFixture,
            programmeId: "engineering-demo",
            durationYears: 6,
            level: 600,
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        });
        const campus = await db.campus.findUniqueOrThrow({
          where: { slug: validGuestFixture.campusId },
        });
        for (let index = 0; index < 2; index++) {
          const fact = await db.campusFact.create({
            data: {
              campusId: campus.id,
              subjectType: "cultural",
              candidateSubjectKey: `privacy-test-${randomUUID()}`,
              propertyKey: "name",
            },
          });
          feedbackFactIds.push(fact.id);
          await db.factFeedback.create({
            data: {
              factId: fact.id,
              actorHash: a.hash(`feedback:${guest}`),
              kind: "incorrect",
              weight: 0.1,
            },
          });
          if (index === 1)
            await db.factFeedback.create({
              data: {
                factId: fact.id,
                userId: userA,
                actorHash: a.hash(`feedback:${userA}`),
                kind: "correct",
                weight: 0.2,
              },
            });
        }
        const [converted, retry] = await Promise.all([
          a.convert(first.token, guest),
          a.convert(first.token, guest),
        ]);
        expect(converted.character?.id).toBe(retry.character?.id);
        const transferredFeedback = await db.factFeedback.findMany({
          where: { factId: { in: feedbackFactIds } },
          orderBy: { kind: "asc" },
        });
        expect(transferredFeedback).toHaveLength(2);
        expect(
          transferredFeedback.every(
            (feedback) =>
              feedback.userId === userA &&
              feedback.actorHash === a.hash(`feedback:${userA}`),
          ),
        ).toBe(true);
        expect(transferredFeedback.map((feedback) => feedback.kind)).toEqual([
          "correct",
          "incorrect",
        ]);
        await db.factFeedback.create({
          data: {
            factId: feedbackFactIds[0]!,
            actorHash: a.hash(`expired-guest-${randomUUID()}`),
            kind: "closed",
            weight: 0.1,
            createdAt: new Date(Date.now() - 86400001),
          },
        });
        expect(converted.character).toMatchObject({
          programmeId: "engineering-demo",
          level: 600,
          durationYears: 6,
        });
        expect(converted.character?.position.stageId).toMatch(
          /^[a-f0-9-]{36}$/,
        );
        expect(
          await repo.findByTokenHash(hashGuestToken(guest, key)),
        ).toBeNull();
        expect((await b.self(second.token)).character).toBeNull();
        await expect(b.convert(second.token, guest)).rejects.toThrow(
          "GUEST_ALREADY_CONSUMED",
        );
        expect(
          await db.playerCharacter.count({ where: { userId: userA } }),
        ).toBe(1);
        await expect(
          db.playerCharacter.update({
            where: { userId: userA },
            data: { structureVersion: 999 },
          }),
        ).rejects.toThrow();
        const extraGuest = issueGuestToken();
        guests.push(extraGuest);
        await repo.create({
          tokenHash: hashGuestToken(extraGuest, key),
          player: {
            ...validGuestFixture,
            id: randomUUID(),
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 86400000).toISOString(),
          },
        });
        await expect(a.convert(first.token, extraGuest)).rejects.toThrow(
          "EXISTING_CHARACTER_CONFLICT",
        );
        expect(
          await repo.findByTokenHash(hashGuestToken(extraGuest, key)),
        ).not.toBeNull();
        await expect(a.convert(first.token, extraGuest)).rejects.toThrow(
          "EXISTING_CHARACTER_CONFLICT",
        );
        await expect(b.convert(second.token, extraGuest)).rejects.toThrow(
          "GUEST_ALREADY_CONSUMED",
        );
        const worldInput = {
          campusId: "futa",
          worldVersion: 2,
          spawnId: "spawn-venue-1",
          appearance: defaultAppearance,
        };
        expect((await a.worldState(first.token)).appearanceSaved).toBe(false);
        await a.saveWorldState(first.token, worldInput);
        expect(await a.worldState(first.token)).toMatchObject({
          spawnId: "spawn-venue-1",
          campusId: "futa",
          appearanceSaved: true,
        });
        for (const bad of [
          { ...worldInput, userId: userB },
          { ...worldInput, spawnId: "missing" },
          { ...worldInput, campusId: "unknown" },
          { ...worldInput, campusId: ["futa"] },
          { ...worldInput, x: 999999 },
        ])
          await expect(a.saveWorldState(first.token, bad)).rejects.toThrow(
            "INVALID_WORLD_STATE",
          );
        await expect(a.saveWorldState(guest, worldInput)).rejects.toThrow();
        await expect(b.worldState(second.token)).rejects.toThrow(
          "CHARACTER_REQUIRED",
        );
        await db.playerWorldState.update({
          where: { userId: userA },
          data: { spawnId: "removed-spawn", worldVersion: 100 },
        });
        expect((await a.worldState(first.token)).spawnId).toBe("spawn-arrival");
        const rotated = await login(a, "unknown", first.token);
        await expect(a.self(first.token)).rejects.toThrow(
          "ACCOUNT_SESSION_EXPIRED",
        );
        await a.requestDeletion(rotated.token);
        await expect(a.self(rotated.token)).rejects.toThrow(
          "ACCOUNT_SESSION_EXPIRED",
        );
        await expect(a.worldState(rotated.token)).rejects.toThrow();
        await expect(
          a.saveWorldState(rotated.token, worldInput),
        ).rejects.toThrow();
        await cleanupAccounts(db);
        expect(
          await db.playerWorldState.count({ where: { userId: userA } }),
        ).toBe(0);
        expect(await db.user.findUnique({ where: { id: userA } })).toBeNull();
        expect(
          await repo.findByTokenHash(hashGuestToken(extraGuest, key)),
        ).toBeNull();
        expect(
          await db.factFeedback.count({
            where: { factId: { in: feedbackFactIds } },
          }),
        ).toBe(0);
        expect(
          await db.playerCharacter.count({ where: { userId: userA } }),
        ).toBe(0);
        expect(
          await db.externalIdentity.count({ where: { userId: userA } }),
        ).toBe(0);
        expect(await db.userSession.count({ where: { userId: userA } })).toBe(
          0,
        );
        expect((await b.self(second.token)).profile?.ageBand).toBe("unknown");
        await b.logout(second.token);
        await expect(b.self(second.token)).rejects.toThrow();
      } finally {
        await db.factFeedback.deleteMany({
          where: { factId: { in: feedbackFactIds } },
        });
        await db.campusFact.deleteMany({
          where: { id: { in: feedbackFactIds } },
        });
        await db.user.deleteMany({
          where: { id: { in: [userA, userB].filter((v): v is string => !!v) } },
        });
        for (const guest of guests)
          await repo.deleteByTokenHash(hashGuestToken(guest, key));
        await repo.close();
        await db.$disconnect();
      }
    });
    it("denies anonymous/private access and rejects role/user/publication injections through HTTP", async () => {
      const config = readConfig({
        APP_ENV: "local",
        PLAYER_STORE: "postgres",
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        SESSION_SECRET: randomUUID().repeat(2),
        AUTH_PROVIDER: "local",
      });
      const { app, repository, accounts } = await createApi(config);
      await app.listen(0, "127.0.0.1");
      const origin = await app.getUrl();
      try {
        expect((await fetch(`${origin}/v1/account/me`)).status).toBe(401);
        for (const [path, body] of [
          [
            "begin",
            { ageBand: "unknown", userId: randomUUID(), role: "admin" },
          ],
          ["convert", { userId: randomUUID(), guestId: randomUUID() }],
        ]) {
          const response = await fetch(`${origin}/v1/account/${path}`, {
            method: "POST",
            headers: {
              Origin: config.GAME_ORIGIN,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
          });
          expect(response.status).toBe(400);
        }
        expect(
          (
            await fetch(`${origin}/v1/facts/publish`, {
              method: "POST",
              headers: {
                Origin: config.GAME_ORIGIN,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ status: "published" }),
            })
          ).status,
        ).toBe(404);
        expect((await fetch(`${origin}/v1/users/${randomUUID()}`)).status).toBe(
          404,
        );
      } finally {
        await app.close();
        await repository.close();
        await accounts.close();
      }
    });
  },
);
