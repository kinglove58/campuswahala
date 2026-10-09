import { NextRequest, NextResponse } from "next/server";
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
  const token = request.cookies.get(cookieName)?.value;
  if (method !== "POST" && !token) return fail("NO_GUEST_SESSION", 401);
  try {
    const upstream = await fetch(
      `${apiOrigin}/v1/guests${method === "POST" ? "" : "/me"}`,
      {
        method,
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
        headers: {
          "Content-Type": "application/json",
          Origin: expectedOrigin,
          ...(token ? { "X-Guest-Token": token } : {}),
        },
      },
    );
    if (method === "DELETE" && upstream.ok) {
      const response = NextResponse.json({ revoked: true });
      response.cookies.delete(cookieName);
      return response;
    }
    const data = await upstream.json();
    if (!upstream.ok)
      return fail(data.error?.code ?? "API_ERROR", upstream.status);
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
    return response;
  } catch {
    return fail("API_UNAVAILABLE", 503);
  }
}
export const GET = (r: NextRequest) => forward(r, "GET");
export const POST = (r: NextRequest) => forward(r, "POST");
export const DELETE = (r: NextRequest) => forward(r, "DELETE");
