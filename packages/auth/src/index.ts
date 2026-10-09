import { createHmac, randomBytes } from "node:crypto";
import type { BrowserIdentityProvider, VerifiedIdentity } from "./identity";
export * from "./identity";
export interface Principal {
  subject: string;
  roles: readonly string[];
}
export class DisabledIdentityProvider implements BrowserIdentityProvider {
  readonly name = "disabled";
  authorizationUrl(): string {
    throw new Error("OIDC_NOT_CONFIGURED");
  }
  async exchange(): Promise<VerifiedIdentity> {
    throw new Error("OIDC_NOT_CONFIGURED");
  }
}
export function issueGuestToken(): string {
  return randomBytes(32).toString("base64url");
}
export function hashGuestToken(token: string, key: string): string {
  return createHmac("sha256", key).update(token).digest("hex");
}
export function validGuestToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}
