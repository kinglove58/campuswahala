BEGIN;
CREATE TABLE "PlayerWorldState" (
 "userId" UUID PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
 "campusId" VARCHAR(20) NOT NULL CHECK ("campusId" IN ('futa','oau','unilag')),
 "worldVersion" INTEGER NOT NULL CHECK ("worldVersion" > 0),
 "spawnId" VARCHAR(64) NOT NULL,
 "zoneId" VARCHAR(64) NOT NULL,
 "appearance" JSONB NOT NULL,
 "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMIT;
