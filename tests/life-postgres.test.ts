import { it, expect, describe } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../packages/database/src";
import { AccountService } from "../apps/api/src/accounts";
import { AcademicService } from "../apps/api/src/academics";
import { LifeService } from "../apps/api/src/life";
import { readConfig } from "../packages/config/src";
import { issueGuestToken } from "../packages/auth/src";
import { cleanupAccounts } from "../apps/worker/src/deletion";
import { createApi } from "../apps/api/src/app";
import { signContext, localTrustKey } from "../packages/security/src";
import type { AcademicView } from "../packages/domain/src";
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "transactional campus life authority",
  () => {
    it("initializes explicitly for legacy terms, shares every academic minute, races safely, preserves receipts and cascades deletion", async () => {
      const db = new PrismaClient({
          datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
        }),
        key = randomUUID().repeat(2),
        accounts = new AccountService(
          readConfig({
            APP_ENV: "local",
            PLAYER_STORE: "postgres",
            DATABASE_URL: process.env.TEST_DATABASE_URL,
            SESSION_SECRET: key,
          }),
          key,
          db,
        ),
        academics = new AcademicService(accounts),
        life = new LifeService(academics),
        ids: string[] = [];
      const owner = async () => {
        const token = issueGuestToken();
        const user = await db.user.create({
          data: {
            sessions: {
              create: {
                tokenHash: accounts.hash(token),
                expiresAt: new Date(Date.now() + 86400000),
              },
            },
          },
        });
        ids.push(user.id);
        const programme = await db.programme.findFirstOrThrow({
            where: {
              slug: "computing-demo",
              department: { faculty: { campus: { slug: "futa" } } },
            },
            include: {
              structures: {
                include: { stages: { orderBy: { order: "asc" } } },
              },
              department: { include: { faculty: true } },
            },
          }),
          structure = programme.structures[0]!;
        await db.playerCharacter.create({
          data: {
            userId: user.id,
            campusId: programme.department.faculty.campusId,
            programmeId: programme.id,
            structureId: structure.id,
            structureVersion: structure.version,
            stageId: structure.stages[0]!.id,
            entryMode: "standard",
            nickname: "Campus Explorer",
            avatar: "lime",
            durationYears: 4,
          },
        });
        return { token, id: user.id };
      };
      try {
        const a = await owner(),
          b = await owner();
        let view: AcademicView = (
          await academics.command(a.token, {
            type: "START_TERM",
            commandId: randomUUID(),
          })
        ).state;
        const automatic = await life.read(a.token);
        expect(automatic.state!.lastProcessedMinute).toBe(view.term!.minute);
        expect(automatic.state!.homeVenueId).toBe(view.term!.presenceVenueId);
        // Emulate a pre-Phase-4 active term with no life row; never edit academic state.
        await db.lifeSimulation.delete({ where: { userId: a.id } });
        expect((await life.read(a.token)).state).toBeNull();
        expect(await db.lifeSimulation.count({ where: { userId: a.id } })).toBe(
          0,
        );
        const start = {
          type: "START_LIFE",
          commandId: randomUUID(),
          termId: view.term!.id,
        };
        const initialized = await life.command(a.token, start),
          replay = await life.command(a.token, start);
        expect(replay.receipt).toEqual(initialized.receipt);
        expect(replay.state.state).toEqual(initialized.state.state);
        const again = await life.command(a.token, {
          ...start,
          commandId: randomUUID(),
        });
        expect(again.state.state!.metrics).toEqual(
          initialized.state.state!.metrics,
        );
        expect(again.state.state!.revision).toBe(
          initialized.state.state!.revision,
        );
        await expect(
          life.command(a.token, {
            ...start,
            type: "REST",
            optionId: "rest-short",
          }),
        ).rejects.toThrow("IDEMPOTENCY_CONFLICT");
        await expect(
          life.command(a.token, {
            type: "EAT",
            optionId: "proper-meal",
            termId: view.term!.id,
            commandId: randomUUID(),
          }),
        ).rejects.toThrow("LIFE_VENUE_REQUIRED");
        const academic = async (input: Record<string, unknown>) => {
          const r = await academics.command(a.token, {
            termId: view.term!.id,
            commandId: randomUUID(),
            ...input,
          });
          view = r.state;
          return r;
        };
        const from = view.term!.minute,
          revision = view.revision;
        await Promise.all([
          academic({
            type: "STUDY",
            courseId: view.term!.courses[0]!.id,
            minutes: 30,
          }),
          life.command(a.token, {
            type: "REST",
            optionId: "rest-short",
            termId: view.term!.id,
            commandId: randomUUID(),
          }),
        ]);
        view = await academics.read(a.token);
        expect(view.term!.minute).toBe(from + 60);
        expect(view.revision).toBe(revision + 2);
        expect((await life.read(a.token)).state!.lastProcessedMinute).toBe(
          view.term!.minute,
        );
        const food = view.term!.venues.find((v) => v.type === "food")!;
        await academic({ type: "TRAVEL_TO_VENUE", venueId: food.id });
        let lv = await life.read(a.token);
        expect(lv.pending).not.toBeNull();
        const pending = lv.pending!;
        await academics.command(b.token, {
          type: "START_TERM",
          commandId: randomUUID(),
        });
        const bv = await academics.read(b.token);
        await expect(
          life.command(b.token, {
            type: "RESOLVE_WAHALA",
            termId: bv.term!.id,
            commandId: randomUUID(),
            occurrenceId: pending.id,
            choiceId: "take-time",
          }),
        ).rejects.toThrow("WAHALA_NOT_PENDING");
        const command = {
            type: "RESOLVE_WAHALA",
            termId: view.term!.id,
            commandId: randomUUID(),
            occurrenceId: pending.id,
            choiceId: "take-time",
          },
          before = (await life.read(a.token)).state!.revision;
        const race = await Promise.allSettled([
          life.command(a.token, command),
          life.command(a.token, { ...command, commandId: randomUUID() }),
        ]);
        expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
        lv = await life.read(a.token);
        expect(lv.state!.revision).toBe(before + 1);
        expect(lv.recent.find((h) => h.id === pending.id)!.status).toBe(
          "resolved",
        );
        const win = race.find((r) => r.status === "fulfilled")!;
        if (win.status !== "fulfilled") throw Error("No winner");
        const winnerKey =
          race[0]!.status === "fulfilled"
            ? command
            : await db.lifeCommandReceipt.findFirstOrThrow({
                where: { userId: a.id, type: "RESOLVE_WAHALA" },
              });
        const repeat = await life.command(a.token, {
          ...command,
          commandId: winnerKey.commandId,
        });
        expect(repeat.receipt).toEqual(win.value.receipt);
        expect(repeat.state.state!.revision).toBe(lv.state!.revision);
        const corrupt = structuredClone(lv.state!);
        corrupt.metrics.energy = 10001;
        await expect(
          db.lifeSimulation.update({
            where: { userId: a.id },
            data: { snapshot: JSON.parse(JSON.stringify(corrupt)) },
          }),
        ).rejects.toThrow();
        const occurred = await db.wahalaOccurrence.findUniqueOrThrow({
          where: { id: pending.id },
        });
        await expect(
          db.wahalaOccurrence.update({
            where: { id: pending.id },
            data: { snapshot: { changed: true }, status: "resolved" },
          }),
        ).rejects.toThrow();
        expect(
          (
            await db.wahalaOccurrence.findUniqueOrThrow({
              where: { id: pending.id },
            })
          ).snapshot,
        ).toEqual(occurred.snapshot);
        await accounts.requestDeletion(a.token);
        await expect(life.read(a.token)).rejects.toThrow();
        await expect(life.command(a.token, start)).rejects.toThrow();
        const deletions = await Promise.all([
          cleanupAccounts(db),
          cleanupAccounts(db),
        ]);
        expect(deletions.reduce((n, d) => n + d.deletedAccounts, 0)).toBe(1);
        for (const count of [
          await db.lifeSimulation.count({ where: { userId: a.id } }),
          await db.lifeCommandReceipt.count({ where: { userId: a.id } }),
          await db.wahalaOccurrence.count({ where: { userId: a.id } }),
        ])
          expect(count).toBe(0);
      } finally {
        await db.user.deleteMany({ where: { id: { in: ids } } });
        await db.$disconnect();
      }
    }, 120000);
    it("enforces signed body/session/replay binding, private no-store and all strict authority fields over HTTP", async () => {
      const config = readConfig({
          APP_ENV: "local",
          PLAYER_STORE: "postgres",
          DATABASE_URL: process.env.TEST_DATABASE_URL,
          SESSION_SECRET: randomUUID().repeat(2),
        }),
        { app, repository, accounts } = await createApi(config);
      await app.listen(0, "127.0.0.1");
      const origin = await app.getUrl(),
        token = issueGuestToken(),
        db = accounts.db!,
        user = await db.user.create({
          data: {
            sessions: {
              create: {
                tokenHash: accounts.hash(token),
                expiresAt: new Date(Date.now() + 86400000),
              },
            },
          },
        });
      const headers = (method: string, path: string, body: string) => ({
        Origin: config.GAME_ORIGIN,
        "Content-Type": "application/json",
        "X-Account-Token": token,
        "X-CW-Context": signContext(
          { client: "a".repeat(32), network: "b".repeat(64) },
          method,
          path,
          `${body}\n\n${token}`,
          localTrustKey,
        ),
      });
      try {
        const path = "/v1/life/commands",
          good = {
            type: "START_LIFE",
            commandId: randomUUID(),
            termId: randomUUID(),
          };
        expect((await fetch(`${origin}/v1/life/state`)).status).toBe(401);
        for (const field of [
          "energy",
          "satiety",
          "mood",
          "wellbeing",
          "userId",
          "venueId",
          "time",
          "timeCost",
          "score",
          "gpa",
          "roll",
          "seed",
          "templateId",
          "effects",
          "flags",
        ]) {
          const body = JSON.stringify({ ...good, [field]: 10000 });
          expect(
            (
              await fetch(`${origin}${path}`, {
                method: "POST",
                headers: headers("POST", path, body),
                body,
              })
            ).status,
          ).toBe(400);
        }
        const body = JSON.stringify(good),
          h = headers("POST", path, body);
        h["X-Account-Token"] = issueGuestToken();
        expect(
          (
            await fetch(`${origin}${path}`, {
              method: "POST",
              headers: h,
              body,
            })
          ).status,
        ).toBe(401);
        const replay = headers("POST", path, body);
        expect(
          (
            await fetch(`${origin}${path}`, {
              method: "POST",
              headers: replay,
              body,
            })
          ).status,
        ).toBe(400);
        expect(
          (
            await fetch(`${origin}${path}`, {
              method: "POST",
              headers: replay,
              body,
            })
          ).status,
        ).toBe(401);
        const read = await fetch(`${origin}/v1/life/state`, {
          headers: headers("GET", "/v1/life/state", ""),
        });
        expect(read.status).toBe(400);
        expect(read.headers.get("cache-control")).toBe("no-store");
        await accounts.logout(token);
        expect(
          (
            await fetch(`${origin}/v1/life/state`, {
              headers: headers("GET", "/v1/life/state", ""),
            })
          ).status,
        ).toBe(401);
      } finally {
        await db.user.deleteMany({ where: { id: user.id } });
        await app.close();
        await repository.close();
        await accounts.close();
      }
    });
  },
);
