import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { AcademicService } from "../apps/api/src/academics";
import { AccountService } from "../apps/api/src/accounts";
import { PrismaClient } from "../packages/database/src";
import { readConfig } from "../packages/config/src";
import { issueGuestToken } from "../packages/auth/src";
import { cleanupAccounts } from "../apps/worker/src/deletion";
import { createApi } from "../apps/api/src/app";
import { signContext, localTrustKey } from "../packages/security/src";

describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "transactional private academic simulation",
  () => {
    it("plays a full semester, locks concurrent transitions, preserves receipts/history and enrolls carryovers without invented direct-entry history", async () => {
      const db = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
      });
      const key = randomUUID().repeat(2),
        config = readConfig({
          APP_ENV: "local",
          PLAYER_STORE: "postgres",
          DATABASE_URL: process.env.TEST_DATABASE_URL,
          SESSION_SECRET: key,
        });
      const accounts = new AccountService(config, key, db),
        academic = new AcademicService(accounts),
        token = issueGuestToken(),
        otherToken = issueGuestToken();
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
      const other = await db.user.create({
        data: {
          sessions: {
            create: {
              tokenHash: accounts.hash(otherToken),
              expiresAt: new Date(Date.now() + 86400000),
            },
          },
        },
      });
      try {
        const programme = await db.programme.findFirstOrThrow({
          where: {
            slug: "computing-demo",
            department: { faculty: { campus: { slug: "futa" } } },
          },
          include: {
            structures: { include: { stages: { orderBy: { order: "asc" } } } },
            department: { include: { faculty: true } },
          },
        });
        const structure = programme.structures[0]!,
          stage = structure.stages[1]!;
        await db.playerCharacter.create({
          data: {
            userId: user.id,
            campusId: programme.department.faculty.campusId,
            programmeId: programme.id,
            structureId: structure.id,
            structureVersion: structure.version,
            stageId: stage.id,
            entryMode: "direct_entry",
            nickname: "Campus Explorer",
            avatar: "lime",
            durationYears: 4,
          },
        });
        let view = await academic.read(token);
        expect(view.history).toHaveLength(0);
        const start = { commandId: randomUUID(), type: "START_TERM" };
        const first = await academic.command(token, start),
          retried = await academic.command(token, start);
        expect(retried.receipt).toEqual(first.receipt);
        view = first.state;
        expect(view.term?.stageId).toBe(stage.id);
        expect(view.term?.courses[0]!.code).toBe("CW-CMP-201");
        expect(view.history).toHaveLength(0);
        await expect(
          academic.command(token, {
            ...start,
            type: "END_DAY",
            termId: view.term!.id,
          }),
        ).rejects.toThrow("IDEMPOTENCY_CONFLICT");
        await expect(
          academic.command(token, {
            commandId: randomUUID(),
            type: "START_TERM",
          }),
        ).rejects.toThrow("ACTIVE_TERM_EXISTS");
        await expect(academic.read(otherToken)).rejects.toThrow(
          "CHARACTER_REQUIRED",
        );
        const cmd = async (input: Record<string, unknown>) => {
          const c = {
            ...(input.type === "START_TERM" ? {} : { termId: view.term!.id }),
            ...input,
            commandId: randomUUID(),
          };
          const r = await academic.command(token, c);
          view = r.state;
          return r;
        };
        const race = async (input: Record<string, unknown>) => {
          const before = view.revision;
          const termId = view.term!.id;
          const a = { ...input, termId, commandId: randomUUID() },
            b = { ...input, termId, commandId: randomUUID() };
          const out = await Promise.allSettled([
            academic.command(token, a),
            academic.command(token, b),
          ]);
          expect(out.filter((r) => r.status === "fulfilled")).toHaveLength(1);
          const winner = out.find((r) => r.status === "fulfilled")!;
          if (winner.status !== "fulfilled") throw new Error("no winner");
          view = winner.value.state;
          expect(view.revision).toBe(before + 1);
          const repeat = await academic.command(
            token,
            out[0]!.status === "fulfilled" ? a : b,
          );
          expect(repeat.receipt).toEqual(winner.value.receipt);
        };
        await cmd({ type: "WAIT_TO_NEXT_EVENT" });
        await cmd({
          type: "TRAVEL_TO_VENUE",
          venueId: view.term!.courses[0]!.lectures[0]!.venueId,
        });
        await cmd({ type: "WAIT_TO_NEXT_EVENT" });
        await race({
          type: "ATTEND_LECTURE",
          lectureId: view.term!.courses[0]!.lectures[0]!.id,
        });
        const library = view.term!.venues.find((v) => v.type === "library")!.id;
        await cmd({ type: "TRAVEL_TO_VENUE", venueId: library });
        for (const course of view.term!.courses.slice(0, 5)) {
          for (let i = 0; i < 8; i++)
            await cmd({ type: "STUDY", courseId: course.id, minutes: 120 });
          for (let i = 0; i < Math.ceil(course.requiredEffort / 60); i++)
            await cmd({
              type: "WORK_ON_ASSIGNMENT",
              courseId: course.id,
              minutes: 60,
            });
          await race({ type: "SUBMIT_ASSIGNMENT", courseId: course.id });
        }
        // Cosmetic safe-return writes never change authoritative academic presence.
        const beforePresence = view.term!.presenceVenueId;
        await accounts.saveWorldState(token, {
          campusId: "futa",
          worldVersion: 2,
          spawnId: "spawn-venue-0",
          appearance: {
            skin: "brown",
            hair: "crop",
            hairColour: "black",
            top: "lime",
            bottom: "trousers",
            shoes: "dark",
            accessory: "backpack",
          },
        });
        expect((await academic.read(token)).term!.presenceVenueId).toBe(
          beforePresence,
        );
        await cmd({
          type: "TRAVEL_TO_VENUE",
          venueId: view.term!.courses[0]!.test.venueId,
        });
        let tested = false,
          examined = false;
        for (
          let steps = 0;
          steps < 100 && view.term!.minute < view.term!.endMinute;
          steps++
        ) {
          const action = view.allowedActions.find(
            (c) =>
              c.type === "TAKE_TEST" ||
              c.type === "TAKE_EXAM" ||
              c.type === "ATTEND_LECTURE",
          );
          if (action) {
            if (action.type === "TAKE_TEST" && !tested) {
              await race(action);
              tested = true;
            } else if (action.type === "TAKE_EXAM" && !examined) {
              await race(action);
              examined = true;
            } else await cmd(action);
          } else await cmd({ type: "WAIT_TO_NEXT_EVENT" });
        }
        expect(tested && examined).toBe(true);
        expect(view.term!.minute).toBe(view.term!.endMinute);
        await race({ type: "COMPLETE_TERM" });
        expect(view.term!.status).toBe("completed");
        expect(view.history).toHaveLength(1);
        expect(
          view.term!.result!.courses.filter((c) => !c.passed),
        ).toHaveLength(1);
        expect(view.term!.progression!.outcome).toBe(
          "progress_with_carryovers",
        );
        expect(view.carryovers).toHaveLength(1);
        const finalSnapshot = JSON.stringify(view.term),
          oldTermId = view.term!.id,
          failedCourse = view.carryovers[0]!.id;
        await expect(
          db.academicTerm.update({
            where: { id: oldTermId },
            data: { snapshot: { tampered: true } },
          }),
        ).rejects.toThrow();
        await cmd({ type: "START_TERM" });
        expect(view.term!.courses).toHaveLength(7);
        expect(
          view.term!.courses.find((c) => c.id === failedCourse)?.carryover,
        ).toBe(true);
        expect(view.history).toHaveLength(1);
        expect(view.term!.minute).toBe(420);
        await expect(
          academic.command(token, {
            commandId: randomUUID(),
            termId: oldTermId,
            type: "END_DAY",
          }),
        ).rejects.toThrow("TERM_REVISION_CONFLICT");
        expect(
          JSON.stringify(
            (
              await db.academicTerm.findUniqueOrThrow({
                where: { id: oldTermId },
              })
            ).snapshot,
          ),
        ).toBe(finalSnapshot);
        // Fail second term deliberately. Underlying attempted units, including the
        // retake, produce CGPA; previous finalized grades stay immutable.
        while (view.term!.minute < view.term!.endMinute)
          await cmd({ type: "END_DAY" });
        await cmd({ type: "COMPLETE_TERM" });
        expect(view.history).toHaveLength(2);
        expect(view.term!.progression!.outcome).toBe("repeat_stage");
        expect(view.term!.result!.cgpaScaled).toBe(
          Math.floor(
            view.history.reduce((n, h) => n + h.result.qualityPoints, 0) /
              view.history.reduce((n, h) => n + h.result.attemptedUnits, 0),
          ),
        );
        await accounts.requestDeletion(token);
        await expect(academic.read(token)).rejects.toThrow();
        await expect(
          academic.command(token, {
            commandId: randomUUID(),
            type: "START_TERM",
          }),
        ).rejects.toThrow();
        const deletion = await Promise.all([
          cleanupAccounts(db),
          cleanupAccounts(db),
        ]);
        expect(deletion.reduce((a, b) => a + b.deletedAccounts, 0)).toBe(1);
        expect(
          await db.academicTerm.count({ where: { userId: user.id } }),
        ).toBe(0);
        expect(
          await db.academicSimulation.count({ where: { userId: user.id } }),
        ).toBe(0);
        expect(
          await db.academicCommandReceipt.count({ where: { userId: user.id } }),
        ).toBe(0);
      } finally {
        await db.user.deleteMany({
          where: { id: { in: [user.id, other.id] } },
        });
        await db.$disconnect();
      }
    }, 120000);
    it("enforces signed BFF account/body binding, private no-store reads and strict anti-cheat through HTTP", async () => {
      const config = readConfig({
        APP_ENV: "local",
        PLAYER_STORE: "postgres",
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        SESSION_SECRET: randomUUID().repeat(2),
      });
      const { app, repository, accounts } = await createApi(config);
      await app.listen(0, "127.0.0.1");
      const origin = await app.getUrl(),
        token = issueGuestToken();
      const db = accounts.db!;
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
      const headers = (
        method: string,
        path: string,
        body: string,
        session = token,
      ) => ({
        Origin: config.GAME_ORIGIN,
        "Content-Type": "application/json",
        "X-Account-Token": session,
        "X-CW-Context": signContext(
          { client: "a".repeat(32), network: "b".repeat(64) },
          method,
          path,
          `${body}\n\n${session}`,
          localTrustKey,
        ),
      });
      try {
        expect((await fetch(`${origin}/v1/academic/state`)).status).toBe(401);
        const request = JSON.stringify({
            commandId: randomUUID(),
            type: "START_TERM",
          }),
          path = "/v1/academic/commands";
        const swapped = await fetch(`${origin}${path}`, {
          method: "POST",
          headers: headers("POST", path, request, issueGuestToken()),
          body: request,
        });
        expect(swapped.status).toBe(401);
        const h = headers("POST", path, request);
        h["X-Account-Token"] = issueGuestToken();
        expect(
          (
            await fetch(`${origin}${path}`, {
              method: "POST",
              headers: h,
              body: request,
            })
          ).status,
        ).toBe(401);
        for (const field of [
          "score",
          "grade",
          "gpa",
          "cgpa",
          "masteryGain",
          "attended",
          "timeCost",
          "time",
          "venueId",
          "courseId",
          "userId",
          "enrollment",
          "seed",
          "roll",
          "progression",
        ]) {
          const body = JSON.stringify({
            commandId: randomUUID(),
            type: "START_TERM",
            [field]: 100,
          });
          const r = await fetch(`${origin}${path}`, {
            method: "POST",
            headers: headers("POST", path, body),
            body,
          });
          expect(r.status).toBe(400);
        }
        const read = await fetch(`${origin}/v1/academic/state`, {
          headers: headers("GET", "/v1/academic/state", ""),
        });
        expect(read.status).toBe(400);
        expect(read.headers.get("cache-control")).toBe("no-store");
        const replay = headers("POST", path, request);
        expect(
          (
            await fetch(`${origin}${path}`, {
              method: "POST",
              headers: replay,
              body: request,
            })
          ).status,
        ).toBe(400);
        expect(
          (
            await fetch(`${origin}${path}`, {
              method: "POST",
              headers: replay,
              body: request,
            })
          ).status,
        ).toBe(401);
        expect(
          (
            await fetch(`${origin}/v1/academic/results/${user.id}`, {
              headers: headers("GET", `/v1/academic/results/${user.id}`, ""),
            })
          ).status,
        ).toBe(404);
        await accounts.logout(token);
        expect(
          (
            await fetch(`${origin}/v1/academic/state`, {
              headers: headers("GET", "/v1/academic/state", ""),
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
