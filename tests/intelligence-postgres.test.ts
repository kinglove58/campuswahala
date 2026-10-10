import { describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "../packages/database/src";
import {
  CampusIntelligencePipeline,
  type CampusFactExtractor,
} from "../apps/worker/src/intelligence";
import { SafeFetcher } from "../apps/worker/src/safe-fetch";
import { PublicationPolicyService } from "../packages/campus-content/src/publication";
import { AccountService } from "../apps/api/src/accounts";
import { readConfig } from "../packages/config/src";
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "durable intelligence with deterministic fetch/extraction",
  () => {
    it("deduplicates copies, publishes independent evidence, hides contradictions, expires stale data", async () => {
      const db = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
      });
      const tag = randomUUID();
      let now = new Date();
      let value = "Campus greeting";
      const campus = await db.campus.findUniqueOrThrow({
        where: { slug: "oau" },
      });
      const sourceIds: string[] = [];
      const fetcher = new SafeFetcher();
      vi.spyOn(fetcher, "fetch").mockImplementation(async (url) => ({
        status: 200,
        body: url.includes("robots.txt")
          ? "User-agent: *\nDisallow:"
          : `${value}|independently written page ${url}`,
        headers: { "content-type": "text/html" },
        url,
      }));
      const extractor: CampusFactExtractor = {
        version: "deterministic-test/1",
        extract: async (page) => [
          {
            entityType: "cultural",
            category: "cultural",
            key: tag,
            subjectKey: `legacy:${tag}`,
            propertyKey: tag,
            value: page.body.split("|")[0]!,
            confidence: 0.95,
            locator: "fixture:visible",
          excerpt: page.body.split("|")[0]!,
          },
        ],
      };
      const pipeline = new CampusIntelligencePipeline(
        db,
        fetcher,
        extractor,
        new PublicationPolicyService(),
        () => now,
      );
      const accounts = new AccountService(
        readConfig({ APP_ENV: "local" }),
        "test-secret".repeat(4),
        db,
      );
      try {
        for (const group of ["group-a", "group-a", "group-b"]) {
          const source = await db.contentSource.create({
            data: {
              campusId: campus.id,
              url: `https://${randomUUID()}.example/`,
              domain: "test.example",
              type: "permitted_student_public_html",
              authorityClass: "community",
              independentGroup: `${tag}:${group}`,
              discoveryMethod: "deterministic_test",
              policyStatus: "permitted_public",
              robotsPolicy: "allowed",
              robotsCheckedAt: now,
            },
          });
          sourceIds.push(source.id);
          await pipeline.process(source.id);
          const fact = await db.campusFact.findUniqueOrThrow({
            where: {
              campusId_subjectType_candidateSubjectKey_propertyKey: {
                campusId: campus.id,
                subjectType: "cultural",
                candidateSubjectKey: `legacy:${tag}`,
                propertyKey: tag,
              },
            },
          });
          expect(fact.status).toBe(group === "group-b" ? "published" : "held");
          if (group !== "group-b")
            expect(
              (await accounts.publishedCatalogue()).facts.some(
                (f) => f.id === fact.id,
              ),
            ).toBe(false);
        }
        const fact = await db.campusFact.findUniqueOrThrow({
          where: {
            campusId_subjectType_candidateSubjectKey_propertyKey: {
              campusId: campus.id,
              subjectType: "cultural",
              candidateSubjectKey: `legacy:${tag}`,
              propertyKey: tag,
            },
          },
        });
        expect(
          (await accounts.publishedCatalogue()).facts.some(
            (f) => f.id === fact.id,
          ),
        ).toBe(true);
        await pipeline.process(sourceIds[0]!);
        expect(
          await db.sourceObservation.count({
            where: { sourceId: sourceIds[0] },
          }),
        ).toBe(1);
        expect(await db.factVersion.count({ where: { factId: fact.id } })).toBe(
          1,
        );
        value = "Contradictory greeting";
        await pipeline.process(sourceIds[0]!);
        expect(await db.factVersion.count({ where: { factId: fact.id } })).toBe(
          2,
        );
        expect(
          (await db.campusFact.findUniqueOrThrow({ where: { id: fact.id } }))
            .status,
        ).toBe("held");
        expect(
          (await accounts.publishedCatalogue()).facts.some(
            (f) => f.id === fact.id,
          ),
        ).toBe(false);
        expect(
          await db.publicationDecision.count({
            where: {
              reasons: { has: "UNRESOLVED_CONTRADICTION" },
              version: { factId: fact.id },
            },
          }),
        ).toBeGreaterThan(0);
        // Demonstrate TTL sweep independently of contradictory facts.
        await db.campusFact.update({
          where: { id: fact.id },
          data: { status: "published", staleAt: new Date(now.getTime() - 1) },
        });
        now = new Date(now.getTime() + 1000);
        await pipeline.staleSweep();
        expect(
          (await db.campusFact.findUniqueOrThrow({ where: { id: fact.id } }))
            .status,
        ).toBe("stale");
        expect(pipeline.metrics.counts.contradiction_count).toBeGreaterThan(0);
      } finally {
        const fact = await db.campusFact.findUnique({
          where: {
            campusId_subjectType_candidateSubjectKey_propertyKey: {
              campusId: campus.id,
              subjectType: "cultural",
              candidateSubjectKey: `legacy:${tag}`,
              propertyKey: tag,
            },
          },
        });
        if (fact) {
          await db.campusFact.update({
            where: { id: fact.id },
            data: { currentVersionId: null },
          });
          await db.publicationDecision.deleteMany({
            where: { version: { factId: fact.id } },
          });
          await db.factVersionEvidence.deleteMany({
            where: { version: { factId: fact.id } },
          });
          await db.factVersion.deleteMany({ where: { factId: fact.id } });
          await db.campusFact.delete({ where: { id: fact.id } });
        }
        await db.evidence.deleteMany({
          where: { observation: { sourceId: { in: sourceIds } } },
        });
        await db.sourceObservation.deleteMany({
          where: { sourceId: { in: sourceIds } },
        });
        await db.contentSource.deleteMany({ where: { id: { in: sourceIds } } });
        await db.$disconnect();
        vi.restoreAllMocks();
      }
    });
    it("backs off dead sources without storing raw pages or publishing guesses", async () => {
      const db = new PrismaClient({
        datasources: { db: { url: process.env.TEST_DATABASE_URL! } },
      });
      const campus = await db.campus.findUniqueOrThrow({
        where: { slug: "futa" },
      });
      const source = await db.contentSource.create({
        data: {
          campusId: campus.id,
          url: `https://${randomUUID()}.example/`,
          domain: "test.example",
          type: "public_html",
          authorityClass: "community",
          independentGroup: randomUUID(),
          discoveryMethod: "test",
          policyStatus: "permitted_public",
        },
      });
      const fetcher = new SafeFetcher();
      vi.spyOn(fetcher, "fetch").mockRejectedValue(
        new Error("HTTP_FETCH_FAILED"),
      );
      try {
        const pipeline = new CampusIntelligencePipeline(db, fetcher);
        await pipeline.process(source.id);
        const failed = await db.contentSource.findUniqueOrThrow({
          where: { id: source.id },
        });
        expect(failed.failureCount).toBe(1);
        expect(failed.nextFetchAt.getTime()).toBeGreaterThan(Date.now());
        expect(
          await db.sourceObservation.count({ where: { sourceId: source.id } }),
        ).toBe(0);
      } finally {
        await db.contentSource.delete({ where: { id: source.id } });
        await db.$disconnect();
        vi.restoreAllMocks();
      }
    });
  },
);

