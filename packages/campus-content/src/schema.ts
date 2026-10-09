import { z } from "zod";
const id = z
  .string()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z0-9-]*$/);
const text = z.string().min(1).max(2000);
export const evidenceSchema = z
  .object({
    reference: text,
    sourceId: id,
    authority: z.enum(["official", "institutional", "community", "generated"]),
    retrievedAt: z.string().datetime(),
    lastObservedAt: z.string().datetime(),
    independentGroup: id,
  })
  .strict();
export const metadataSchema = z
  .object({
    status: z.enum([
      "fixture",
      "candidate",
      "published",
      "outdated",
      "rejected",
    ]),
    category: z.enum([
      "university",
      "programme",
      "academic_structure",
      "academic_stage",
      "academic_semester",
      "location",
      "building",
      "route",
      "transport",
      "hostel",
      "cultural",
      "event",
      "quest",
      "business",
      "activity",
      "critical",
    ]),
    authorityClass: z.enum([
      "generated_fixture",
      "cultural",
      "official",
      "critical",
      "gameplay",
    ]),
    confidence: z.number().min(0).max(1),
    aliases: z.array(text).max(30),
    evidence: z.array(evidenceSchema).max(50),
    retrievedAt: z.string().datetime().nullable(),
    lastObservedAt: z.string().datetime().nullable(),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      v.status === "fixture" &&
      (v.confidence !== 0 || v.authorityClass !== "generated_fixture")
    )
      ctx.addIssue({
        code: "custom",
        message: "Fixtures have no verification confidence",
      });
    if (v.status !== "published") return;
    const requiredAuthority =
      v.category === "cultural"
        ? "cultural"
        : v.category === "critical"
          ? "critical"
          : [
                "university",
                "programme",
                "academic_structure",
                "academic_stage",
                "academic_semester",
              ].includes(v.category)
            ? "official"
            : null;
    if (requiredAuthority && v.authorityClass !== requiredAuthority)
      ctx.addIssue({
        code: "custom",
        message: "Category authority policy failed",
      });
    if (
      v.authorityClass === "critical" &&
      !v.evidence.some((e) => e.authority === "official")
    )
      ctx.addIssue({
        code: "custom",
        message: "Critical sources must be official",
      });
    const official = v.evidence.some(
      (e) => e.authority === "official" || e.authority === "institutional",
    );
    const corroborated =
      new Set(
        v.evidence
          .filter((e) => e.authority !== "generated")
          .map((e) => e.independentGroup),
      ).size >= 2;
    if (
      v.authorityClass === "generated_fixture" ||
      !v.retrievedAt ||
      !v.lastObservedAt ||
      !v.evidence.length ||
      ((v.authorityClass === "official" || v.authorityClass === "critical") &&
        !official) ||
      (v.authorityClass === "cultural" && (!corroborated || v.confidence < 0.8))
    )
      ctx.addIssue({
        code: "custom",
        message: "Publication source policy failed",
      });
  });
const base = { id, metadata: metadataSchema };
export const stageSchema = z
  .object({
    ...base,
    code: z.number().int().min(1).max(9999),
    label: text,
    order: z.number().int().nonnegative(),
    entryModes: z
      .array(z.enum(["standard", "direct_entry", "transfer"]))
      .min(1),
    activityTags: z.array(id),
    semesters: z.array(z.object({ ...base, label: text }).strict()).min(1),
  })
  .strict();
export const programmeStructureSchema = z
  .object({
    ...base,
    version: z.number().int().positive(),
    stages: z.array(stageSchema).min(1),
  })
  .strict();
export const programmeSchema = z
  .object({
    ...base,
    title: text,
    typicalDuration: z.number().int().min(1).max(12),
    levels: z.array(z.number().int().min(1).max(9999)).min(1),
    structure: programmeStructureSchema,
  })
  .strict()
  .superRefine((p, ctx) => {
    const codes = p.structure.stages.map((s) => s.code);
    if (
      new Set(codes).size !== codes.length ||
      new Set(p.structure.stages.map((s) => s.id)).size !== codes.length ||
      new Set(p.structure.stages.map((s) => s.order)).size !== codes.length ||
      JSON.stringify(codes) !== JSON.stringify(p.levels)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Stage IDs/order/codes unique; compatibility levels must match stages",
      });
  });
export const locationSchema = z
  .object({
    ...base,
    kind: text,
    label: text,
    x: z.number().min(60).max(900),
    y: z.number().min(60).max(580),
    description: text,
  })
  .strict();
export const buildingSchema = z
  .object({ ...base, label: text, locationId: id, venueKinds: z.array(id) })
  .strict();
