BEGIN;
ALTER TABLE "FactVersion" ADD COLUMN "expiresAt" TIMESTAMP(3);
ALTER TABLE "ContentSource" ADD COLUMN "lastErrorCode" TEXT, ADD COLUMN "lastFailureAt" TIMESTAMP(3);

-- Cross-table consistency, beyond individual UUID foreign keys. Preserve all guest rows.
CREATE FUNCTION "validate_character_position"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "ProgrammeStructure" ps
    JOIN "Programme" p ON p."id" = ps."programmeId"
    JOIN "Department" d ON d."id" = p."departmentId"
    JOIN "Faculty" f ON f."id" = d."facultyId"
    JOIN "ProgrammeStage" stage ON stage."structureId" = ps."id"
    WHERE ps."id" = NEW."structureId" AND ps."version" = NEW."structureVersion"
      AND p."id" = NEW."programmeId" AND f."campusId" = NEW."campusId"
      AND stage."id" = NEW."stageId" AND NEW."entryMode" = ANY(stage."entryModes")
  ) THEN RAISE EXCEPTION 'INVALID_CHARACTER_POSITION' USING ERRCODE = '23514'; END IF;
  IF NEW."semesterId" IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM "AcademicSemesterTemplate" WHERE "id" = NEW."semesterId" AND "structureId" = NEW."structureId"
  ) THEN RAISE EXCEPTION 'INVALID_CHARACTER_SEMESTER' USING ERRCODE = '23514'; END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER "PlayerCharacter_position_guard" BEFORE INSERT OR UPDATE ON "PlayerCharacter"
  FOR EACH ROW EXECUTE FUNCTION "validate_character_position"();
COMMIT;
