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
    level: z.number().int().min(100).max(1200).multipleOf(100),
    durationYears: z.number().int().min(1).max(12),
    avatar: avatarSchema,
    nickname: nicknameSchema,
  })
  .strict()
  .refine((v) => v.level / 100 <= v.durationYears, {
    message: "Level must fit your duration",
    path: ["level"],
  });
export type GuestInput = z.infer<typeof createGuestSchema>;
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
  ready(): Promise<boolean>;
  close(): Promise<void>;
}
