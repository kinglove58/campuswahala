import { describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../packages/database/src";
import { AccountService } from "../apps/api/src/accounts";
import { readConfig } from "../packages/config/src";
import { cleanupAccounts } from "../apps/worker/src/deletion";
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "subject identity, bounded catalogue and concurrent cleanup",
  () => {
    it("pages beyond 100 subjects without collisions or private data; rejects invalid source authority", async () => {
      const db = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
      });
      const campus = await db.campus.findUniqueOrThrow({
        where: { slug: "futa" },
      });
      const tag = randomUUID(),
        factIds: string[] = [],
        subjectIds: string[] = [];
      const service = new AccountService(
        readConfig({ APP_ENV: "local" }),
        tag.repeat(2),
        db,
      );
      try {
        for (let i = 0; i < 125; i++) {
          const subject = await db.campusSubject.create({
            data: {
              campusId: campus.id,
              subjectType: "building",
              name: `Test ${tag} ${i}`,
              aliases: [],
            },
          });
          subjectIds.push(subject.id);
          const fact = await db.campusFact.create({
            data: {
              campusId: campus.id,
              subjectType: "building",
              canonicalSubjectId: subject.id,
              propertyKey: "name",
              status: i < 122 ? "published" : "held",
              staleAt: new Date(Date.now() + 86400000),
            },
          });
          factIds.push(fact.id);
          if (i === 124) continue;
          const version = await db.factVersion.create({
            data: {
              factId: fact.id,
              version: 1,
              value: subject.name,
              category: "building",
              confidence: 0.95,
              extractedAt: new Date(),
              lastObservedAt: new Date(),
              valueHash: String(i).padStart(64, "a"),
            },
          });
          await db.campusFact.update({
            where: { id: fact.id },
            data: {
              currentVersionId: version.id,
              ...(i === 121 ? { staleAt: new Date(0) } : {}),
            },
          });
        }
        let cursor: string | undefined;
        const found: string[] = [];
        do {
          const page = await service.publishedCatalogue({
            campus: "futa",
            subjectType: "building",
            category: "building",
            limit: 17,
            ...(cursor ? { cursor } : {}),
          });
          expect(page.facts.length).toBeLessThanOrEqual(17);
          found.push(
            ...page.facts
              .filter((f) => factIds.includes(f.id))
              .map((f) => f.id),
          );
          expect(JSON.stringify(page)).not.toMatch(
            /candidateSubjectKey|actorHash|independentGroup|extractorVersion/,
          );
          cursor = page.nextCursor ?? undefined;
        } while (cursor);
        expect(new Set(found).size).toBe(121);
        expect(found.length).toBe(121);
        const first = await service.publishedCatalogue({
          campus: "futa",
          limit: 1,
        });
        for (const bad of [
          { campus: "unknown" },
          { limit: 101 },
          { limit: 0 },
          { cursor: "javascript:bad" },
          { userId: randomUUID() },
          { campus: "oau", cursor: first.nextCursor },
        ])
          await expect(service.publishedCatalogue(bad)).rejects.toThrow();
        await expect(
          db.contentSource.create({
            data: {
              campusId: campus.id,
              url: `https://${tag}.example`,
              domain: `${tag}.example`,
              type: "public_html",
              authorityClass: "magic",
              independentGroup: tag,
              discoveryMethod: "test",
            },
          }),
        ).rejects.toThrow();
        for (const invalid of [
          { policyStatus: "approved_by_browser" },
          { robotsPolicy: "ignored" },
          { status: "PUBLISH_NOW" },
        ]) {
          await expect(
            db.contentSource.create({
              data: {
                campusId: campus.id,
                url: `https://${tag}.example`,
                domain: `${tag}.example`,
                type: "public_html",
                authorityClass: "official",
                independentGroup: tag,
                discoveryMethod: "test",
                ...invalid,
              },
            }),
          ).rejects.toThrow();
        }
        await expect(
          db.campusFact.create({
            data: {
              campusId: campus.id,
              subjectType: "building",
              propertyKey: "name",
            },
          }),
        ).rejects.toThrow();
      } finally {
        await db.campusFact.updateMany({
          where: { id: { in: factIds } },
          data: { currentVersionId: null },
        });
        await db.factVersion.deleteMany({ where: { factId: { in: factIds } } });
        await db.campusFact.deleteMany({ where: { id: { in: factIds } } });
        await db.campusSubject.deleteMany({
          where: { id: { in: subjectIds } },
        });
        await db.$disconnect();
      }
    });
    it("two workers claim each deletion once and repeated sweeps report zero", async () => {
      const db = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
      });
      const other = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
      });
      const ids: string[] = [],
        receipts: string[] = [];
      try {
        for (let i = 0; i < 8; i++) {
          const u = await db.user.create({
            data: { status: "deletion_pending", deletion: { create: {} } },
            include: { deletion: true },
          });
          ids.push(u.id);
          receipts.push(u.deletion!.id);
        }
        const results = await Promise.all([
          cleanupAccounts(db),
          cleanupAccounts(other),
        ]);
        expect(
          results.reduce((n, r) => n + r.deletedAccounts, 0),
        ).toBeGreaterThanOrEqual(8);
        expect(await db.user.count({ where: { id: { in: ids } } })).toBe(0);
        expect(
          await db.deletionRequest.count({
            where: { id: { in: receipts }, completedAt: { not: null } },
          }),
        ).toBe(8);
        expect((await cleanupAccounts(db)).deletedAccounts).toBe(0);
      } finally {
        await db.user.deleteMany({ where: { id: { in: ids } } });
        await db.deletionRequest.deleteMany({
          where: { id: { in: receipts } },
        });
        await db.$disconnect();
        await other.$disconnect();
      }
    });
  },
);
