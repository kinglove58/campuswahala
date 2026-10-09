import { PrismaClient } from "@prisma/client";
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
