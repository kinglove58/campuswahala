import { z } from "zod";
// The catalogue authorizes registered IDs; domain contracts only validate their shape.
export const campusIdSchema = z
  .string()
  .min(2)
  .max(20)
  .regex(/^[a-z][a-z0-9-]*$/);
export const avatarSchema = z.enum(["lime", "clay", "blue"]);
export const nicknameSchema = z.enum([
  "Campus Explorer",
  "Future Legend",
  "Quiet Achiever",
  "Creative Spirit",
]);
export const createGuestSchema = z
  .object({
    campusId: campusIdSchema,
    programmeId: z.string().min(1).max(60),
    level: z.number().int().min(1).max(9999),
    durationYears: z.number().int().min(1).max(12),
    avatar: avatarSchema,
    nickname: nicknameSchema,
  })
  .strict();
export type GuestInput = z.infer<typeof createGuestSchema>;
// Phase 1 contract proposal; no academic progression behavior or persistence yet.
export interface AcademicPosition {
  programmeId: string;
  structureId: string;
  structureVersion: number;
  stageId: string;
  academicYearId: string;
  semesterId: string;
  entryMode: "standard" | "direct_entry" | "transfer";
  enrollmentState: "active" | "repeating" | "interrupted" | "deferred";
  attempt: number;
}
export interface AcademicYear {
  id: string;
  label: string;
  semesterIds: string[];
}
export interface GuestPlayer extends GuestInput {
  id: string;
  createdAt: string;
  expiresAt: string;
}
export interface GuestRecord {
  player: GuestPlayer;
  tokenHash: string;
}
export interface PlayerRepository {
  create(record: GuestRecord): Promise<void>;
  findByTokenHash(hash: string): Promise<GuestPlayer | null>;
  deleteByTokenHash(hash: string): Promise<void>;
  deleteExpired(before: Date, batchSize: number): Promise<number>;
  ready(): Promise<boolean>;
  close(): Promise<void>;
}
