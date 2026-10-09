import { NextRequest, NextResponse } from "next/server";
import { isCampus } from "@campuswahala/game-engine";
import { forward } from "../../../forward";
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ campus: string; resource: string[] }> },
) {
  const { campus, resource } = await context.params;
  if (
    !isCampus(campus) ||
    !(
      ["latest", "information"].includes(resource.join("/")) ||
      resource.join("/") === "versions/1"
    )
  )
    return NextResponse.json(
      { error: { code: "WORLD_NOT_FOUND" } },
      { status: 404 },
    );
  return forward(request, "GET", {
    path: `/v1/worlds/${campus}/${resource.join("/")}`,
    publicWorld: true,
  });
}
