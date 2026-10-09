CREATE TABLE "GuestPlayer" (
  "id" UUID PRIMARY KEY,
  "campusId" VARCHAR(20) NOT NULL,
  "programmeId" VARCHAR(60) NOT NULL,
  "level" INTEGER NOT NULL CHECK ("level" BETWEEN 100 AND 1200 AND "level" % 100 = 0),
  "durationYears" INTEGER NOT NULL CHECK ("durationYears" BETWEEN 1 AND 12 AND "level" <= "durationYears" * 100),
  "avatar" VARCHAR(20) NOT NULL CHECK ("avatar" IN ('lime', 'clay', 'blue')),
  "nickname" VARCHAR(40) NOT NULL,
  "tokenHash" CHAR(64) NOT NULL UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "GuestPlayer_expiresAt_idx" ON "GuestPlayer"("expiresAt");
CREATE INDEX "GuestPlayer_campusId_programmeId_level_idx" ON "GuestPlayer"("campusId", "programmeId", "level");
