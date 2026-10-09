import { createHmac, randomBytes } from "node:crypto";
export interface Principal {
  subject: string;
  roles: readonly string[];
}
export interface IdentityProvider {
  verifyAccessToken(token: string): Promise<Principal>;
}
export class DisabledIdentityProvider implements IdentityProvider {
  async verifyAccessToken(): Promise<Principal> {
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
