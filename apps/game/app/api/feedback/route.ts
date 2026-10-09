import { NextRequest } from "next/server";
import { forward } from "../forward";
export const POST = (r: NextRequest) =>
  forward(r, "POST", { path: "/v1/feedback" });
