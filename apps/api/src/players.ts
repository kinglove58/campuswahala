import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
  Inject,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  createGuestSchema,
  type GuestPlayer,
  type GuestRecord,
  type PlayerRepository,
} from "@campuswahala/domain";
import { validAcademicPosition } from "@campuswahala/campus-content";
import {
  hashGuestToken,
  issueGuestToken,
  validGuestToken,
} from "@campuswahala/auth";
export const REPOSITORY = Symbol("PLAYER_REPOSITORY");
export const HASH_KEY = Symbol("HASH_KEY");
export class MemoryPlayerRepository implements PlayerRepository {
  private readonly records = new Map<string, GuestRecord>();
  constructor(
    private readonly now: () => number = Date.now,
    private readonly capacity = 1000,
  ) {}
  async create(record: GuestRecord): Promise<void> {
    for (const [key, value] of this.records)
      if (Date.parse(value.player.expiresAt) <= this.now())
        this.records.delete(key);
    if (this.records.size >= this.capacity)
      throw new ServiceUnavailableException("GUEST_CAPACITY_REACHED");
    this.records.set(record.tokenHash, structuredClone(record));
  }
  async findByTokenHash(hash: string): Promise<GuestPlayer | null> {
    return structuredClone(this.records.get(hash)?.player ?? null);
  }
  async deleteByTokenHash(hash: string): Promise<void> {
    this.records.delete(hash);
  }
  async deleteExpired(before: Date, batchSize: number): Promise<number> {
    if (
      !Number.isInteger(batchSize) ||
      batchSize < 1 ||
      batchSize > 1000 ||
      !Number.isFinite(before.getTime())
    )
      throw new Error("INVALID_CLEANUP_BATCH");
    let deleted = 0;
    for (const [key, value] of this.records) {
      if (deleted >= batchSize) break;
      if (Date.parse(value.player.expiresAt) <= before.getTime()) {
        this.records.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
  async ready(): Promise<boolean> {
    return true;
  }
  async close(): Promise<void> {
    this.records.clear();
  }
}
@Injectable()
export class PlayerService {
  constructor(
    @Inject(REPOSITORY) private readonly repository: PlayerRepository,
    @Inject(HASH_KEY) private readonly key: string,
  ) {}
  async create(
    input: unknown,
  ): Promise<{ player: GuestPlayer; token: string }> {
    const parsed = createGuestSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException("INVALID_PLAYER_INPUT");
    if (!validAcademicPosition(parsed.data))
      throw new BadRequestException("UNKNOWN_PROGRAMME");
    const token = issueGuestToken();
    const now = Date.now();
    const player = {
      ...parsed.data,
      id: randomUUID(),
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + 86400000).toISOString(),
    };
    await this.repository.create({
      player,
      tokenHash: hashGuestToken(token, this.key),
    });
    return { player, token };
  }
  async self(token: unknown): Promise<GuestPlayer> {
    if (!validGuestToken(token))
      throw new UnauthorizedException("INVALID_GUEST_SESSION");
    const hash = hashGuestToken(token, this.key);
    const player = await this.repository.findByTokenHash(hash);
    if (!player || Date.parse(player.expiresAt) <= Date.now()) {
      if (player) await this.repository.deleteByTokenHash(hash);
      throw new UnauthorizedException("GUEST_SESSION_EXPIRED");
    }
    return player;
  }
  async revoke(token: unknown): Promise<void> {
    if (!validGuestToken(token))
      throw new UnauthorizedException("INVALID_GUEST_SESSION");
    await this.repository.deleteByTokenHash(hashGuestToken(token, this.key));
  }
}
