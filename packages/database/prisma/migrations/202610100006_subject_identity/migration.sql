-- Preserve IDs, versions, decisions, feedback and current published pointers.
BEGIN;
CREATE TABLE "CampusSubject" (
 "id" uuid PRIMARY KEY, "campusId" uuid NOT NULL REFERENCES "Campus"("id"),
 "subjectType" text NOT NULL, "name" text NOT NULL, "aliases" text[] NOT NULL, "originKey" text,
 UNIQUE ("campusId", "subjectType", "originKey"),
 UNIQUE ("id", "campusId", "subjectType")
);
INSERT INTO "CampusSubject" ("id", "campusId", "subjectType", "name", "aliases") SELECT u."id", c."id", 'university', u."name", u."aliases"
 FROM "University" u JOIN "Campus" c ON c."universityId" = u."id";
ALTER TABLE "CampusFact" RENAME COLUMN "entityType" TO "subjectType";
ALTER TABLE "CampusFact" RENAME COLUMN "entityId" TO "canonicalSubjectId";
ALTER TABLE "CampusFact" RENAME COLUMN "key" TO "propertyKey";
ALTER TABLE "CampusFact" ADD COLUMN "candidateSubjectKey" text;
-- Only existing university UUIDs are known to be relationally matched. Preserve any
-- other legacy UUID in a subject record without merging it into an unrelated entity.
INSERT INTO "CampusSubject" ("id", "campusId", "subjectType", "name", "aliases") SELECT DISTINCT ON (f."canonicalSubjectId")
 f."canonicalSubjectId", f."campusId", f."subjectType", 'Legacy subject', ARRAY[]::text[]
 FROM "CampusFact" f WHERE f."canonicalSubjectId" IS NOT NULL
 ON CONFLICT ("id") DO NOTHING;
UPDATE "CampusFact" SET "candidateSubjectKey" = 'legacy:' || "propertyKey"
 WHERE "canonicalSubjectId" IS NULL;
-- Legacy registry keys encode subjects; preserve their identity and translate
-- their terminal property without grouping different buildings by property.
UPDATE "CampusFact" SET "propertyKey" = regexp_replace("propertyKey", '^.*\.', '')
 WHERE "candidateSubjectKey" IS NOT NULL AND "propertyKey" LIKE '%.%';
DROP INDEX "CampusFact_campusId_entityType_key_key";
CREATE UNIQUE INDEX "CampusFact_campusId_subjectType_canonicalSubjectId_propertyKey_key"
 ON "CampusFact" ("campusId", "subjectType", "canonicalSubjectId", "propertyKey");
CREATE UNIQUE INDEX "CampusFact_campusId_subjectType_candidateSubjectKey_propertyKey_key"
 ON "CampusFact" ("campusId", "subjectType", "candidateSubjectKey", "propertyKey");
ALTER TABLE "CampusFact" ADD CONSTRAINT "CampusFact_subject_identity_check"
 CHECK (("canonicalSubjectId" IS NOT NULL) <> ("candidateSubjectKey" IS NOT NULL));
ALTER TABLE "CampusFact" ADD CONSTRAINT "CampusFact_subject_fkey" FOREIGN KEY
 ("canonicalSubjectId", "campusId", "subjectType") REFERENCES "CampusSubject" ("id", "campusId", "subjectType");
DROP INDEX "ContentSource_url_key";
CREATE UNIQUE INDEX "ContentSource_campusId_url_key" ON "ContentSource" ("campusId", "url");
-- Existing invalid strings abort upgrade for explicit remediation, never gain authority.
ALTER TABLE "ContentSource" ADD CONSTRAINT "source_authority_check" CHECK
 ("authorityClass" IN ('official','institutional','reputable','community','generated_fixture'));
ALTER TABLE "ContentSource" ADD CONSTRAINT "source_policy_check" CHECK
 ("policyStatus" IN ('pending','permitted_public','rejected'));
ALTER TABLE "ContentSource" ADD CONSTRAINT "source_robots_check" CHECK
 ("robotsPolicy" IN ('pending','allowed','denied'));
ALTER TABLE "ContentSource" ADD CONSTRAINT "source_state_check" CHECK
 ("status" IN ('DISCOVERED','FETCHED','EXTRACTED','NORMALIZED','CORROBORATED','POLICY_CHECKED','PUBLISHED','STALE','REJECTED'));
ALTER TABLE "SourceObservation" ADD CONSTRAINT "observation_state_check" CHECK
 ("state" IN ('DISCOVERED','FETCHED','EXTRACTED','NORMALIZED','CORROBORATED','POLICY_CHECKED','PUBLISHED','STALE','REJECTED'));
ALTER TABLE "CampusFact" ADD CONSTRAINT "fact_state_check" CHECK
 ("status" IN ('candidate','published','held','stale','rejected'));
ALTER TABLE "PublicationDecision" ADD CONSTRAINT "publication_result_check" CHECK
 ("result" IN ('ALLOW','HOLD','REJECT','STALE'));
CREATE INDEX "DeletionRequest_pending_idx" ON "DeletionRequest" ("requestedAt", "id") WHERE "completedAt" IS NULL;
COMMIT;
