import {
  createHash,
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";
export const localTrustKey = "local-only-campuswahala-bff-development-key";
export interface RequestContext {
  client: string;
  network: string;
}
export function pseudonym(
  value: string,
  key: string,
  day = new Date().toISOString().slice(0, 10),
): string {
  return createHmac("sha256", key)
    .update(`network:${day}:${value}`)
    .digest("hex");
}
const digest = (body: string) =>
  createHash("sha256").update(body).digest("hex");
export function signContext(
  context: RequestContext,
  method: string,
  path: string,
  body: string,
  key: string,
  now = Date.now(),
): string {
  const payload = Buffer.from(
    JSON.stringify({
      ...context,
      version: 1,
      method,
      path,
      body: digest(body),
      at: now,
      nonce: randomUUID(),
    }),
  ).toString("base64url");
  return `${payload}.${createHmac("sha256", key).update(payload).digest("hex")}`;
}
export function verifyContext(
  header: unknown,
  method: string,
  path: string,
  body: string,
  key: string,
  now = Date.now(),
): (RequestContext & { nonce: string; at: number }) | null {
  if (typeof header !== "string" || header.length > 2048) return null;
  const [payload, mac, extra] = header.split(".");
  if (extra || !payload || !mac || !/^[0-9a-f]{64}$/.test(mac)) return null;
  const expected = createHmac("sha256", key).update(payload).digest();
  if (!timingSafeEqual(expected, Buffer.from(mac, "hex"))) return null;
  try {
    const v = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (
      v.version !== 1 ||
      v.method !== method ||
      v.path !== path ||
      v.body !== digest(body) ||
      !Number.isSafeInteger(v.at) ||
      // Strict boundary keeps the full acceptance window shorter than nonce retention.
      Math.abs(now - v.at) >= 30000 ||
      typeof v.client !== "string" ||
      !/^[a-zA-Z0-9_-]{16,128}$/.test(v.client) ||
      typeof v.network !== "string" ||
      !v.network.length ||
      v.network.length > 128 ||
      !/^[a-f0-9-]{36}$/.test(v.nonce)
    )
      return null;
    return { client: v.client, network: v.network, nonce: v.nonce, at: v.at };
  } catch {
    return null;
  }
}
export function signedClientCookie(id: string, key: string): string {
  return `${id}.${createHmac("sha256", key).update(`client:${id}`).digest("hex")}`;
}
export function readClientCookie(
  value: string | undefined,
  key: string,
): string | null {
  if (!value || value.length > 200) return null;
  const [id] = value.split(".");
  if (!id || !/^[a-zA-Z0-9_-]{32}$/.test(id)) return null;
  const expected = Buffer.from(signedClientCookie(id, key));
  const actual = Buffer.from(value);
  return expected.length === actual.length && timingSafeEqual(expected, actual)
    ? id
    : null;
}
// Bounded, transient replay protection. Production replicas require a shared atomic store.
export class ReplayGuard {
  private readonly seen = new Map<string, number>();
  accept(nonce: string, now = Date.now()): boolean {
    for (const [key, expiry] of this.seen)
      if (expiry <= now) this.seen.delete(key);
    if (this.seen.has(nonce) || this.seen.size >= 10000) return false;
    this.seen.set(nonce, now + 60000);
    return true;
  }
}
