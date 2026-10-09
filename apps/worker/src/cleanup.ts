import type { PlayerRepository } from "@campuswahala/domain";
import { log } from "@campuswahala/observability";
export async function cleanupGuests(
  repository: PlayerRepository,
  clock: () => number = Date.now,
  batchSize = 500,
  maxBatches = 10,
): Promise<number> {
  if (!Number.isInteger(maxBatches) || maxBatches < 1 || maxBatches > 100)
    throw new Error("INVALID_CLEANUP_BUDGET");
  const before = new Date(clock());
  let deleted = 0;
  for (let i = 0; i < maxBatches; i++) {
    const count = await repository.deleteExpired(before, batchSize);
    deleted += count;
    if (count < batchSize) break;
  }
  log({ service: "worker", event: "guest_cleanup_completed", deleted });
  return deleted;
}
