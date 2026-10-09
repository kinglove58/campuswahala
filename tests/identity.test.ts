import { describe, expect, it, vi } from "vitest";
import { generateKeyPairSync, sign } from "node:crypto";
import {
  challenge,
  EntraExternalIdentityProvider,
  LocalIdentityProvider,
} from "../packages/auth/src";
const config = {
  issuer: "https://test.ciamlogin.com/test-tenant/v2.0",
  clientId: "campuswahala-test-client",
  authorizationEndpoint:
    "https://test.ciamlogin.com/test-tenant/oauth2/v2.0/authorize",
  tokenEndpoint: "https://test.ciamlogin.com/test-tenant/oauth2/v2.0/token",
  jwksUri: "https://test.ciamlogin.com/test-tenant/discovery/v2.0/keys",
};
describe("Entra adapter with signed deterministic tokens and mocked endpoints", () => {
  it("uses code/PKCE/state/nonce and rejects unsigned, expired, wrong issuer/audience/nonce tokens", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    const jwk = {
      ...publicKey.export({ format: "jwk" }),
      kid: "test-key",
      use: "sig",
      alg: "RS256",
    };
    const c = challenge("http://localhost:3001/api/account/callback");
    const provider = new EntraExternalIdentityProvider(config);
    const url = new URL(provider.authorizationUrl(c));
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("state")).toBe(c.state);
    expect(url.searchParams.get("nonce")).toBe(c.nonce);
    const now = Math.floor(Date.now() / 1000);
    const claims = {
      iss: config.issuer,
      aud: config.clientId,
      sub: "stable-subject-not-email",
      iat: now,
      exp: now + 300,
      nonce: c.nonce,
    };
    const jwt = (changes: object = {}, alg = "RS256", corrupt = false) => {
      const encoded = `${Buffer.from(JSON.stringify({ alg, kid: "test-key" })).toString("base64url")}.${Buffer.from(JSON.stringify({ ...claims, ...changes })).toString("base64url")}`;
      return `${encoded}.${corrupt ? "fake" : sign("RSA-SHA256", Buffer.from(encoded), privateKey).toString("base64url")}`;
    };
    let token = jwt();
    vi.stubGlobal(
      "fetch",
      async (input: string | URL | Request, init?: RequestInit) => {
        if (String(input) === config.tokenEndpoint) {
          expect(String(init?.body)).toContain(`code_verifier=${c.verifier}`);
          return new Response(JSON.stringify({ id_token: token }), {
            headers: { "Content-Type": "application/json" },
          });
        }
        if (String(input) === config.jwksUri)
          return new Response(JSON.stringify({ keys: [jwk] }), {
            headers: { "Content-Type": "application/json" },
          });
        throw new Error("UNEXPECTED_NETWORK");
      },
    );
    try {
      expect(await provider.exchange("authorization-code", c)).toEqual({
        provider: `entra:${config.issuer}`,
        subject: claims.sub,
      });
      for (const invalid of [
        jwt({ exp: now - 20 }),
        jwt({ iss: "https://attacker.example" }),
        jwt({ aud: "wrong-client" }),
        jwt({ nonce: "wrong-nonce" }),
        jwt({}, "none"),
        jwt({}, "RS256", true),
      ]) {
        token = invalid;
        await expect(
          provider.exchange("authorization-code", c),
        ).rejects.toThrow();
      }
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("fails closed on local identity outside local/test and arbitrary Entra endpoints", () => {
    expect(() => new LocalIdentityProvider("production")).toThrow(
      "LOCAL_IDENTITY_FORBIDDEN",
    );
    expect(
      () =>
        new EntraExternalIdentityProvider({
          ...config,
          jwksUri: "http://169.254.169.254/metadata",
        }),
    ).toThrow("ENTRA_ENDPOINT_REJECTED");
  });
});