export const routeSchema = z
  .object({
    ...base,
    label: text,
    fromLocationId: id,
    toLocationId: id,
    virtualWaypoints: z
      .array(
        z
          .object({
            x: z.number().min(0).max(960),
            y: z.number().min(0).max(640),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();
export const transportSchema = z
  .object({
    ...base,
    label: text,
    mode: z.enum(["walk", "bus", "shuttle", "bike", "other"]),
    routeIds: z.array(id),
  })
  .strict();
export const hostelSchema = z
  .object({ ...base, label: text, buildingId: id, description: text })
  .strict();
export const culturalFactSchema = z
  .object({ ...base, term: text, meaning: text })
  .strict();
export const eventSchema = z
  .object({
    ...base,
    label: text,
    locationId: id,
    startsAt: z.string().datetime().nullable(),
    description: text,
  })
  .strict();
export const questSchema = z
  .object({
    ...base,
    title: text,
    description: text,
    activityTemplateIds: z.array(id),
  })
  .strict();
export const businessSchema = z
  .object({ ...base, label: text, locationId: id, category: id })
  .strict();
export const activityTemplateSchema = z
  .object({
    ...base,
    label: text,
    kind: z.enum(["study", "social", "work", "rest", "siwes", "explore"]),
    stageIds: z.array(id),
    locationIds: z.array(id),
  })
  .strict();
export const packSchema = z
  .object({
    schemaVersion: z.literal(2),
    ...base,
    name: text,
    shortName: text,
    town: text,
    color: z.string().regex(/^#[0-9a-f]{6}$/i),
    contentStatus: z.enum(["unverified_fixture", "mixed_content"]),
    programmes: z.array(programmeSchema).min(1),
    locations: z.array(locationSchema),
    buildings: z.array(buildingSchema),
    routes: z.array(routeSchema),
    transport: z.array(transportSchema),
    hostels: z.array(hostelSchema),
    slang: z.array(culturalFactSchema),
    events: z.array(eventSchema),
    quests: z.array(questSchema),
    businesses: z.array(businessSchema),
    activityTemplates: z.array(activityTemplateSchema),
  })
  .strict()
  .superRefine((p, ctx) => {
    const issue = (message: string) =>
      ctx.addIssue({ code: "custom", message });
    for (const list of [
      p.programmes,
      p.locations,
      p.buildings,
      p.routes,
      p.transport,
      p.hostels,
      p.slang,
      p.events,
      p.quests,
      p.businesses,
      p.activityTemplates,
    ])
      if (new Set(list.map((v) => v.id)).size !== list.length)
        issue("Duplicate entity ID");
    const locations = new Set(p.locations.map((v) => v.id)),
      buildings = new Set(p.buildings.map((v) => v.id)),
      routes = new Set(p.routes.map((v) => v.id)),
      activities = new Set(p.activityTemplates.map((v) => v.id)),
      stages = new Set(
        p.programmes.flatMap((v) => v.structure.stages.map((s) => s.id)),
      );
    for (const v of [...p.buildings, ...p.events, ...p.businesses])
      if (!locations.has(v.locationId)) issue("Unknown location reference");
    for (const v of p.routes)
      if (!locations.has(v.fromLocationId) || !locations.has(v.toLocationId))
        issue("Unknown route endpoint");
    for (const v of p.hostels)
      if (!buildings.has(v.buildingId)) issue("Unknown hostel building");
    for (const v of p.transport)
      if (v.routeIds.some((id) => !routes.has(id)))
        issue("Unknown transport route");
    for (const v of p.quests)
      if (v.activityTemplateIds.some((id) => !activities.has(id)))
        issue("Unknown quest activity");
    for (const v of p.activityTemplates)
      if (
        v.locationIds.some((id) => !locations.has(id)) ||
        v.stageIds.some((id) => !stages.has(id))
      )
        issue("Unknown activity reference");
    const metadata = [
      p.metadata,
      ...p.programmes.flatMap((v) => [
        v.metadata,
        v.structure.metadata,
        ...v.structure.stages.flatMap((s) => [
          s.metadata,
          ...s.semesters.map((semester) => semester.metadata),
        ]),
      ]),
      ...[
        p.locations,
        p.buildings,
        p.routes,
        p.transport,
        p.hostels,
        p.slang,
        p.events,
        p.quests,
        p.businesses,
        p.activityTemplates,
      ].flatMap((list) => list.map((v) => v.metadata)),
    ];
    if (
      p.contentStatus === "unverified_fixture" &&
      metadata.some((v) => v.status !== "fixture")
    )
      issue("Preview packs must remain fixtures");
  });
export const previewPackSchema = packSchema.refine(
  (pack) => pack.contentStatus === "unverified_fixture",
  { message: "Preview registry accepts fixtures only" },
);
export type CampusPack = z.infer<typeof packSchema>;
export type ProgrammeStructure = z.infer<typeof programmeStructureSchema>;
export type ProgrammeStage = z.infer<typeof stageSchema>;
export type ContentMetadata = z.infer<typeof metadataSchema>;
