import { describe, expect, it } from "vitest";
import {
  candidateSchema,
  isCriticalProperty,
} from "../packages/campus-content/src/publication";
import {
  PublicationPolicyService,
  matchEntity,
  type PolicyEvidence,
} from "../packages/campus-content/src/publication";
const now = new Date("2026-10-09T00:00:00Z");
const policy = new PublicationPolicyService();
const evidence = (
  group: string,
  authority: PolicyEvidence["authority"] = "community",
  ageDays = 0,
): PolicyEvidence => ({
  authority,
  independentGroup: group,
  generated: false,
  confidence: 0.95,
  observedAt: new Date(now.getTime() - ageDays * 86400000),
});
describe("server publication policy", () => {
  it("rejects model category changes that would weaken academic source requirements", () => {
    expect(
      candidateSchema.safeParse({
        entityType: "programme",
        category: "cultural",
        key: "name",
        subjectKey: "programme-one",
        propertyKey: "name",
        value: "Course",
        excerpt: "Course",
        locator: "p",
        confidence: 1,
      }).success,
    ).toBe(false);
  });
  it("holds a single cultural source, allows two independent groups, holds syndicated copies", () => {
    const decide = (rows: PolicyEvidence[]) =>
      policy.decide({
        category: "cultural",
        evidence: rows,
        contradiction: false,
        now,
      }).result;
    expect(decide([evidence("student-a")])).toBe("HOLD");
    expect(decide([evidence("student-a"), evidence("student-b")])).toBe(
      "ALLOW",
    );
    expect(decide([evidence("student-a"), evidence("student-a")])).toBe("HOLD");
    expect(
      decide([
        { ...evidence("a"), contentHash: "same-page" },
        { ...evidence("b"), contentHash: "same-page" },
      ]),
    ).toBe("HOLD");
    expect(
      decide([
        evidence("student-a"),
        { ...evidence("generated"), generated: true },
      ]),
    ).toBe("HOLD");
  });
  it.each([
    "university",
    "faculty",
    "department",
    "programme",
    "academic_structure",
    "critical",
  ] as const)("requires fresh official evidence for %s", (category) => {
    expect(
      policy.decide({
        category,
        evidence: [evidence("official", "official")],
        contradiction: false,
        now,
      }).result,
    ).toBe("ALLOW");
    expect(
      policy.decide({
        category,
        evidence: [evidence("blog-a"), evidence("blog-b")],
        contradiction: false,
        now,
      }).result,
    ).toBe("HOLD");
  });
  it("expires transport and holds conflicting prices instead of overwriting", () => {
    expect(
      policy.decide({
        category: "transport",
        evidence: [evidence("transport-office", "official", 8)],
        contradiction: false,
        now,
      }).result,
    ).toBe("STALE");
    expect(
      policy.decide({
        category: "transport",
        evidence: [evidence("transport-office", "official")],
        contradiction: true,
        now,
      }).reasons,
    ).toEqual(["UNRESOLVED_CONTRADICTION"]);
    expect(
      policy.decide({
        category: "event",
        evidence: [evidence("official", "official")],
        contradiction: false,
        now,
        expiresAt: now,
      }).result,
    ).toBe("STALE");
  });
  it.each(["location", "building", "hostel", "business", "route"] as const)(
    "allows official or independent reputable evidence for %s",
    (category) => {
      const decide = (rows: PolicyEvidence[]) =>
        policy.decide({ category, evidence: rows, contradiction: false, now })
          .result;
      expect(decide([evidence("office", "official")])).toBe("ALLOW");
      expect(
        decide([evidence("a", "reputable"), evidence("b", "reputable")]),
      ).toBe("ALLOW");
      expect(decide([evidence("a"), evidence("b")])).toBe("HOLD");
    },
  );
  it("matches aliases only when unambiguous; never fuzzy-merges", () => {
    expect(
      matchEntity("  GREAT Ife ", [
        {
          id: "oau",
          name: "Obafemi Awolowo University",
          aliases: ["Great Ife"],
        },
      ]).id,
    ).toBe("oau");
    expect(
      matchEntity("Great Ife", [
        { id: "a", name: "Great Ife", aliases: [] },
        { id: "b", name: "Other", aliases: ["Great Ife"] },
      ]).id,
    ).toBeNull();
  });
});

it("fails closed on unknown runtime authority and requires true official critical evidence", () => {
  const unknown = JSON.parse(JSON.stringify(evidence("bad")));
  unknown.authority = "trusted_blog";
  unknown.observedAt = now;
  expect(
    policy.decide({
      category: "cultural",
      evidence: [unknown, evidence("good")],
      contradiction: false,
      now,
    }).result,
  ).toBe("REJECT");
  for (const authority of [
    "institutional",
    "reputable",
    "community",
    "generated_fixture",
  ] as const)
    expect(
      policy.decide({
        category: "critical",
        evidence: [evidence("a", authority), evidence("b", authority)],
        contradiction: false,
        now,
      }).result,
    ).not.toBe("ALLOW");
});

it("critical properties cannot downgrade authority by using a building subject", () => {
  for (const propertyKey of [
    "emergencyContact",
    "security_contact",
    "health-contact",
    "official_fee",
    "application_deadline",
  ]) {
    const candidate = {
      entityType: "building",
      subjectKey: "clinic-one",
      propertyKey,
      key: propertyKey,
      value: "Public information",
      excerpt: "Public information",
      locator: "p",
      confidence: 0.95,
    };
    expect(
      candidateSchema.safeParse({ ...candidate, category: "building" }).success,
    ).toBe(false);
    expect(
      candidateSchema.safeParse({ ...candidate, category: "critical" }).success,
    ).toBe(true);
  }
});

it("ordinary food properties do not become fee claims", () => {
  expect(isCriticalProperty("coffee.name")).toBe(false);
});
