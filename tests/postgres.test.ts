import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { PostgresPlayerRepository } from "../packages/database/src";
import { validGuestFixture } from "../packages/testing/src";
describe.skipIf(!process.env.TEST_DATABASE_URL)(
  "PostgreSQL repository (disposable migrated database only)",
  () => {
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
