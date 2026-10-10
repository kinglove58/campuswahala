import { z } from "zod";
export const sourceAuthority = z.enum([
  "official",
  "institutional",
  "reputable",
  "community",
  "generated_fixture",
]);
export const processingState = z.enum([
  "DISCOVERED",
  "FETCHED",
  "EXTRACTED",
  "NORMALIZED",
  "CORROBORATED",
  "POLICY_CHECKED",
  "PUBLISHED",
  "STALE",
  "REJECTED",
]);
export const sourcePolicyStatus = z.enum([
  "pending",
  "permitted_public",
  "rejected",
]);
export const publicationResult = z.enum(["ALLOW", "HOLD", "REJECT", "STALE"]);
export const factCategory = z.enum([
  "university",
  "faculty",
  "department",
  "programme",
  "academic_structure",
  "location",
  "building",
  "hostel",
  "cultural",
  "route",
  "transport",
  "business",
  "critical",
  "event",
]);
/** Critical subject properties retain their subject identity but use the strict critical publication category. */
export const isCriticalProperty = (key: string) =>
  /(?:emergency|security[_ .-]?contact|health[_ .-]?contact|medical[_ .-]?contact|(?:official[_ .-]?)?fees?|deadline)/i.test(
    key.replace(/([a-z])([A-Z])/g, "$1_$2"),
  );
export const candidateSchema = z
  .object({
    entityType: z.enum([
      "university",
      "campus",
      "faculty",
      "department",
      "programme",
      "structure",
      "location",
      "building",
      "hostel",
      "route",
      "transport",
      "cultural",
      "business",
      "event",
      "critical",
    ]),
    subjectKey: z.string().min(1).max(160),
    propertyKey: z.string().min(1).max(120),
    key: z.string().min(1).max(120),
    value: z.string().min(1).max(500),
    category: factCategory,
    confidence: z.number().min(0).max(1),
    locator: z.string().min(1).max(500),
    excerpt: z.string().max(240),
    expiresAt: z.string().datetime().optional(),
  })
  .strict()
  .superRefine((candidate, context) => {
    const expected =
      candidate.entityType === "campus"
        ? "university"
        : candidate.entityType === "structure"
          ? "academic_structure"
          : candidate.entityType;
    if (
      isCriticalProperty(candidate.propertyKey) &&
      candidate.category !== "critical"
    )
      context.addIssue({
        code: "custom",
        path: ["category"],
        message: "CRITICAL_PROPERTY_REQUIRES_CRITICAL_POLICY",
      });
    if (candidate.category !== expected && candidate.category !== "critical")
      context.addIssue({
        code: "custom",
        path: ["category"],
        message: "CATEGORY_ENTITY_MISMATCH",
      });
  });
