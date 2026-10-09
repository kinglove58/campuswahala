BEGIN;
-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "stateHash" CHAR(64) NOT NULL,
    "clientHash" CHAR(64) NOT NULL,
    "provider" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "verifier" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "ageBand" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("stateHash")
);

-- CreateTable
CREATE TABLE "ExternalIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "subject" VARCHAR(255) NOT NULL,

    CONSTRAINT "ExternalIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" UUID NOT NULL,
    "ageBand" TEXT NOT NULL DEFAULT 'unknown',
    "consentVersion" TEXT,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserPrivacySettings" (
    "userId" UUID NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'private',
    "discoverable" BOOLEAN NOT NULL DEFAULT false,
    "analyticsConsent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserPrivacySettings_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "UserSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeletionRequest" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "DeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCharacter" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "programmeId" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "structureVersion" INTEGER NOT NULL,
    "stageId" UUID NOT NULL,
    "semesterId" UUID,
    "entryMode" TEXT NOT NULL DEFAULT 'standard',
    "nickname" VARCHAR(40) NOT NULL,
    "avatar" VARCHAR(20) NOT NULL,
    "durationYears" INTEGER NOT NULL,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerCharacter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestConversion" (
    "id" UUID NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "outcome" TEXT NOT NULL,

    CONSTRAINT "GuestConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "University" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',

    CONSTRAINT "University_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campus" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "universityId" UUID NOT NULL,

    CONSTRAINT "Campus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "campusId" UUID NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "facultyId" UUID NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Programme" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "departmentId" UUID NOT NULL,

    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeStructure" (
    "id" UUID NOT NULL,
    "programmeId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'candidate',

    CONSTRAINT "ProgrammeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgrammeStage" (
    "id" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "displayCode" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "entryModes" TEXT[],
    "activityTags" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',

    CONSTRAINT "ProgrammeStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSemesterTemplate" (
    "id" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'candidate',

    CONSTRAINT "AcademicSemesterTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastObservedAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Building" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastObservedAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hostel" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastObservedAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "Hostel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastObservedAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportMode" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastObservedAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "TransportMode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CulturalFact" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastObservedAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "CulturalFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampusBusinessReference" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "aliases" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "details" JSONB NOT NULL DEFAULT '{}',
    "lastObservedAt" TIMESTAMP(3),
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "CampusBusinessReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentSource" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "authorityClass" TEXT NOT NULL,
    "independentGroup" TEXT NOT NULL,
    "discoveryMethod" TEXT NOT NULL,
    "robotsPolicy" TEXT NOT NULL DEFAULT 'pending',
    "robotsCheckedAt" TIMESTAMP(3),
    "policyStatus" TEXT NOT NULL DEFAULT 'pending',
    "lastFetchedAt" TIMESTAMP(3),
    "nextFetchAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "etag" TEXT,
    "lastModified" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DISCOVERED',
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "contentHash" TEXT,

    CONSTRAINT "ContentSource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceObservation" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "contentHash" CHAR(64) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "extractorVersion" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'FETCHED',
    "transitions" JSONB NOT NULL DEFAULT '[]',
    "errorCode" TEXT,

    CONSTRAINT "SourceObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidence" (
    "id" UUID NOT NULL,
    "observationId" UUID NOT NULL,
    "locator" VARCHAR(500) NOT NULL,
    "excerpt" VARCHAR(240) NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "generated" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampusFact" (
    "id" UUID NOT NULL,
    "campusId" UUID NOT NULL,
    "entityId" UUID,
    "entityType" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'candidate',
    "currentVersionId" UUID,
    "staleAt" TIMESTAMP(3),

    CONSTRAINT "CampusFact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactVersion" (
    "id" UUID NOT NULL,
    "factId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL,
    "lastObservedAt" TIMESTAMP(3) NOT NULL,
    "contradiction" BOOLEAN NOT NULL DEFAULT false,
    "valueHash" CHAR(64) NOT NULL,

    CONSTRAINT "FactVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactVersionEvidence" (
    "versionId" UUID NOT NULL,
    "evidenceId" UUID NOT NULL,

    CONSTRAINT "FactVersionEvidence_pkey" PRIMARY KEY ("versionId","evidenceId")
);

-- CreateTable
CREATE TABLE "PublicationDecision" (
    "id" UUID NOT NULL,
    "versionId" UUID NOT NULL,
    "result" TEXT NOT NULL,
    "reasons" TEXT[],
    "policyVersion" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicationDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactFeedback" (
    "id" UUID NOT NULL,
    "factId" UUID NOT NULL,
    "userId" UUID,
    "actorHash" CHAR(64) NOT NULL,
    "kind" TEXT NOT NULL,
    "correction" VARCHAR(240),
    "weight" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityMergeHistory" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "fromId" UUID NOT NULL,
    "toId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "evidenceIds" TEXT[],
    "mergedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reversedAt" TIMESTAMP(3),

    CONSTRAINT "EntityMergeHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LoginAttempt_expiresAt_idx" ON "LoginAttempt"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentity_provider_subject_key" ON "ExternalIdentity"("provider", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "UserSession_tokenHash_key" ON "UserSession"("tokenHash");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeletionRequest_userId_key" ON "DeletionRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCharacter_userId_key" ON "PlayerCharacter"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuestConversion_tokenHash_key" ON "GuestConversion"("tokenHash");

-- CreateIndex
CREATE INDEX "GuestConversion_expiresAt_idx" ON "GuestConversion"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "University_slug_key" ON "University"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Campus_slug_key" ON "Campus"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_campusId_slug_key" ON "Faculty"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Department_facultyId_slug_key" ON "Department"("facultyId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Programme_departmentId_slug_key" ON "Programme"("departmentId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeStructure_programmeId_version_key" ON "ProgrammeStructure"("programmeId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeStage_structureId_slug_key" ON "ProgrammeStage"("structureId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProgrammeStage_structureId_order_key" ON "ProgrammeStage"("structureId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSemesterTemplate_structureId_slug_key" ON "AcademicSemesterTemplate"("structureId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Location_campusId_slug_key" ON "Location"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Building_campusId_slug_key" ON "Building"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Hostel_campusId_slug_key" ON "Hostel"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "Route_campusId_slug_key" ON "Route"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "TransportMode_campusId_slug_key" ON "TransportMode"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CulturalFact_campusId_slug_key" ON "CulturalFact"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "CampusBusinessReference_campusId_slug_key" ON "CampusBusinessReference"("campusId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "ContentSource_url_key" ON "ContentSource"("url");

-- CreateIndex
CREATE INDEX "ContentSource_nextFetchAt_status_idx" ON "ContentSource"("nextFetchAt", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SourceObservation_sourceId_contentHash_extractorVersion_key" ON "SourceObservation"("sourceId", "contentHash", "extractorVersion");

-- CreateIndex
CREATE UNIQUE INDEX "CampusFact_currentVersionId_key" ON "CampusFact"("currentVersionId");

-- CreateIndex
CREATE INDEX "CampusFact_status_staleAt_idx" ON "CampusFact"("status", "staleAt");

-- CreateIndex
CREATE UNIQUE INDEX "CampusFact_campusId_entityType_key_key" ON "CampusFact"("campusId", "entityType", "key");

-- CreateIndex
CREATE UNIQUE INDEX "FactVersion_factId_version_key" ON "FactVersion"("factId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "FactVersion_factId_valueHash_key" ON "FactVersion"("factId", "valueHash");

-- CreateIndex
CREATE INDEX "FactFeedback_factId_createdAt_idx" ON "FactFeedback"("factId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FactFeedback_factId_actorHash_key" ON "FactFeedback"("factId", "actorHash");

-- AddForeignKey
ALTER TABLE "ExternalIdentity" ADD CONSTRAINT "ExternalIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPrivacySettings" ADD CONSTRAINT "UserPrivacySettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSession" ADD CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeletionRequest" ADD CONSTRAINT "DeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "ProgrammeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "ProgrammeStage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_semesterId_fkey" FOREIGN KEY ("semesterId") REFERENCES "AcademicSemesterTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestConversion" ADD CONSTRAINT "GuestConversion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campus" ADD CONSTRAINT "Campus_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "University"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Programme" ADD CONSTRAINT "Programme_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeStructure" ADD CONSTRAINT "ProgrammeStructure_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgrammeStage" ADD CONSTRAINT "ProgrammeStage_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "ProgrammeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicSemesterTemplate" ADD CONSTRAINT "AcademicSemesterTemplate_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "ProgrammeStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Building" ADD CONSTRAINT "Building_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hostel" ADD CONSTRAINT "Hostel_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportMode" ADD CONSTRAINT "TransportMode_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CulturalFact" ADD CONSTRAINT "CulturalFact_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusBusinessReference" ADD CONSTRAINT "CampusBusinessReference_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentSource" ADD CONSTRAINT "ContentSource_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceObservation" ADD CONSTRAINT "SourceObservation_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ContentSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_observationId_fkey" FOREIGN KEY ("observationId") REFERENCES "SourceObservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusFact" ADD CONSTRAINT "CampusFact_campusId_fkey" FOREIGN KEY ("campusId") REFERENCES "Campus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampusFact" ADD CONSTRAINT "CampusFact_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "FactVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactVersion" ADD CONSTRAINT "FactVersion_factId_fkey" FOREIGN KEY ("factId") REFERENCES "CampusFact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactVersionEvidence" ADD CONSTRAINT "FactVersionEvidence_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FactVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactVersionEvidence" ADD CONSTRAINT "FactVersionEvidence_evidenceId_fkey" FOREIGN KEY ("evidenceId") REFERENCES "Evidence"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicationDecision" ADD CONSTRAINT "PublicationDecision_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "FactVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactFeedback" ADD CONSTRAINT "FactFeedback_factId_fkey" FOREIGN KEY ("factId") REFERENCES "CampusFact"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactFeedback" ADD CONSTRAINT "FactFeedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Demo catalogue only; never publication evidence.
INSERT INTO "University" ("id","slug","name","aliases","status") VALUES ('fbb25394-f3a6-4c72-ac5d-a145ce9e4f3a','futa','Federal University of Technology Akure',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Campus" ("id","universityId","slug","name","aliases","status") VALUES ('aaab8ac4-2a29-4ecc-910c-3c94d3b30bd2','fbb25394-f3a6-4c72-ac5d-a145ce9e4f3a','futa','FUTA preview campus',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Faculty" ("id","campusId","slug","name","aliases","status") VALUES ('289d063e-cc3e-45c4-8cea-015a747ee028','aaab8ac4-2a29-4ecc-910c-3c94d3b30bd2','preview-faculty','Preview faculty (fictional)',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Department" ("id","facultyId","slug","name","aliases","status") VALUES ('ebae1e16-44ba-4f87-8bfb-5525985ee850','289d063e-cc3e-45c4-8cea-015a747ee028','preview-department','Preview department (fictional)',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('955deb63-041c-4b5e-9e68-9837fb09d679','ebae1e16-44ba-4f87-8bfb-5525985ee850','computing-demo','Computing · sample programme',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('6cb11908-f887-488c-8abb-86d7a7706a5e','955deb63-041c-4b5e-9e68-9837fb09d679',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('bb66f75b-7aff-4817-ac1b-3f029c5c023f','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('711d709a-3999-4654-9d2f-42f638ae1e62','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('7aab4fa2-2180-402c-9ae7-b4f3213f7d49','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('e09087d2-f864-494e-bc70-0d9b6d8f467c','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('962dd978-40a7-4d3c-989c-63811ddb8f11','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('02c5ea74-36a8-48af-b937-0348c3b61a9d','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('ce18dab9-5acf-4bc0-b1e9-b4517a6656de','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('86c64ac0-3ee2-4228-9b28-1a788a69b5d8','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('06e42670-d89c-498a-8507-61007191d017','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('1400b9c2-817c-4839-8437-55e37eb41482','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('d40a396f-6c1d-45ee-95eb-33f633c77462','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('0ce67837-951f-4170-baf1-d3c626836283','6cb11908-f887-488c-8abb-86d7a7706a5e','computing-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('051e2f2b-19b1-434f-a862-a42e65d386fc','ebae1e16-44ba-4f87-8bfb-5525985ee850','engineering-demo','Engineering · sample programme',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','051e2f2b-19b1-434f-a862-a42e65d386fc',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('f34862db-a364-44f6-b2d0-5b0261b61ae3','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('b96f365d-3928-4e4d-9286-401e21a0d410','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('247166ac-14ce-4a86-8e0b-08ba6da1e92e','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('d50dab26-4ca4-42aa-b436-9f36aeaa3ef3','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('883e7fc5-b945-4bc9-aaff-8ff068e69d37','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('e75b8788-f90b-4dc7-b81f-18c4987703ec','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('17958f46-b71a-46d3-bbef-84dfd1b07b32','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('897c53e6-6368-4003-ba2d-079f0ca2cee8','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('81d16691-7cfa-44f6-ac87-82aed125de10','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('f3fb14c1-fd8e-4cad-a9e4-ed0defb2353d','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('a802acd3-f0f9-4dbc-9dd9-d0936aac0a46','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('16f93db6-6bb6-4de1-a51b-280da9d60c86','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('24c7a5c8-cae4-49b4-bc45-e71d4d6b3dea','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-500','500','500L',4,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('f5d3d620-15c6-4767-8d00-ea042fd898e2','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-500-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('b7a7f74f-19bd-4c70-bbdb-cab2cdb612ac','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-500-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('eb3ec52f-a475-4284-a8dc-9731b065e8b9','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-600','600','600L',5,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('657de4e8-9a7b-40fe-9f0b-e829ffba0eec','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-600-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('06518ebb-ea6e-4e6e-8475-c52e8bd69204','6ac5b7d6-ebb4-44f2-982c-7c35c0c75213','engineering-demo-stage-600-second','Second semester',1,'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('17f92dbc-c716-47cc-a34e-379d5e41685d','ebae1e16-44ba-4f87-8bfb-5525985ee850','extended-demo','Extended programme · sample',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('e96795bc-ff65-48c4-a7f4-65c175b71475','17f92dbc-c716-47cc-a34e-379d5e41685d',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('c8b510e0-d8bc-4517-a226-e4a013b415f6','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('45fcb3eb-b43b-497c-8e1a-3a963ab8a0e3','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('9b62789d-717c-4f79-bf79-a95a6f6aacbd','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('56dc134c-d1c1-45dd-a330-5a11912dbcab','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('094fe406-a831-49fa-beb7-12f35226bfa1','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('ed8437c6-cf72-457f-be6a-ba85d4745527','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('08b0fbaa-7cd0-483f-a1a3-afe2b56da8d4','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('99d7e91b-9d57-4f23-9576-25fd52be2d09','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('3ee57faa-c517-4029-845d-ba58fcde7236','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('270172b2-3ed5-4b1b-a97e-b5f308c3b634','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('b44bafcf-99a0-46db-825a-1d5033386264','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('322e2bbc-83c5-4e5e-bad9-d83017ac2850','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('b4eb9723-8f32-4dae-ad2a-f1c14bcd3c42','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-500','500','500L',4,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('0aefdd23-3bde-465d-abee-70d92ed9e0f1','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-500-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('274673f0-6d5c-45d4-aef3-bde27ed8bc6d','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-500-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('4dce6f0e-34d1-4141-8167-47c932f6ccc4','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-600','600','600L',5,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('1440fa2a-e78d-4dd6-90ba-09f2b16202d8','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-600-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('eacb3b8a-77dc-4aab-897d-df21dac19fc1','e96795bc-ff65-48c4-a7f4-65c175b71475','extended-demo-stage-600-second','Second semester',1,'fixture');
INSERT INTO "University" ("id","slug","name","aliases","status") VALUES ('0f6b0435-a588-4f26-abf8-a9a5ad2f285b','oau','Obafemi Awolowo University',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Campus" ("id","universityId","slug","name","aliases","status") VALUES ('ae898cd2-5a85-4d6f-b6fd-5b26ef8c3d34','0f6b0435-a588-4f26-abf8-a9a5ad2f285b','oau','OAU preview campus',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Faculty" ("id","campusId","slug","name","aliases","status") VALUES ('695c3e75-192b-47a8-a5e0-81a79d79e98a','ae898cd2-5a85-4d6f-b6fd-5b26ef8c3d34','preview-faculty','Preview faculty (fictional)',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Department" ("id","facultyId","slug","name","aliases","status") VALUES ('80d2a21f-40f0-4846-8c2f-03851d5cb85d','695c3e75-192b-47a8-a5e0-81a79d79e98a','preview-department','Preview department (fictional)',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('de944bc8-e558-4ecd-a8f3-951dab9295e0','80d2a21f-40f0-4846-8c2f-03851d5cb85d','computing-demo','Computing · sample programme',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('6371e9d9-00c7-4743-8b59-34c03fef5010','de944bc8-e558-4ecd-a8f3-951dab9295e0',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('432a0e0c-4fe4-499e-b48f-d9ee66fa7265','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('64794964-68b4-4aa6-a60c-8294a48c188d','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('4d42ebf5-8daa-4287-aee2-c39ee24de84d','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('ff24ca47-b190-4412-83d0-4aaa95c084b0','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('e2ced04b-d0f3-41fb-9f12-c96a3e2f4cd6','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('cbc677d1-5087-44e7-8363-b760ebe7f1e4','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('0fb28ad5-0bcd-433a-bfb0-52b64e242741','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('c1f90793-48c1-4176-a661-ee39542d5af3','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('9dd6037c-13dc-4cc8-96f1-8f3613895bd7','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('2987d829-19ce-44e1-a53e-681b69bee51f','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('b8389965-b3fd-4b19-9ad0-ac40af1e2da1','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('c488539e-06d7-4dc3-8824-a5a4c8f832ae','6371e9d9-00c7-4743-8b59-34c03fef5010','computing-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('e115d882-0aef-466f-8e38-73819f6a9cc0','80d2a21f-40f0-4846-8c2f-03851d5cb85d','engineering-demo','Engineering · sample programme',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('130b152a-3839-4b49-a4f2-77d77b5d5de4','e115d882-0aef-466f-8e38-73819f6a9cc0',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('a0dd291b-19a7-40e7-9a32-52bdaf0d03f9','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('38215be3-ec88-407a-be60-f2b41f89b5dd','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('cf37bbc0-b6ea-44e1-af40-1123f85e2201','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('869f1d5c-9943-4bfb-bdd7-98a042b22d80','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('1599cdbd-34ab-478f-b6c9-9c955329c71e','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('7accb8df-2b80-406b-b229-51f2adfe8efa','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('7cdd80a4-b0ea-4d58-8d0c-8b3322c1541e','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('32c7508e-1784-49f3-8efe-9071db4f461d','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('efaf7a6b-e22c-4cb5-ad40-a9dd167059c2','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('576abd2a-be8f-47a9-913d-06f431df319a','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('21141aa0-12ce-42d7-b84f-76cdd57a8fdc','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('f912df05-708b-4304-b99d-ee216e077bfc','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('a3fde10f-6a15-4245-9462-a3c99927fb12','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-500','500','500L',4,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('27f49ca1-c279-4612-8493-396fd7b4b14a','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-500-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('2e7824eb-4a33-48db-a00e-f569d61f98ea','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-500-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('2b0b4820-f1ab-4207-a7d4-ded760dee4df','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-600','600','600L',5,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('bb357cea-1dcc-468b-a930-c946a87904f5','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-600-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('addfd3c2-48e9-4253-b740-a8e36d746c26','130b152a-3839-4b49-a4f2-77d77b5d5de4','engineering-demo-stage-600-second','Second semester',1,'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('953b72bc-0143-4f09-a66f-8c180d7c3da8','80d2a21f-40f0-4846-8c2f-03851d5cb85d','extended-demo','Extended programme · sample',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('93b12333-5560-40e2-9437-108c9eca647f','953b72bc-0143-4f09-a66f-8c180d7c3da8',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('57485aac-3845-4e26-888a-b14e2c5a8dfd','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('4d7359d4-2121-4849-9926-8842d20aff7c','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('3c33c785-f152-4b3d-96ac-3d7368f31b5d','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('72aa09fc-8b7d-4c21-a122-f18c08f15d18','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('bf670a0c-86ea-44a0-8e6e-7eae66f51d20','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('309ef2aa-36ed-43ef-96c4-407fe041563e','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('8bf02628-f16a-4183-a738-118b4cb960f2','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('de19ac07-4c22-444f-a040-9fb9d8f5e2f5','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('c2a6b69e-a1e4-405e-90b6-2df300d198a6','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('690e937b-999e-43a6-a6f9-de59eb5ed1c0','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('3e044c18-2f2b-4c73-b7b5-ec68870c429a','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('9c532ba1-0a5b-4b23-bc41-532ab1a94add','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('7ec653b5-6bd3-4f6e-86e8-4938f74ff8ec','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-500','500','500L',4,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('a053877f-2368-4ba3-a107-f1d56843bffa','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-500-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('78583e34-f334-490e-8729-1e331dc1c742','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-500-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('c7aad89d-76a9-4ae3-b4e5-d21b0938a76b','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-600','600','600L',5,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('9a4549cc-8a9d-4801-bb58-41a3e55ab2ea','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-600-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('6a53e821-4dbd-4e34-9423-2c7fd2802191','93b12333-5560-40e2-9437-108c9eca647f','extended-demo-stage-600-second','Second semester',1,'fixture');
INSERT INTO "University" ("id","slug","name","aliases","status") VALUES ('b3cfed0b-e432-4fa4-aafb-c7478766563a','unilag','University of Lagos',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Campus" ("id","universityId","slug","name","aliases","status") VALUES ('cefba37a-a970-4477-b077-724bb34546f6','b3cfed0b-e432-4fa4-aafb-c7478766563a','unilag','UNILAG preview campus',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Faculty" ("id","campusId","slug","name","aliases","status") VALUES ('94e493b3-fdf7-496d-99bc-111cbc5953d6','cefba37a-a970-4477-b077-724bb34546f6','preview-faculty','Preview faculty (fictional)',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Department" ("id","facultyId","slug","name","aliases","status") VALUES ('0ad256d3-6f2e-4468-ba58-efd216cb0319','94e493b3-fdf7-496d-99bc-111cbc5953d6','preview-department','Preview department (fictional)',ARRAY[]::TEXT[],'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('25942d57-fef4-4ce6-8db9-4948e55573e6','0ad256d3-6f2e-4468-ba58-efd216cb0319','computing-demo','Computing · sample programme',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('22a7bc3f-79c8-40e3-84ab-229c619698d7','25942d57-fef4-4ce6-8db9-4948e55573e6',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('94ca7a4d-8b8d-40ff-8da9-fec6ddfaee5a','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('21e5c12e-a647-4b78-8166-b4dc20f824c9','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('1ff456dd-0453-448e-90e7-e103608cb63a','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('76e551b8-3802-472b-b61b-6e77ac90dc20','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('f6d24885-9ca7-48f9-a094-1a7b720b479c','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('0b1e9c6d-e7e9-45d3-8c80-b16174f775b1','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('142fdbd3-a01a-4ecc-aef1-de7f46b94d1f','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('dde31de9-1bb8-4f56-8bdf-12c21f79aa91','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('759e6e2f-f378-4267-aa38-e7e1391a5c71','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('aa70af3c-2d7d-4be9-80e6-c7999fed2013','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('7e2439bb-4c8e-4e25-83c0-1ad9f6399820','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('2b71ef9e-8248-4aa0-8625-de2d51eb5753','22a7bc3f-79c8-40e3-84ab-229c619698d7','computing-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('0d6548c7-664f-46f6-99af-1ac5617a540b','0ad256d3-6f2e-4468-ba58-efd216cb0319','engineering-demo','Engineering · sample programme',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('3255c2c1-6044-4871-b50a-555304ee90c9','0d6548c7-664f-46f6-99af-1ac5617a540b',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('09466d81-764a-4613-830e-a0d86470653a','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('6c801622-8aaa-4c2a-b232-63a1817f8e01','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('7617f73f-098c-4c2b-a516-a84ec8df5398','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('01ab345b-1a3a-4eb6-a815-e7f4bef0ca48','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('01930592-f638-4c0d-a49c-07d768a9eee9','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('341ddb44-cf0b-4e62-a2c0-bc40a9e5c751','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('9c9b07a0-77f1-49db-aa67-e56c4685834c','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('6089d4b1-17e7-41ec-b477-58262f354fd0','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('adc33614-eed5-4a1f-a777-dfffef1ef360','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('a1942db0-f44e-453f-b1d5-1920ecb7528b','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('94832679-034e-4698-a7d8-95913112fe38','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('66f4cdcd-1444-42e8-9bb1-dacc9baaff06','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('6f2a145c-0dbf-4656-8f7f-574615f358a0','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-500','500','500L',4,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('4215ce23-b843-464d-a6e6-b04e07082aa2','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-500-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('15253f4f-999e-4fdd-9c2f-cb0371fce39f','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-500-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('7fac61d1-748a-4ede-afe9-73ab21883854','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-600','600','600L',5,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('9aa1771c-5db5-40dd-8aab-e78755fa76f6','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-600-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('03c00a0a-541d-4475-96cb-cabd60fa8d45','3255c2c1-6044-4871-b50a-555304ee90c9','engineering-demo-stage-600-second','Second semester',1,'fixture');
INSERT INTO "Programme" ("id","departmentId","slug","name","aliases","status") VALUES ('0da0d0a7-c743-4d68-a6aa-811cbd18d524','0ad256d3-6f2e-4468-ba58-efd216cb0319','extended-demo','Extended programme · sample',ARRAY[]::TEXT[],'fixture');
INSERT INTO "ProgrammeStructure" ("id","programmeId","version","effectiveFrom","status") VALUES ('b1418415-3e17-42b7-8176-3e740641606b','0da0d0a7-c743-4d68-a6aa-811cbd18d524',1,'2026-10-09T00:00:00Z','fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('c8b42b75-b71a-406d-8c05-f9898b8aafc9','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-100','100','100L',0,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('86f8129b-0ba6-4c89-a34a-c7e429060008','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-100-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('9e42c8d8-eaa8-43f6-ae31-b12c41b97524','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-100-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('68110749-a3a4-44a8-8226-4cc1bb216464','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-200','200','200L',1,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('b8d60349-9f8d-4695-86bf-54daffe45baf','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-200-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('470398c9-cf50-4020-ab12-22b093448c88','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-200-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('9cb63e14-251f-4cb2-a36e-1693eee01f5b','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-300','300','300L',2,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('ddaeffb2-c30b-4cec-888b-d9cd281b7a74','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-300-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('11f462b6-929e-4bee-8612-84ee77e28642','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-300-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('db26d0a2-f80b-4814-82c7-942d31b9d88a','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-400','400','400L',3,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('63dd5d94-680d-40d5-8c17-7663dc259262','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-400-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('0f075461-a5a1-4910-b33a-278d30fd08d7','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-400-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('bb7639a9-dd18-4ff5-a11d-7e3f15ad2c17','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-500','500','500L',4,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('22b6b54e-ed20-41c5-9dc1-d8cd3e48e16f','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-500-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('99591ce3-65bb-441d-935f-8e147e9251bf','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-500-second','Second semester',1,'fixture');
INSERT INTO "ProgrammeStage" ("id","structureId","slug","displayCode","label","order","entryModes","activityTags","status") VALUES ('ed272b69-ba04-46fe-a539-82ac0164f0ca','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-600','600','600L',5,ARRAY['standard','direct_entry','transfer']::TEXT[],ARRAY[]::TEXT[],'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('7591ae27-ad05-4bfb-bfdb-dcef6c880db9','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-600-first','First semester',0,'fixture');
INSERT INTO "AcademicSemesterTemplate" ("id","structureId","slug","label","order","status") VALUES ('163c0473-0db7-494b-abaa-d652e12b1a71','b1418415-3e17-42b7-8176-3e740641606b','extended-demo-stage-600-second','Second semester',1,'fixture');

ALTER TABLE "User" ADD CONSTRAINT "User_status_check" CHECK ("status" IN ('active','deletion_pending','suspended'));
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_ageBand_check" CHECK ("ageBand" IN ('under_18','18_or_over','unknown'));
ALTER TABLE "UserPrivacySettings" ADD CONSTRAINT "UserPrivacySettings_private_check" CHECK ("visibility" = 'private' AND "discoverable" = false);
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_confidence_check" CHECK ("confidence" BETWEEN 0 AND 1);
ALTER TABLE "PublicationDecision" ADD CONSTRAINT "PublicationDecision_result_check" CHECK ("result" IN ('ALLOW','HOLD','REJECT','STALE'));
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_entryMode_check" CHECK ("entryMode" IN ('standard','direct_entry','transfer'));
COMMIT;
