import { NextRequest } from "next/server";
import { forward } from "../forward";
export const GET = (r: NextRequest) => forward(r, "GET");
export const POST = (r: NextRequest) => forward(r, "POST");
export const DELETE = (r: NextRequest) => forward(r, "DELETE");
