import { z } from "zod";
const schema = z.object({
  APP_ENV: z
    .enum(["local", "development", "staging", "production"])
    .default("local"),
  PLAYER_STORE: z.enum(["memory", "postgres"]).default("memory"),
  API_PORT: z.coerce.number().int().min(1024).max(65535).default(4000),
  GAME_ORIGIN: z.string().url().default("http://localhost:3001"),
  DATABASE_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(32).optional(),
});
export type AppConfig = z.infer<typeof schema>;
export function readConfig(env: NodeJS.ProcessEnv): AppConfig {
  if (env.NODE_ENV === "production" && !env.APP_ENV) throw new Error("APP_ENV_REQUIRED_FOR_PRODUCTION_RUNTIME");
  const result = schema.safeParse(env);
  if (!result.success)
    throw new Error(
      `INVALID_ENVIRONMENT:${result.error.issues.map((i) => i.path.join(".")).join(",")}`,
    );
  const c = result.data;
  const origin = new URL(c.GAME_ORIGIN);
  if (origin.origin !== c.GAME_ORIGIN)
    throw new Error("GAME_ORIGIN_MUST_BE_ORIGIN");
  if (c.PLAYER_STORE === "postgres" && (!c.DATABASE_URL || !c.SESSION_SECRET))
    throw new Error("DATABASE_AND_SECRET_REQUIRED");
  if (
    c.APP_ENV !== "local" &&
    (c.PLAYER_STORE !== "postgres" ||
      !c.SESSION_SECRET ||
      origin.protocol !== "https:" ||
      ["localhost", "127.0.0.1"].includes(origin.hostname))
  )
    throw new Error("NONLOCAL_REQUIRES_PERSISTENT_SECURE_CONFIGURATION");
  return c;
}
