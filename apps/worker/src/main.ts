import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { log } from "@campuswahala/observability";
import { readWorkerConfig } from "@campuswahala/config";
import { PostgresPlayerRepository } from "@campuswahala/database";
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
  const tick = () => {
    if (!repository || running) return;
    running = cleanupGuests(repository)
      .catch(() => log({ service: "worker", event: "guest_cleanup_failed" }))
      .finally(() => {
        running = null;
      });
  };
  tick();
  const heartbeat = setInterval(tick, 15 * 60000);
  const close = async () => {
    clearInterval(heartbeat);
    await running;
    await repository?.close();
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
