import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isIP } from "node:net";
import {
  localTrustKey,
  pseudonym,
  readClientCookie,
  signedClientCookie,
  signContext,
  verifyContext,
  ReplayGuard,
} from "@campuswahala/security";
const ingressReplay = new ReplayGuard();
const cookieName = "cw_guest";
const apiOrigin = process.env.API_INTERNAL_URL ?? "http://127.0.0.1:4000";
const expectedOrigin = process.env.GAME_ORIGIN ?? "http://localhost:3001";
const secure =
  process.env.APP_ENV !== undefined && process.env.APP_ENV !== "local";
function fail(code: string, status: number) {
  return NextResponse.json(
    { error: { code } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}
async function forward(
  request: NextRequest,
  method: "GET" | "POST" | "DELETE",
) {
  if (method !== "GET" && request.headers.get("origin") !== expectedOrigin)
    return fail("ORIGIN_REJECTED", 403);
  let body: string | undefined;
  if (method === "POST") {
    if (
      request.headers.get("content-type")?.split(";")[0] !== "application/json"
    )
      return fail("JSON_REQUIRED", 415);
    // Bound stream reads even when Content-Length is absent or dishonest.
    const reader = request.body?.getReader();
    if (!reader) return fail("INVALID_INPUT", 400);
    const chunks: Uint8Array[] = [];
    let length = 0;
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > 8192) {
        await reader.cancel();
        return fail("BODY_TOO_LARGE", 413);
      }
      chunks.push(chunk.value);
    }
    body = Buffer.concat(chunks).toString("utf8");
  }
  if (process.env.NODE_ENV === "production" && !process.env.APP_ENV)
    return fail("APP_ENV_REQUIRED", 503);
  const local = !process.env.APP_ENV || process.env.APP_ENV === "local";
  const key =
    process.env.BFF_SERVICE_SECRET ?? (local ? localTrustKey : undefined);
  const networkKey =
    process.env.NETWORK_HMAC_SECRET ?? (local ? localTrustKey : undefined);
  const edgeKey = process.env.EDGE_SERVICE_SECRET;
  if (
    !key ||
    !networkKey ||
    (!local &&
      (key.length < 32 ||
        networkKey.length < 32 ||
        !process.env.GAME_ORIGIN ||
        !process.env.API_INTERNAL_URL ||
        !edgeKey ||
        edgeKey.length < 32 ||
        key === localTrustKey ||
        networkKey === localTrustKey ||
        edgeKey === localTrustKey ||
        key === networkKey ||
        key === edgeKey ||
        networkKey === edgeKey))
  )
    return fail("TRUST_CONFIGURATION_REQUIRED", 503);
  const edge =
    !local && edgeKey
      ? verifyContext(
          request.headers.get("x-cw-edge-context"),
          method,
          "/api/guest",
          body ?? "",
          edgeKey,
        )
      : null;
  if (
    !local &&
    (!edge || !isIP(edge.network) || !ingressReplay.accept(edge.nonce))
  )
    return fail("INGRESS_TRUST_REJECTED", 403);
  const client =
    readClientCookie(request.cookies.get("cw_client")?.value, key) ??
    randomBytes(24).toString("base64url");
  const network = pseudonym(edge ? edge.network : "local-loopback", networkKey);
  const token = request.cookies.get(cookieName)?.value;
  const upstreamPath = `/v1/guests${method === "POST" ? "" : "/me"}`;
  const contextHeader = signContext(
    { client, network },
    method,
    upstreamPath,
    `${body ?? ""}\n${token ?? ""}`,
    key,
  );
  const withClientCookie = (response: NextResponse) => {
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set("cw_client", signedClientCookie(client, key), {
      httpOnly: true,
      sameSite: "strict",
      secure,
      path: "/",
      maxAge: 86400,
    });
    return response;
  };
  if (method !== "POST" && !token) return fail("NO_GUEST_SESSION", 401);
  try {
    const upstream = await fetch(`${apiOrigin}${upstreamPath}`, {
      method,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
      headers: {
        "X-CW-Context": contextHeader,
        "Content-Type": "application/json",
        Origin: expectedOrigin,
        ...(token ? { "X-Guest-Token": token } : {}),
      },
    });
    if (method === "DELETE" && upstream.ok) {
      const response = NextResponse.json({ revoked: true });
      response.cookies.delete(cookieName);
      return withClientCookie(response);
    }
    const data = await upstream.json();
    if (!upstream.ok)
      return withClientCookie(
        fail(data.error?.code ?? "API_ERROR", upstream.status),
      );
    const response = NextResponse.json(method === "POST" ? data.player : data, {
      headers: { "Cache-Control": "no-store" },
    });
    if (method === "POST")
      response.cookies.set(cookieName, data.token, {
        httpOnly: true,
        sameSite: "strict",
        secure,
        path: "/",
        maxAge: 86400,
      });
    return withClientCookie(response);
  } catch {
    return fail("API_UNAVAILABLE", 503);
  }
}
export const GET = (r: NextRequest) => forward(r, "GET");
export const POST = (r: NextRequest) => forward(r, "POST");
export const DELETE = (r: NextRequest) => forward(r, "DELETE");
