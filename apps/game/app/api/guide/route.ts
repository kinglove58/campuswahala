import { NextRequest, NextResponse } from "next/server";
import { forward } from "../forward";
export const GET = (r: NextRequest) => {
 const q = r.nextUrl.searchParams;
 if ([...q.keys()].some((k) => !["campus", "category", "subjectType", "cursor", "limit"].includes(k) || q.getAll(k).length !== 1))
  return NextResponse.json({ error: { code: "INVALID_CATALOGUE_FILTER" } }, { status: 400, headers: { "Cache-Control": "no-store" } });
 return forward(r, "GET", { path: `/v1/catalogue/published${q.size ? `?${q.toString()}` : ""}` });
};
