import { NextRequest } from "next/server";
import { forward } from "../forward";
export const GET = (r: NextRequest) =>
  forward(r, "GET", { path: "/v1/catalogue/published" });
