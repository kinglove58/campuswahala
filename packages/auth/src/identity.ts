import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export interface VerifiedIdentity {
  provider: string;
  subject: string;
}
export interface LoginChallenge {
  state: string;
  nonce: string;
  verifier: string;
  redirectUri: string;
}
export interface BrowserIdentityProvider {
  readonly name: string;
  authorizationUrl(challenge: LoginChallenge): string;
  exchange(code: string, challenge: LoginChallenge): Promise<VerifiedIdentity>;
}
export type IdentityProvider = BrowserIdentityProvider;
export function challenge(redirectUri: string): LoginChallenge {
  return {
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    redirectUri,
  };
}
export function equalSecret(a: string, b: string): boolean {
  const left = Buffer.from(a),
    right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
/** Explicit local fixture identity; impossible to enable outside local/test. */
export class LocalIdentityProvider implements BrowserIdentityProvider {
  readonly name = "local-development";
  constructor(
    environment: string,
    private readonly subject = "local-explorer",
  ) {
    if (!["local", "test"].includes(environment))
      throw new Error("LOCAL_IDENTITY_FORBIDDEN");
  }
  authorizationUrl(c: LoginChallenge) {
    const url = new URL(c.redirectUri);
    url.searchParams.set("state", c.state);
    url.searchParams.set("code", "local-demo-code");
    return url.href;
  }
  async exchange(code: string): Promise<VerifiedIdentity> {
    if (!equalSecret(code, "local-demo-code"))
      throw new Error("INVALID_LOCAL_CODE");
    return { provider: this.name, subject: this.subject };
  }
}
export interface EntraConfiguration {
  issuer: string;
  clientId: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  jwksUri: string;
  clientSecret?: string;
}
/** Endpoints are deployment configuration, never caller supplied; no tenant is provisioned. */
export class EntraExternalIdentityProvider implements BrowserIdentityProvider {
  readonly name: string;
  constructor(private readonly config: EntraConfiguration) {
    const issuer = new URL(config.issuer);
    if (
      issuer.protocol !== "https:" ||
      !issuer.hostname.endsWith(".ciamlogin.com") ||
      issuer.username ||
      issuer.password
    )
      throw new Error("ENTRA_ISSUER_REQUIRED");
    for (const endpoint of [
      config.authorizationEndpoint,
      config.tokenEndpoint,
      config.jwksUri,
    ]) {
      const url = new URL(endpoint);
      if (
        url.protocol !== "https:" ||
        url.hostname !== issuer.hostname ||
        url.username ||
        url.password
      )
        throw new Error("ENTRA_ENDPOINT_REJECTED");
    }
    this.name = `entra:${config.issuer}`;
  }
  authorizationUrl(c: LoginChallenge) {
    const url = new URL(this.config.authorizationEndpoint);
    url.search = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: c.redirectUri,
      response_type: "code",
      response_mode: "query",
      scope: "openid profile",
      state: c.state,
      nonce: c.nonce,
      code_challenge: createHash("sha256")
        .update(c.verifier)
        .digest("base64url"),
      code_challenge_method: "S256",
    }).toString();
    return url.href;
  }
  async exchange(code: string, c: LoginChallenge): Promise<VerifiedIdentity> {
    if (!code || code.length > 4096) throw new Error("INVALID_CODE");
    const response = await fetch(this.config.tokenEndpoint, {
      method: "POST",
      redirect: "error",
      signal: AbortSignal.timeout(10000),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: this.config.clientId,
        redirect_uri: c.redirectUri,
        code_verifier: c.verifier,
        ...(this.config.clientSecret ? { client_secret: this.config.clientSecret } : {}),
      }),
    });
    if (!response.ok) throw new Error("TOKEN_EXCHANGE_FAILED");
    const tokens = (await response.json()) as { id_token?: string };
    if (!tokens.id_token) throw new Error("ID_TOKEN_REQUIRED");
    const { createRemoteJWKSet, jwtVerify } = await import("jose");
    const { payload } = await jwtVerify(
      tokens.id_token,
      createRemoteJWKSet(new URL(this.config.jwksUri), {
        timeoutDuration: 5000,
      }),
      {
        issuer: this.config.issuer,
        audience: this.config.clientId,
        algorithms: ["RS256"],
        requiredClaims: ["sub", "exp", "iat", "nonce"],
        maxTokenAge: "10m",
        clockTolerance: 5,
      },
    );
    if (
      !payload.sub ||
      typeof payload.nonce !== "string" ||
      !equalSecret(payload.nonce, c.nonce) ||
      (payload.azp !== undefined && payload.azp !== this.config.clientId)
    )
      throw new Error("IDENTITY_CLAIMS_REJECTED");
    return { provider: this.name, subject: payload.sub };
  }
}
