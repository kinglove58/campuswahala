import { z } from "zod";
import { registeredPacks } from "./registry";
const packSchema = z
  .object({
    schemaVersion: z.literal(1),
    id: z
      .string()
      .min(2)
      .max(20)
      .regex(/^[a-z][a-z0-9-]*$/),
    name: z.string(),
    shortName: z.string(),
    town: z.string(),
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    contentStatus: z.literal("unverified_fixture"),
    programmes: z
      .array(
        z
          .object({
            id: z.string(),
            title: z.string(),
            typicalDuration: z.number().int().min(1).max(12),
            levels: z.array(z.number().int().positive()),
          })
          .strict(),
      )
      .min(1),
    locations: z.array(
      z
        .object({
          id: z.string(),
          kind: z.string(),
          label: z.string(),
          x: z.number().min(60).max(900),
          y: z.number().min(60).max(580),
          description: z.string(),
        })
        .strict(),
    ),
    routes: z.array(z.unknown()),
    transport: z.array(z.unknown()),
    hostels: z.array(z.unknown()),
    slang: z.array(z.unknown()),
    events: z.array(z.unknown()),
    quests: z.array(z.unknown()),
    businesses: z.array(z.unknown()),
    activityTemplates: z.array(z.unknown()),
    provenance: z.array(
      z
        .object({
          reference: z.string(),
          category: z.string(),
          status: z.string(),
        })
        .strict(),
    ),
  })
  .strict();
export type CampusPack = z.infer<typeof packSchema>;
export const campuses: CampusPack[] = registeredPacks.map((p) =>
  packSchema.parse(p),
);
export function getCampus(id: string): CampusPack | undefined {
  return campuses.find((p) => p.id === id);
}
export function validProgramme(campus: string, programme: string): boolean {
  return !!getCampus(campus)?.programmes.some((p) => p.id === programme);
}
