import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PostgresPlayerRepository } from "../packages/database/src";
import { validGuestFixture } from "../packages/testing/src";
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "PostgreSQL repository (disposable migrated database only)",
  () => {
    it("deletes bounded expired batches concurrently and preserves active/nonstandard guests", async () => {
      const repo = new PostgresPlayerRepository(process.env.TEST_DATABASE_URL!);
      const cutoff = new Date("2020-01-01T00:00:00Z");
      const hashes = Array.from({ length: 5 }, () =>
        randomUUID().replaceAll("-", "").padEnd(64, "b"),
      );
      try {
        for (const [i, tokenHash] of hashes.entries())
          await repo.create({
            tokenHash,
            player: {
              ...validGuestFixture,
              level: 42,
              durationYears: 1,
              id: randomUUID(),
              createdAt: new Date(0).toISOString(),
              expiresAt: new Date(
                i < 4 ? cutoff.getTime() : Date.now() + 86400000,
              ).toISOString(),
            },
          });
        const counts = await Promise.all([
          repo.deleteExpired(cutoff, 2),
          repo.deleteExpired(cutoff, 2),
        ]);
        expect(counts).toEqual([2, 2]);
        expect(await repo.deleteExpired(cutoff, 2)).toBe(0);
        expect(await repo.findByTokenHash(hashes[4]!)).toMatchObject({
          level: 42,
          durationYears: 1,
        });
        await expect(repo.deleteExpired(cutoff, 1001)).rejects.toThrow();
      } finally {
        for (const hash of hashes) await repo.deleteByTokenHash(hash);
        await repo.close();
      }
    });
    it("persists, reads and deletes a guest without exposing token hash", async () => {
      const repo = new PostgresPlayerRepository(process.env.TEST_DATABASE_URL!);
      const tokenHash = randomUUID().replaceAll("-", "").padEnd(64, "a");
      const player = {
        ...validGuestFixture,
        id: randomUUID(),
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      };
      try {
        expect(await repo.ready()).toBe(true);
        await repo.create({ player, tokenHash });
        expect(await repo.findByTokenHash(tokenHash)).toEqual(player);
        await repo.deleteByTokenHash(tokenHash);
        expect(await repo.findByTokenHash(tokenHash)).toBeNull();
      } finally {
        await repo.deleteByTokenHash(tokenHash);
        await repo.close();
      }
    });
  },
);
