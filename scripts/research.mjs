import { setTimeout as delay } from "node:timers/promises";
import { mkdir, writeFile } from "node:fs/promises";
import { PrismaClient } from "../packages/database/dist/index.js";
import { CampusIntelligencePipeline } from "../apps/worker/dist/intelligence.js";
if (
  process.env.APP_ENV !== "local" ||
  process.env.INTELLIGENCE_ENABLED !== "true" ||
  !process.env.DATABASE_URL
)
  throw new Error("EXPLICIT_LOCAL_RESEARCH_CONFIGURATION_REQUIRED");
const db = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});
try {
  const pipeline = new CampusIntelligencePipeline(db);
  await pipeline.discover();
  const metrics = await pipeline.runDue(100);
  // The normal pipeline schedules page retrieval one minute after robots checks.
  // A second bounded tick is opt-in for isolated research; no pacing override.
  if (process.env.RESEARCH_SECOND_TICK === "true") {
    await delay(61000);
    Object.assign(metrics, await pipeline.runDue(100));
  }
  const sources = await db.contentSource.findMany({
    where: { discoveryMethod: "curated_official_registry" },
    select: {
      url: true,
      status: true,
      robotsPolicy: true,
      lastFetchedAt: true,
      nextFetchAt: true,
      contentHash: true,
      lastErrorCode: true,
    },
  });
  const facts = await db.campusFact.findMany({
    where: { status: "published", staleAt: { gt: new Date() } },
    select: {
      campus: { select: { slug: true } },
      key: true,
      status: true,
      staleAt: true,
      currentVersion: {
        select: {
          value: true,
          lastObservedAt: true,
          category: true,
          evidence: {
            select: {
              evidence: {
                select: {
                  observation: {
                    select: {
                      source: { select: { url: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  const report = JSON.stringify(
    {
      observedAt: new Date().toISOString(),
      note: "Isolated research. Only published, non-stale facts shown. No deployment or production database writes.",
      metrics,
      sources,
      facts,
    },
    null,
    2,
  );
  console.log(report);
  if (process.env.RESEARCH_REPORT === "true") {
    await mkdir("artifacts", { recursive: true });
    await writeFile("artifacts/campus-research.json", report + "\n");
  }
} finally {
  await db.$disconnect();
}
