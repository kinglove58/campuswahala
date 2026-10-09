-- Preserve existing guests; remove arithmetic, leaving bounded compatibility stage codes.
BEGIN;
ALTER TABLE "GuestPlayer" DROP CONSTRAINT "GuestPlayer_level_check";
-- PostgreSQL named the original multi-column inline CHECK at table scope.
ALTER TABLE "GuestPlayer" DROP CONSTRAINT "GuestPlayer_check";
ALTER TABLE "GuestPlayer" ADD CONSTRAINT "GuestPlayer_level_check" CHECK ("level" BETWEEN 1 AND 9999);
ALTER TABLE "GuestPlayer" ADD CONSTRAINT "GuestPlayer_durationYears_check" CHECK ("durationYears" BETWEEN 1 AND 12);
CREATE INDEX "GuestPlayer_expiry_id_idx" ON "GuestPlayer"("expiresAt", "id");
COMMIT;
