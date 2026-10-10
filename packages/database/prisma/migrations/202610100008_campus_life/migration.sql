CREATE TABLE "LifeSimulation" (
 "userId" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
 "characterId" UUID NOT NULL UNIQUE REFERENCES "PlayerCharacter"("id") ON DELETE CASCADE,
 "snapshot" JSONB NOT NULL,
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "life_bounds" CHECK (COALESCE(
   jsonb_typeof("snapshot"->'metrics') = 'object' AND
   jsonb_typeof("snapshot"->'metrics'->'energy') = 'number' AND
   jsonb_typeof("snapshot"->'metrics'->'satiety') = 'number' AND
   jsonb_typeof("snapshot"->'metrics'->'mood') = 'number' AND
   jsonb_typeof("snapshot"->'metrics'->'wellbeing') = 'number' AND
   ("snapshot"->>'schemaVersion')::int = 1 AND
   ("snapshot"->>'lastProcessedMinute')::int BETWEEN 0 AND 40740 AND
   ("snapshot"->>'revision')::int >= 0 AND
   ("snapshot"->'metrics'->>'energy')::numeric BETWEEN 0 AND 10000 AND
   ("snapshot"->'metrics'->>'satiety')::numeric BETWEEN 0 AND 10000 AND
   ("snapshot"->'metrics'->>'mood')::numeric BETWEEN 0 AND 10000 AND
   ("snapshot"->'metrics'->>'wellbeing')::numeric BETWEEN 0 AND 10000 AND
   mod(("snapshot"->'metrics'->>'energy')::numeric,1)=0 AND
   mod(("snapshot"->'metrics'->>'satiety')::numeric,1)=0 AND
   mod(("snapshot"->'metrics'->>'mood')::numeric,1)=0 AND
   mod(("snapshot"->'metrics'->>'wellbeing')::numeric,1)=0 AND
   octet_length("snapshot"::text) <= 16384, false))
);
CREATE TABLE "LifeCommandReceipt" (
 "userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "commandId" UUID NOT NULL,"requestHash" CHAR(64) NOT NULL,"type" TEXT NOT NULL,
 "termId" UUID NOT NULL,"academicMinute" INTEGER NOT NULL CHECK ("academicMinute" BETWEEN 0 AND 40740),
 "revision" INTEGER NOT NULL CHECK ("revision" >= 0),"result" JSONB NOT NULL CHECK (octet_length("result"::text)<=2048),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY ("userId","commandId"),
 CHECK ("type" IN ('START_LIFE','EAT','REST','SLEEP','SOCIALIZE','EXERCISE','RESOLVE_WAHALA'))
);
CREATE INDEX "LifeCommandReceipt_userId_termId_idx" ON "LifeCommandReceipt"("userId","termId");
CREATE TABLE "WahalaOccurrence" (
 "id" UUID PRIMARY KEY,"userId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
 "termId" UUID NOT NULL,"status" TEXT NOT NULL CHECK ("status" IN ('pending','resolved','dismissed','expired')),
 "snapshot" JSONB NOT NULL CHECK (octet_length("snapshot"::text)<=8192 AND "snapshot"->>'status' = "status"),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "WahalaOccurrence_userId_termId_idx" ON "WahalaOccurrence"("userId","termId");
CREATE UNIQUE INDEX "wahala_one_pending" ON "WahalaOccurrence"("userId") WHERE "status" = 'pending';
CREATE FUNCTION preserve_wahala_outcome() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF OLD."status" <> 'pending' AND (NEW."snapshot" IS DISTINCT FROM OLD."snapshot" OR NEW."status" IS DISTINCT FROM OLD."status") THEN
  RAISE EXCEPTION 'Finalized Wahala outcome is immutable';
 END IF;
 RETURN NEW;
END; $$;
CREATE TRIGGER "wahala_outcome_guard" BEFORE UPDATE ON "WahalaOccurrence" FOR EACH ROW EXECUTE FUNCTION preserve_wahala_outcome();
