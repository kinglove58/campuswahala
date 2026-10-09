import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { log } from "@campuswahala/observability";
import { readWorkerConfig } from "@campuswahala/config";
import { PostgresPlayerRepository, PrismaClient } from "@campuswahala/database";
import { cleanupAccounts } from "./deletion";
import { CampusIntelligencePipeline } from "./intelligence";
import { cleanupGuests } from "./cleanup";
export interface QueueAdapter {
  receive(): Promise<{ id: string; type: string } | null>;
}
@Module({})
class WorkerModule {}
async function main() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: false,
  });
  const config = readWorkerConfig(process.env);
  const repository =
    config.PLAYER_STORE === "postgres"
      ? new PostgresPlayerRepository(config.DATABASE_URL!)
      : null;
  let running: Promise<unknown> | null = null;
  const database = repository
    ? new PrismaClient({ datasources: { db: { url: config.DATABASE_URL! } } })
    : null;
  const intelligence = database
    ? new CampusIntelligencePipeline(database)
    : null;
  const tick = () => {
    if (!repository || running) return;
    running = (async () => {
      await cleanupGuests(repository);
      if (database) await cleanupAccounts(database);
      if (intelligence && process.env.INTELLIGENCE_ENABLED === "true") {
        await intelligence.discover();
        const metrics = await intelligence.runDue();
        log({ service: "worker", event: "intelligence_metrics", ...metrics });
      }
    })()
      .catch(() => log({ service: "worker", event: "guest_cleanup_failed" }))
      .finally(() => {
        running = null;
      });
  };
  tick();
  const heartbeat = setInterval(tick, 60000);
  const close = async () => {
    clearInterval(heartbeat);
    await running;
    await repository?.close();
    await database?.$disconnect();
    await app.close();
  };
  process.once("SIGINT", () => {
    void close();
  });
  process.once("SIGTERM", () => {
    void close();
  });
  log({
    service: "worker",
    event: repository
      ? "worker_ready_guest_cleanup"
      : "idle_memory_no_shared_store",
  });
}
void main();
