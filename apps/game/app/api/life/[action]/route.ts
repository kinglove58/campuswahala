import { NextRequest, NextResponse } from "next/server";
import { forward } from "../../forward";
type Context = { params: Promise<{ action: string }> };
async function route(request: NextRequest, context: Context) {
  const { action } = await context.params;
  if (
    !(
      (action === "state" && request.method === "GET") ||
      (action === "commands" && request.method === "POST")
    )
  )
    return NextResponse.json(
      { error: { code: "NOT_FOUND" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  return forward(request, request.method as "GET" | "POST", {
    path: `/v1/life/${action}`,
  });
}
export const GET = route;
export const POST = route;
