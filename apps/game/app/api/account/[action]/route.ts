import { NextRequest, NextResponse } from "next/server";
import { forward } from "../../forward";
type Context = { params: Promise<{ action: string }> };
async function route(request: NextRequest, context: Context) {
  const { action } = await context.params;
  const allowed: Record<string, string[]> = {
    world: ["GET", "POST"],
    begin: ["POST"],
    callback: ["GET"],
    me: ["GET", "DELETE"],
    convert: ["POST"],
    privacy: ["POST"],
    session: ["DELETE"],
  };
  if (!allowed[action]?.includes(request.method))
    return NextResponse.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  return forward(
    request,
    action === "callback"
      ? "POST"
      : (request.method as "GET" | "POST" | "DELETE"),
    { path: `/v1/account/${action}`, callback: action === "callback" },
  );
}
export const GET = route;
export const POST = route;
export const DELETE = route;
