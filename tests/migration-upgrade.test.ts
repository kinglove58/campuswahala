import { it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "../packages/database/src";
it.skipIf(!process.env.TEST_DATABASE_URL)(
  "upgrades a real Phase 0.5 database through versioned migrations and preserves its guest",
  async () => {
    const schema = `upgrade_${randomUUID().replaceAll("-", "")}`;
    const base = new URL(process.env.TEST_DATABASE_URL!);
    base.searchParams.set("schema", schema);
    const db = new PrismaClient({ datasources: { db: { url: base.href } } });
    const staging = resolve("artifacts", schema);
    mkdirSync(staging, { recursive: true });
    const require = createRequire(resolve("packages/database/package.json"));
    const cli = require.resolve("prisma/build/index.js");
    const migrate = () =>
      execFileSync(
        process.execPath,
        [
          cli,
          "migrate",
          "deploy",
          "--schema",
          resolve(staging, "schema.prisma"),
        ],
        {
          env: { ...process.env, DATABASE_URL: base.href },
          stdio: "pipe",
          timeout: 60000,
        },
      );
    const copyMigration = (name: string) => {
      const dest = resolve(staging, "migrations", name);
      mkdirSync(dest, { recursive: true });
      copyFileSync(
        resolve("packages/database/prisma/migrations", name, "migration.sql"),
        resolve(dest, "migration.sql"),
      );
    };
    try {
      await db.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
      copyFileSync(
        resolve("packages/database/prisma/schema.prisma"),
        resolve(staging, "schema.prisma"),
      );
      mkdirSync(resolve(staging, "migrations"), { recursive: true });
      copyFileSync(
        resolve("packages/database/prisma/migrations/migration_lock.toml"),
        resolve(staging, "migrations/migration_lock.toml"),
      );
      copyMigration("202610090001_guest");
      copyMigration("202610090002_explicit_stages");
      migrate();
      const id = randomUUID();
      await db.guestPlayer.create({
        data: {
          id,
          tokenHash: randomUUID().replaceAll("-", "").padEnd(64, "a"),
          campusId: "oau",
          programmeId: "engineering-demo",
          level: 600,
          durationYears: 6,
          avatar: "blue",
          nickname: "Creative Spirit",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
      copyMigration("202610090003_phase_1");
      migrate();
      copyMigration("202610090004_fact_expiry_and_position_guards");
      migrate();
      copyMigration("202610090005_world_state");
      migrate();
      const oldFactId = randomUUID(),
        oldVersionId = randomUUID();
      const campus = await db.campus.findFirstOrThrow();
      await db.$executeRaw`INSERT INTO "CampusFact" ("id", "campusId", "entityType", "key", "status", "staleAt") VALUES (${oldFactId}::uuid, ${campus.id}::uuid, 'building', 'library.name', 'published', now() + interval '30 days')`;
      await db.$executeRaw`INSERT INTO "FactVersion" ("id", "factId", "version", "value", "category", "confidence", "extractedAt", "lastObservedAt", "valueHash", "contradiction") VALUES (${oldVersionId}::uuid, ${oldFactId}::uuid, 1, '"Legacy library"'::jsonb, 'building', 0.95, now(), now(), ${"a".repeat(64)}, false)`;
      await db.$executeRaw`UPDATE "CampusFact" SET "currentVersionId" = ${oldVersionId}::uuid WHERE "id" = ${oldFactId}::uuid`;
      copyMigration("202610100006_subject_identity");
      migrate();
      expect(
        await db.campusFact.findUnique({ where: { id: oldFactId } }),
      ).toMatchObject({
        currentVersionId: oldVersionId,
        status: "published",
        subjectType: "building",
        propertyKey: "name",
        candidateSubjectKey: "legacy:library.name",
      });
      expect(await db.playerWorldState.count()).toBe(0);
      expect(await db.guestPlayer.findUnique({ where: { id } })).toMatchObject({
        level: 600,
        durationYears: 6,
        avatar: "blue",
      });
      expect(await db.programmeStage.count()).toBeGreaterThan(0);
      expect(await db.campusFact.count()).toBe(1);
      expect(await db.user.count()).toBe(0);
    } finally {
      await db.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await db.$disconnect();
    }
  },
  120000,
);
