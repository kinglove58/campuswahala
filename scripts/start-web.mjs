import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const app = process.argv[2];
const port = process.argv[3];
if (
  !["marketing", "game", "admin"].includes(app) ||
  !port ||
  !/^\d{4,5}$/.test(port)
)
  throw new Error("Usage: start-web.mjs <marketing|game|admin> <port>");
const source = join(root, "apps", app);
const runtime = join(source, ".next", "standalone", "apps", app);
if (!existsSync(join(runtime, "server.js")))
  throw new Error("Build the app before starting it.");
mkdirSync(join(runtime, ".next", "static"), { recursive: true });
cpSync(join(source, ".next", "static"), join(runtime, ".next", "static"), {
  recursive: true,
});
if (existsSync(join(source, "public")))
  cpSync(join(source, "public"), join(runtime, "public"), { recursive: true });
process.env.PORT = port;
process.env.HOSTNAME = "127.0.0.1";
// This helper explicitly runs loopback local production output. Deployed containers bypass it.
process.env.APP_ENV ??= "local";
process.env.NODE_ENV = "production";
await import(pathToFileURL(join(runtime, "server.js")).href);
