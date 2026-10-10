BEGIN;
-- Existing small fixture catalogue has explicit stage slugs. Preserve every row;
-- unmapped future templates remain unavailable to simulation until linked.
ALTER TABLE "AcademicSemesterTemplate" ADD COLUMN "stageId" UUID;
UPDATE "AcademicSemesterTemplate" semester SET "stageId" = stage."id"
FROM "ProgrammeStage" stage WHERE semester."structureId" = stage."structureId"
AND semester."slug" IN (stage."slug" || '-first', stage."slug" || '-second');
ALTER TABLE "AcademicSemesterTemplate" ADD CONSTRAINT "AcademicSemesterTemplate_stageId_fkey"
FOREIGN KEY ("stageId") REFERENCES "ProgrammeStage"("id") ON DELETE RESTRICT;
CREATE UNIQUE INDEX "AcademicSemesterTemplate_stage_order_idx" ON "AcademicSemesterTemplate"("stageId", "order") WHERE "stageId" IS NOT NULL;
CREATE TABLE "AcademicSimulation" (
  "userId" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "characterId" UUID NOT NULL UNIQUE REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE,
  "revision" INTEGER NOT NULL DEFAULT 0 CHECK ("revision" >= 0),
  "carryovers" JSONB NOT NULL DEFAULT '[]' CHECK (jsonb_typeof("carryovers") = 'array' AND jsonb_array_length("carryovers") <= 12),
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE TABLE "AcademicTerm" (
  "id" UUID PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "sequence" INTEGER NOT NULL CHECK ("sequence" BETWEEN 1 AND 100),
  "status" TEXT NOT NULL CHECK ("status" IN ('active', 'completed')),
  "snapshot" JSONB NOT NULL CHECK (jsonb_typeof("snapshot") = 'object' AND octet_length("snapshot"::text) <= 131072 AND "snapshot"->>'schemaVersion' = '1' AND "snapshot"->>'status' = "status" AND "snapshot"->>'id' = "id"::text),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  UNIQUE ("userId", "sequence")
);
CREATE UNIQUE INDEX "AcademicTerm_one_active_idx" ON "AcademicTerm"("userId") WHERE "status" = 'active';
CREATE TABLE "AcademicCommandReceipt" (
  "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "commandId" UUID NOT NULL,
  "requestHash" CHAR(64) NOT NULL,
  "type" TEXT NOT NULL CHECK ("type" IN ('START_TERM','TRAVEL_TO_VENUE','ATTEND_LECTURE','STUDY','WORK_ON_ASSIGNMENT','SUBMIT_ASSIGNMENT','TAKE_TEST','TAKE_EXAM','END_DAY','WAIT_TO_NEXT_EVENT','COMPLETE_TERM')),
  "termId" UUID NOT NULL,
  "academicMinute" INTEGER NOT NULL CHECK ("academicMinute" >= 0),
  "revision" INTEGER NOT NULL CHECK ("revision" > 0),
  "result" JSONB NOT NULL CHECK (octet_length("result"::text) <= 2048),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("userId", "commandId")
);
CREATE INDEX "AcademicCommandReceipt_userId_termId_idx" ON "AcademicCommandReceipt"("userId", "termId");
CREATE FUNCTION protect_completed_academic_term() RETURNS trigger AS $$
BEGIN
  IF OLD."status" = 'completed' THEN RAISE EXCEPTION 'FINALIZED_TERM_IMMUTABLE'; END IF;
  IF NEW."userId" <> OLD."userId" OR NEW."sequence" <> OLD."sequence" OR NEW."id" <> OLD."id" THEN RAISE EXCEPTION 'TERM_IDENTITY_IMMUTABLE'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "AcademicTerm_finalized_guard" BEFORE UPDATE ON "AcademicTerm" FOR EACH ROW EXECUTE FUNCTION protect_completed_academic_term();
CREATE FUNCTION validate_academic_owner() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "PlayerCharacter" WHERE "id" = NEW."characterId" AND "userId" = NEW."userId") THEN RAISE EXCEPTION 'ACADEMIC_OWNER_MISMATCH'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "AcademicSimulation_owner_guard" BEFORE INSERT OR UPDATE ON "AcademicSimulation" FOR EACH ROW EXECUTE FUNCTION validate_academic_owner();
COMMIT;
