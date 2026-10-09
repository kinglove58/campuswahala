import { PrismaClient } from "@prisma/client";
export { PrismaClient, Prisma } from "@prisma/client";
import {
  createGuestSchema,
  type GuestPlayer,
  type GuestRecord,
  type PlayerRepository,
} from "@campuswahala/domain";
export class PostgresPlayerRepository implements PlayerRepository {
  private readonly client: PrismaClient;
  constructor(url: string) {
    this.client = new PrismaClient({ datasources: { db: { url } } });
  }
  async create(record: GuestRecord): Promise<void> {
    await this.client.guestPlayer.create({
      data: {
        ...record.player,
        tokenHash: record.tokenHash,
        createdAt: new Date(record.player.createdAt),
        expiresAt: new Date(record.player.expiresAt),
      },
    });
  }
  async findByTokenHash(hash: string): Promise<GuestPlayer | null> {
    const row = await this.client.guestPlayer.findUnique({
      where: { tokenHash: hash },
    });
    if (!row) return null;
    return {
      ...createGuestSchema.parse({
        campusId: row.campusId,
        programmeId: row.programmeId,
        level: row.level,
        durationYears: row.durationYears,
        avatar: row.avatar,
        nickname: row.nickname,
      }),
      id: row.id,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    };
  }
  async deleteByTokenHash(hash: string): Promise<void> {
    await this.client.guestPlayer.deleteMany({ where: { tokenHash: hash } });
  }
  async deleteExpired(before: Date, batchSize: number): Promise<number> {
    if (
      !Number.isInteger(batchSize) ||
      batchSize < 1 ||
      batchSize > 1000 ||
      !Number.isFinite(before.getTime())
    )
      throw new Error("INVALID_CLEANUP_BATCH");
    const rows = await this.client.$queryRaw<Array<{ id: string }>>`
      WITH expired AS (SELECT "id" FROM "GuestPlayer" WHERE "expiresAt" <= ${before}
        ORDER BY "expiresAt", "id" LIMIT ${batchSize} FOR UPDATE SKIP LOCKED)
      DELETE FROM "GuestPlayer" USING expired WHERE "GuestPlayer"."id" = expired."id" RETURNING "GuestPlayer"."id"`;
    return rows.length;
  }
  async ready(): Promise<boolean> {
    try {
      await this.client.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
  async close(): Promise<void> {
    await this.client.$disconnect();
  }
}
