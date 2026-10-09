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
  const metrics = await pipeline.runDue();
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
      key: true,
      status: true,
      staleAt: true,
      currentVersion: {
        select: { value: true, lastObservedAt: true, category: true },
      },
    },
  });
  console.log(JSON.stringify({ metrics, sources, facts }, null, 2));
} finally {
  await db.$disconnect();
}
