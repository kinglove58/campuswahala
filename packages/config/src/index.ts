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
  BFF_SERVICE_SECRET: z.string().min(32).optional(),
  NETWORK_HMAC_SECRET: z.string().min(32).optional(),
});
export type AppConfig = z.infer<typeof schema>;
export function readConfig(env: NodeJS.ProcessEnv): AppConfig {
  if (env.NODE_ENV === "production" && !env.APP_ENV)
    throw new Error("APP_ENV_REQUIRED_FOR_PRODUCTION_RUNTIME");
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
  if (
    c.APP_ENV !== "local" &&
    (!c.BFF_SERVICE_SECRET ||
      c.BFF_SERVICE_SECRET === c.SESSION_SECRET ||
      c.NETWORK_HMAC_SECRET === c.BFF_SERVICE_SECRET ||
      c.NETWORK_HMAC_SECRET === c.SESSION_SECRET)
  )
    throw new Error("INDEPENDENT_TRUST_KEYS_REQUIRED");
  if (
    c.APP_ENV !== "local" &&
    [c.SESSION_SECRET, c.BFF_SERVICE_SECRET, c.NETWORK_HMAC_SECRET].some(
      (key) => key?.startsWith("local-only-"),
    )
  )
    throw new Error("LOCAL_KEYS_FORBIDDEN_NONLOCAL");
  return c;
}
export function readWorkerConfig(env: NodeJS.ProcessEnv) {
  if (env.NODE_ENV === "production" && !env.APP_ENV)
    throw new Error("APP_ENV_REQUIRED_FOR_PRODUCTION_RUNTIME");
  const result = schema
    .pick({ APP_ENV: true, PLAYER_STORE: true, DATABASE_URL: true })
    .safeParse(env);
  if (!result.success)
    throw new Error(
      `INVALID_WORKER_ENVIRONMENT:${result.error.issues.map((issue) => issue.path.join(".")).join(",")}`,
    );
  const config = result.data;
  if (config.PLAYER_STORE === "postgres" && !config.DATABASE_URL)
    throw new Error("WORKER_DATABASE_REQUIRED");
  if (config.APP_ENV !== "local" && config.PLAYER_STORE !== "postgres")
    throw new Error("WORKER_REQUIRES_PERSISTENCE");
  return config;
}
