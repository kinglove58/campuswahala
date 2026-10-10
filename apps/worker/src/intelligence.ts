import { sourceAdapter } from "./adapters";
import { landmarkResearch, extractLandmarks } from "./landmarks";
import { createHash } from "node:crypto";
import { PrismaClient, Prisma } from "@campuswahala/database";
import {
  candidateSchema,
  sourceAuthority,
  processingState,
  sourcePolicyStatus,
  matchEntity,
  factCategory,
  normalizedName,
  PublicationPolicyService,
  type FactCandidate,
  type PolicyEvidence,
} from "@campuswahala/campus-content";
import { SafeFetcher, robotsAllow } from "./safe-fetch";
export interface CampusFactExtractor {
  readonly version: string;
  extract(page: {
    body: string;
    sourceUrl: string;
    expectedUniversityName: string;
  }): Promise<FactCandidate[]>;
}
export function groundedConfidence(
  candidate: FactCandidate,
  rawBody: string,
): number {
  const visible = rawBody
    .replace(new RegExp("<!--[\\s\\S]*?-->", "g"), " ")
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  const quote = normalizedName(candidate.excerpt),
    value = normalizedName(candidate.value);
  const supported =
    !!quote &&
    !!value &&
    ` ${normalizedName(visible)} `.includes(` ${quote} `) &&
    ` ${quote} `.includes(` ${value} `);
  return supported ? Math.min(candidate.confidence, 0.95) : 0;
}
/** Small evidence-preserving adapter. Other providers must satisfy the same strict candidate contract. */
export class OfficialNameExtractor implements CampusFactExtractor {
  readonly version = "subject-name-and-landmarks/5";
  async extract(page: {
    body: string;
    sourceUrl: string;
    expectedUniversityName: string;
  }): Promise<FactCandidate[]> {
    let body = page.body;
    let locator = "visible-text:university-name";
    if (body.trimStart().startsWith("{")) {
      const metadata = JSON.parse(body) as { name?: unknown };
      if (
        typeof metadata.name !== "string" ||
        normalizedName(metadata.name) !==
          normalizedName(page.expectedUniversityName)
      )
        return [];
      body = metadata.name;
      locator = "public-json:name";
    }
    const plain = body
      .replace(new RegExp("<!--[\\s\\S]*?-->", "g"), " ")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&(?:nbsp|amp);/g, " ")
      .replace(/\s+/g, " ");
    const pattern = new RegExp(
      page.expectedUniversityName
        .split(/\s+/)
        .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join("[\\s,]+"),
      "i",
    );
    const match = pattern.exec(plain);
    const landmarks = extractLandmarks(page);
    if (!match) return landmarks;
    return [
      ...landmarks,
      {
        entityType: "university",
        key: "name",
        subjectKey: "university",
        propertyKey: "name",
        value: match[0],
        category: "university",
        confidence: 0.96,
        locator,
        excerpt: match[0].slice(0, 240),
      },
    ];
  }
}
export const intelligenceStates = [
  "DISCOVERED",
  "FETCHED",
  "EXTRACTED",
  "NORMALIZED",
  "CORROBORATED",
  "POLICY_CHECKED",
  "PUBLISHED",
  "STALE",
  "REJECTED",
] as const;
export class IntelligenceMetrics {
  readonly counts: Record<string, number> = {};
  increment(name: string, amount = 1) {
    this.counts[name] = (this.counts[name] ?? 0) + amount;
  }
}
export const officialDiscovery = [
  ...landmarkResearch.map(({ campus, url }) => ({ campus, url })),
  { campus: "futa", url: "https://www.futa.edu.ng/home" },
  { campus: "oau", url: "https://oauife.edu.ng/" },
  { campus: "unilag", url: "https://unilag.edu.ng/" },
  {
    campus: "oau",
    url: "https://oauife.edu.ng/wp-json/?_fields=name,url,description",
  },
  {
    campus: "unilag",
    url: "https://unilag.edu.ng/wp-json/?_fields=name,url,description",
  },
];
export class CampusIntelligencePipeline {
  readonly metrics = new IntelligenceMetrics();
  constructor(
    private readonly db: PrismaClient,
    private readonly fetcher = new SafeFetcher(),
    private readonly extractor: CampusFactExtractor = new OfficialNameExtractor(),
    private readonly policy = new PublicationPolicyService(),
    private readonly clock: () => Date = () => new Date(),
  ) {}
  async discover(campusSlug?: string) {
    for (const item of officialDiscovery.filter((i) => !campusSlug || i.campus === campusSlug)) {
      const campus = await this.db.campus.findUnique({
        where: { slug: item.campus },
      });
      if (!campus) continue;
      const domain = new URL(item.url).hostname;
      await this.db.contentSource.upsert({
        where: { campusId_url: { campusId: campus.id, url: item.url } },
        update: {},
        create: {
          campusId: campus.id,
          url: item.url,
          domain,
          type: item.url.includes("/wp-json/")
            ? "official_public_json"
            : "official_public_html",
          authorityClass: "official",
          independentGroup: domain.replace(/^www\./, ""),
          discoveryMethod: "curated_official_registry",
          policyStatus: "permitted_public",
          robotsPolicy: "pending",
        },
      });
    }
    this.metrics.counts.source_count = await this.db.contentSource.count();
  }
  async staleSweep() {
    const rows = await this.db.campusFact.findMany({
      where: { status: "published", staleAt: { lte: this.clock() } },
      take: 500,
    });
    for (const row of rows)
      await this.db.$transaction(async (tx) => {
        await tx.campusFact.update({
          where: { id: row.id },
          data: { status: "stale" },
        });
        if (row.currentVersionId)
          await tx.publicationDecision.create({
            data: {
              versionId: row.currentVersionId,
              result: "STALE",
              reasons: ["TTL_EXPIRED"],
              policyVersion: this.policy.settings.version,
            },
          });
      });
    this.metrics.increment("stale_count", rows.length);
  }
  async runDue(limit = 10, campusSlug?: string) {
    this.metrics.counts.feedback_count = await this.db.factFeedback.count();
    await this.staleSweep();
    const sources = await this.db.contentSource.findMany({
      where: {
        policyStatus: "permitted_public",
        ...(campusSlug ? { campus: { slug: campusSlug } } : {}),
        nextFetchAt: { lte: this.clock() },
      },
      orderBy: { nextFetchAt: "asc" },
      take: Math.min(100, Math.max(1, limit)),
    });
    for (const source of sources) await this.process(source.id);
    return { ...this.metrics.counts };
  }
  async process(sourceId: string) {
    const source = await this.db.contentSource.findUniqueOrThrow({
      where: { id: sourceId },
      include: { campus: { include: { university: true } } },
    });
    sourceAuthority.parse(source.authorityClass);
    sourcePolicyStatus.parse(source.policyStatus);
    if (source.policyStatus !== "permitted_public")
      throw new Error("SOURCE_POLICY_REJECTED");
    try {
      const url = new URL(source.url);
      if (
        ["official", "institutional"].includes(source.authorityClass) &&
        url.protocol !== "https:"
      )
        throw new Error("AUTHORITATIVE_TLS_REQUIRED");
      if (
        !source.robotsCheckedAt ||
        this.clock().getTime() - source.robotsCheckedAt.getTime() >= 86400000
      ) {
        const robots = await this.fetcher.fetch(`${url.origin}/robots.txt`, [
          source.domain,
        ]);
        // Missing robots (404) permits ordinary public retrieval; all other errors fail closed.
        if (
          !(
            robots.status === 404 ||
            (robots.status === 200 &&
              robotsAllow(robots.body, url.pathname + url.search))
          )
        )
          throw new Error("ROBOTS_REJECTED");
        await this.db.contentSource.update({
          where: { id: sourceId },
          data: {
            robotsPolicy: "allowed",
            robotsCheckedAt: this.clock(),
            nextFetchAt: new Date(this.clock().getTime() + 60000),
          },
        });
        return;
      }
      // Domain pacing: worker schedules page on a subsequent tick, avoiding blocking sleeps.
      // The fetcher enforces a hard minimum interval across robots, pages and redirects.
      const response = await this.fetcher.fetch(source.url, [source.domain], {
        ...(source.etag ? { "If-None-Match": source.etag } : {}),
        ...(source.lastModified
          ? { "If-Modified-Since": source.lastModified }
          : {}),
      });
      if (response.status !== 200 && response.status !== 304)
        throw new Error("HTTP_FETCH_FAILED");
      const hash =
        response.status === 304
          ? source.contentHash
          : createHash("sha256").update(response.body).digest("hex");
      if (!hash) throw new Error("INVALID_NOT_MODIFIED");
      const observedAt = this.clock();
      const observation = await this.db.sourceObservation.upsert({
        where: {
          sourceId_contentHash_extractorVersion: {
            sourceId,
            contentHash: hash,
            extractorVersion: this.extractor.version,
          },
        },
        create: {
          sourceId,
          contentHash: hash,
          extractorVersion: this.extractor.version,
          observedAt,
          transitions: ["DISCOVERED", "FETCHED"],
        },
        update: { observedAt },
        include: { evidence: { include: { versions: true } } },
      });
      this.metrics.increment("fetch_count");
      if (response.status === 200 && observation.evidence.length === 0) {
        const candidates = await this.extractor.extract({
          body: sourceAdapter(response.headers["content-type"]).decode(response.body),
          sourceUrl: source.url,
          expectedUniversityName: source.campus.university.name,
        });
        await this.transition(observation.id, "EXTRACTED");
        this.metrics.increment("extraction_count");
        for (const raw of candidates.slice(0, 100)) {
          const candidate = candidateSchema.parse(raw);
          this.metrics.increment("candidate_count");
          const value = candidate.value
            .normalize("NFKC")
            .replace(/\s+/g, " ")
            .trim();
          const valueHash = createHash("sha256")
            .update(normalizedName(value))
            .digest("hex");
          await this.transition(observation.id, "NORMALIZED");
          await this.db.$transaction(async (tx) => {
            const propertyKey = candidate.propertyKey;
            const candidateSubjectKey = candidate.subjectKey;
            const subjects = await tx.campusSubject.findMany({ where: {
              campusId: source.campusId, subjectType: candidate.entityType,
            } });
            // Exact aliases only. Ambiguous names stay separate candidates.
            const canonicalSubjectId = subjects.find((s) => s.originKey === candidateSubjectKey)?.id ?? (propertyKey === "name"
              ? matchEntity(value, subjects).id : null);
            const identity = canonicalSubjectId ? {
              campusId_subjectType_canonicalSubjectId_propertyKey: {
                campusId: source.campusId, subjectType: candidate.entityType, canonicalSubjectId, propertyKey,
              },
            } : {
              campusId_subjectType_candidateSubjectKey_propertyKey: {
                campusId: source.campusId, subjectType: candidate.entityType, candidateSubjectKey, propertyKey,
              },
            };
            const fact = await tx.campusFact.upsert({
              where: identity,
              update: {},
              create: {
                campusId: source.campusId, subjectType: candidate.entityType,
                propertyKey, canonicalSubjectId,
                candidateSubjectKey: canonicalSubjectId ? null : candidateSubjectKey,
              },
            });
            const evidence = await tx.evidence.create({
              data: {
                observationId: observation.id,
                locator: candidate.locator,
                excerpt: candidate.excerpt,
                confidence: groundedConfidence(candidate, response.body),
                generated: source.authorityClass === "generated_fixture",
              },
            });
            const previous = await tx.factVersion.findUnique({
              where: { factId_valueHash: { factId: fact.id, valueHash } },
            });
            const version =
              previous ??
              (await tx.factVersion.create({
                data: {
                  factId: fact.id,
                  version:
                    (await tx.factVersion.count({
                      where: { factId: fact.id },
                    })) + 1,
                  value,
                  valueHash,
                  category: candidate.category,
                  confidence: candidate.confidence,
                  extractedAt: observedAt,
                  lastObservedAt: observedAt,
                  expiresAt: candidate.expiresAt
                    ? new Date(candidate.expiresAt)
                    : undefined,
                },
              }));
            await tx.factVersionEvidence.upsert({
              where: {
                versionId_evidenceId: {
                  versionId: version.id,
                  evidenceId: evidence.id,
                },
              },
              create: { versionId: version.id, evidenceId: evidence.id },
              update: {},
            });
          });
        }
      }
      const linked = await this.db.evidence.findMany({
        where: { observationId: observation.id },
        include: { versions: { include: { version: true } } },
      });
      for (const factId of new Set(
        linked.flatMap((e) => e.versions.map((v) => v.version.factId)),
      ))
        await this.evaluate(factId);
      await this.transition(observation.id, "CORROBORATED");
      await this.transition(observation.id, "POLICY_CHECKED");
      const published = await this.db.campusFact.count({
        where: {
          versions: {
            some: {
              evidence: {
                some: { evidence: { observationId: observation.id } },
              },
            },
          },
          status: "published",
        },
      });
      if (published) await this.transition(observation.id, "PUBLISHED");
      await this.db.contentSource.update({
        where: { id: sourceId },
        data: {
          lastFetchedAt: observedAt,
          nextFetchAt: new Date(observedAt.getTime() + 86400000),
          contentHash: hash,
          failureCount: 0,
          lastErrorCode: null,
          status: published ? "PUBLISHED" : "POLICY_CHECKED",
          etag: response.headers.etag,
          lastModified: response.headers["last-modified"],
        },
      });
    } catch (error) {
      const code =
        error instanceof Error && /^[A-Z_]+$/.test(error.message)
          ? error.message
          : "INGESTION_FAILED";
      this.metrics.increment("fetch_failure_count");
      await this.db.contentSource.update({
        where: { id: sourceId },
        data: {
          failureCount: { increment: 1 },
          lastErrorCode: code,
          lastFailureAt: this.clock(),
          status: code.includes("REJECTED") ? "REJECTED" : "DISCOVERED",
          robotsPolicy: code === "ROBOTS_REJECTED" ? "denied" : undefined,
          nextFetchAt: new Date(
            this.clock().getTime() +
              Math.min(
                7 * 86400000,
                60000 * 2 ** Math.min(source.failureCount, 13),
              ),
          ),
        },
      });
      // Codes only; no fetched document, token, profile or exception dump.
      const existing = await this.db.sourceObservation.findFirst({
        where: { sourceId },
        orderBy: { observedAt: "desc" },
      });
      if (existing)
        await this.db.sourceObservation.update({
          where: { id: existing.id },
          data: { errorCode: code },
        });
    }
  }
  async transition(id: string, state: string) {
    processingState.parse(state);
    const row = await this.db.sourceObservation.findUniqueOrThrow({
      where: { id },
    });
    const transitions = Array.isArray(row.transitions) ? row.transitions : [];
    await this.db.sourceObservation.update({
      where: { id },
      data: {
        state,
        transitions: [
          ...transitions.slice(-30),
          state,
        ] as Prisma.InputJsonValue,
      },
    });
  }
  async evaluate(factId: string) {
    await this.db.$transaction(async (tx) => {
      const fact = await tx.campusFact.findUniqueOrThrow({
        where: { id: factId },
        include: {
          versions: {
            include: {
              evidence: {
                include: {
                  evidence: {
                    include: { observation: { include: { source: true } } },
                  },
                },
              },
            },
          },
        },
      });
      const contradiction =
        fact.versions.filter((version) => {
          const category = factCategory.parse(version.category);
          const officialOnly = [
            "university",
            "faculty",
            "department",
            "programme",
            "academic_structure",
            "critical",
          ].includes(category);
          return version.evidence.some((link) => {
            const e = link.evidence,
              source = e.observation.source;
            const authorityAllowed = officialOnly
              ? (category === "critical" ? source.authorityClass === "official" : ["official", "institutional"].includes(source.authorityClass))
              : category === "cultural"
                ? [
                    "official",
                    "institutional",
                    "reputable",
                    "community",
                  ].includes(source.authorityClass)
                : ["official", "institutional", "reputable"].includes(
                    source.authorityClass,
                  );
            const age =
              this.clock().getTime() - e.observation.observedAt.getTime();
            return (
              authorityAllowed &&
              !e.generated &&
              e.confidence >= this.policy.settings.confidence &&
              age >= 0 &&
              age < this.policy.settings.ttlDays[category] * 86400000
            );
          });
        }).length > 1;
      if (contradiction) this.metrics.increment("contradiction_count");
      let allowed = false;
      for (const version of fact.versions) {
        const category = factCategory.parse(version.category);
        const evidence: PolicyEvidence[] = version.evidence.map((link) => ({
          authority: sourceAuthority.parse(link.evidence.observation.source.authorityClass),
          independentGroup: link.evidence.observation.source.independentGroup,
          contentHash: link.evidence.observation.contentHash,
          confidence: link.evidence.confidence,
          observedAt: link.evidence.observation.observedAt,
          generated: link.evidence.generated,
        }));
        const negative = await tx.factFeedback.aggregate({
          where: {
            factId,
            kind: { in: ["incorrect", "outdated", "closed", "wrong_location"] },
            createdAt: { gte: new Date(this.clock().getTime() - 7 * 86400000) },
          },
          _sum: { weight: true },
        });
        const decision = this.policy.decide({
          category,
          evidence,
          contradiction:
            contradiction ||
            (![
              "university",
              "faculty",
              "department",
              "programme",
              "academic_structure",
              "critical",
            ].includes(category) &&
              (negative._sum.weight ?? 0) >= 3),
          now: this.clock(),
          expiresAt: version.expiresAt ?? undefined,
        });
        await tx.factVersion.update({
          where: { id: version.id },
          data: {
            contradiction,
            lastObservedAt: new Date(
              Math.max(
                ...evidence.map((e) => e.observedAt.getTime()),
                version.lastObservedAt.getTime(),
              ),
            ),
          },
        });
        await tx.publicationDecision.create({
          data: {
            versionId: version.id,
            result: decision.result,
            reasons: decision.reasons,
            policyVersion: decision.policyVersion,
          },
        });
        this.metrics.increment(`${decision.result.toLowerCase()}_count`);
        if (decision.result === "ALLOW")
          this.metrics.increment("auto_published_count");
        if (decision.result === "HOLD") this.metrics.increment("held_count");
        if (decision.result === "ALLOW") {
          allowed = true;
          await tx.campusFact.update({
            where: { id: factId },
            data: {
              status: "published",
              currentVersionId: version.id,
              staleAt: decision.staleAt,
            },
          });
          if (!fact.canonicalSubjectId && fact.propertyKey === "name" && fact.candidateSubjectKey && evidence.some((e) => e.authority === "official")) {
            const idHash = createHash("sha256").update(`${fact.campusId}:${fact.subjectType}:${fact.candidateSubjectKey}`).digest("hex");
            const subjectId = `${idHash.slice(0,8)}-${idHash.slice(8,12)}-4${idHash.slice(13,16)}-a${idHash.slice(17,20)}-${idHash.slice(20,32)}`;
            await tx.campusSubject.upsert({ where: { id: subjectId }, update: {}, create: {
              id: subjectId, campusId: fact.campusId, subjectType: fact.subjectType, name: String(version.value), aliases: [], originKey: fact.candidateSubjectKey,
            } });
            await tx.campusFact.update({ where: { id: fact.id }, data: { canonicalSubjectId: subjectId, candidateSubjectKey: null } });
          }
          // Whole fixture packs are never promoted by this one fact.
          if (
            fact.subjectType === "university" &&
            fact.canonicalSubjectId &&
            fact.propertyKey === "name"
          )
            await tx.university.update({
              where: { id: fact.canonicalSubjectId },
              data: { name: String(version.value), status: "published" },
            });
        }
      }
      if (!allowed)
        await tx.campusFact.update({
          where: { id: factId },
          data: { status: "held", currentVersionId: null },
        });
    });
  }
}
