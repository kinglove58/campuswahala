import {
  catalogueQuerySchema as schema,
  catalogueCursorSchema,
  type CatalogueFilters,
} from "@campuswahala/campus-content";
import { BadRequestException } from "@nestjs/common";

export function parseCatalogueQuery(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new BadRequestException("INVALID_CATALOGUE_FILTER");
  const q = parsed.data;
  let after: string | undefined;
  if (q.cursor) {
    try {
      if (!/^[A-Za-z0-9_-]+$/.test(q.cursor)) throw Error();
      const c = catalogueCursorSchema.parse(
        JSON.parse(Buffer.from(q.cursor, "base64url").toString()),
      );
      if (c.scope !== scope(q)) throw Error();
      after = c.after;
    } catch {
      throw new BadRequestException("INVALID_CATALOGUE_CURSOR");
    }
  }
  return { ...q, after };
}
function scope(q: CatalogueFilters) {
  return JSON.stringify([
    q.campus ?? null,
    q.category ?? null,
    q.subjectType ?? null,
  ]);
}
export function catalogueCursor(q: CatalogueFilters, after: string) {
  return Buffer.from(JSON.stringify({ v: 1, after, scope: scope(q) })).toString(
    "base64url",
  );
}
