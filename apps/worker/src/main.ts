import "reflect-metadata";
import { Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { log } from "@campuswahala/observability";
export interface QueueAdapter {
  receive(): Promise<{ id: string; type: string } | null>;
}
@Module({})
class WorkerModule {}
async function main() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: false,
  });
  const heartbeat = setInterval(
    () => log({ service: "worker", event: "idle_no_queue_configured" }),
    60000,
  );
  const close = async () => {
    clearInterval(heartbeat);
    await app.close();
  };
  process.once("SIGINT", () => {
    void close();
  });
  process.once("SIGTERM", () => {
    void close();
  });
  log({ service: "worker", event: "scaffold_ready_no_jobs_processed" });
}
void main();