export type FactCandidate = z.infer<typeof candidateSchema>;
export interface PolicyEvidence {
  authority:
    | "official"
    | "institutional"
    | "reputable"
    | "community"
    | "generated_fixture";
  independentGroup: string;
  contentHash?: string;
  confidence: number;
  observedAt: Date;
  generated: boolean;
}
export interface PolicyInput {
  category: z.infer<typeof factCategory>;
  evidence: PolicyEvidence[];
  contradiction: boolean;
  now: Date;
  expiresAt?: Date;
}
export const policyDefaults = {
  version: "2026-10-10.2",
  confidence: 0.85,
  ttlDays: {
    university: 365,
    faculty: 180,
    department: 180,
    programme: 180,
    academic_structure: 90,
    location: 180,
    building: 180,
    hostel: 90,
    cultural: 180,
    route: 14,
    transport: 7,
    business: 30,
    critical: 7,
    event: 1,
  },
};
export class PublicationPolicyService {
  constructor(readonly settings = policyDefaults) {}
  decide(input: PolicyInput): {
    result: "ALLOW" | "HOLD" | "REJECT" | "STALE";
    reasons: string[];
    staleAt: Date;
    policyVersion: string;
  } {
    const ttl = this.settings.ttlDays[input.category] * 86400000;
    const genuine = input.evidence.filter(
      (e) =>
        sourceAuthority.safeParse(e.authority).success &&
        !e.generated &&
        e.authority !== "generated_fixture" &&
        e.independentGroup.trim() &&
        e.confidence >= this.settings.confidence &&
        e.observedAt.getTime() <= input.now.getTime(),
    );
    const fresh = genuine.filter(
      (e) => input.now.getTime() - e.observedAt.getTime() < ttl,
    );
    const newest = genuine.reduce(
      (time, e) => Math.max(time, e.observedAt.getTime()),
      0,
    );
    const staleAt = new Date(
      Math.min(newest + ttl, input.expiresAt?.getTime() ?? Infinity),
    );
    const answer = (
      result: "ALLOW" | "HOLD" | "REJECT" | "STALE",
      reason: string,
    ) => ({
      result,
      reasons: [reason],
      staleAt,
      policyVersion: this.settings.version,
    });
    if (!factCategory.safeParse(input.category).success)
      return answer("REJECT", "UNSUPPORTED_CATEGORY");
    if (
      input.evidence.some(
        (e) => !sourceAuthority.safeParse(e.authority).success,
      )
    )
      return answer("REJECT", "UNKNOWN_SOURCE_AUTHORITY");
    if (
      input.category === "critical" &&
      !fresh.some((e) => e.authority === "official")
    )
      return answer("HOLD", "OFFICIAL_SOURCE_REQUIRED");
    if (input.contradiction) return answer("HOLD", "UNRESOLVED_CONTRADICTION");
    if (
      (input.expiresAt && input.expiresAt <= input.now) ||
      (genuine.length > 0 && fresh.length === 0)
    )
      return answer("STALE", "EVIDENCE_EXPIRED");
    const official = fresh.some((e) =>
      ["official", "institutional"].includes(e.authority),
    );
    if (
      [
        "university",
        "faculty",
        "department",
        "programme",
        "academic_structure",
        "critical",
      ].includes(input.category)
    )
      return official
        ? answer("ALLOW", "FRESH_AUTHORITATIVE_SOURCE")
        : answer("HOLD", "OFFICIAL_SOURCE_REQUIRED");
    const eligible =
      input.category === "cultural"
        ? fresh
        : fresh.filter((e) =>
            ["official", "institutional", "reputable"].includes(e.authority),
          );
    // Union editorial groups and identical page hashes. Copies cannot become independent by changing domains.
    const roots = eligible.map((_e, i) => i);
    const root = (i: number): number => (roots[i] === i ? i : root(roots[i]!));
    for (let i = 0; i < eligible.length; i++)
      for (let j = 0; j < i; j++)
        if (
          eligible[i]!.independentGroup === eligible[j]!.independentGroup ||
          (eligible[i]!.contentHash &&
            eligible[i]!.contentHash === eligible[j]!.contentHash)
        )
          roots[root(i)] = root(j);
    const groups = new Set(eligible.map((_e, i) => root(i)));
    if (input.category !== "cultural" && official)
      return answer("ALLOW", "FRESH_AUTHORITATIVE_SOURCE");
    return groups.size >= 2
      ? answer("ALLOW", "INDEPENDENT_CORROBORATION")
      : answer("HOLD", "INSUFFICIENT_INDEPENDENT_EVIDENCE");
  }
}
export function normalizedName(name: string) {
  return name
    .normalize("NFKC")
    .toLocaleLowerCase("en")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function matchEntity(
  name: string,
  entities: Array<{ id: string; name: string; aliases: string[] }>,
): { id: string | null; reason: string } {
  const key = normalizedName(name);
  const matches = entities.filter((e) =>
    [e.name, ...e.aliases].some((alias) => normalizedName(alias) === key),
  );
  return matches.length === 1
    ? { id: matches[0]!.id, reason: "EXACT_NAME_OR_ALIAS" }
    : {
        id: null,
        reason: matches.length ? "AMBIGUOUS_HOLD" : "NO_CONFIDENT_MATCH",
      };
}
