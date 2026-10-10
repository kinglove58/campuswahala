import { z } from "zod";
import { factCategory } from "./publication";
export const catalogueFilters = z.object({ campus: z.enum(["futa", "oau", "unilag"]).optional(), category: factCategory.optional(), subjectType: z.enum(["university", "campus", "faculty", "department", "programme", "structure", "location", "building", "hostel", "route", "transport", "cultural", "business", "event", "critical"]).optional() });
export const catalogueQuerySchema = catalogueFilters.extend({ limit: z.coerce.number().int().min(1).max(100).default(40), cursor: z.string().min(1).max(1024).optional() }).strict();

export const catalogueCursorSchema = z.object({ v: z.literal(1), after: z.string().uuid(), scope: z.string() }).strict();
export type CatalogueFilters = z.infer<typeof catalogueFilters>;
