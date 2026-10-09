import { readConfig } from "@campuswahala/config";
import { log } from "@campuswahala/observability";
import { createApi } from "./app";
async function main() {
  const config = readConfig(process.env);
  const { app, repository, accounts } = await createApi(config);
  app.enableShutdownHooks();
  const close = async () => {
    await app.close();
    await repository.close();
    await accounts.close();
  };
  process.once("SIGINT", () => {
    void close();
  });
  process.once("SIGTERM", () => {
    void close();
  });
  await app.listen(
    config.API_PORT,
    config.APP_ENV === "local" ? "127.0.0.1" : "0.0.0.0",
  );
  log({ service: "api", event: "started", store: config.PLAYER_STORE });
}
void main().catch(() => {
  console.error("API_STARTUP_FAILED: check environment and dependencies");
  process.exitCode = 1;
});
