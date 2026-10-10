import { PrismaClient } from "@campuswahala/database";
export async function cleanupAccounts(db: PrismaClient, now = new Date()) {
  const deletedAccounts = await db.$transaction(async (tx) => {
    const requests = await tx.$queryRaw<Array<{ id: string; userId: string }>>`
      SELECT "id", "userId" FROM "DeletionRequest"
      WHERE "completedAt" IS NULL AND "userId" IS NOT NULL
      ORDER BY "requestedAt", "id" LIMIT 100 FOR UPDATE SKIP LOCKED`;
    let completed = 0;
    for (const request of requests) {
      const locked = await tx.$queryRaw<Array<{ id: string }>>`SELECT "id" FROM "User" WHERE "id" = ${request.userId}::uuid FOR UPDATE SKIP LOCKED`;
      if (!locked.length) continue;
      const user = await tx.user.findUnique({ where: { id: request.userId } });
      if (user?.status !== "deletion_pending") continue;
      await tx.factFeedback.deleteMany({ where: { userId: request.userId } });
      const deleted = await tx.user.deleteMany({ where: { id: request.userId, status: "deletion_pending" } });
      if (deleted.count === 1) {
        await tx.deletionRequest.update({ where: { id: request.id }, data: { completedAt: now } });
        completed++;
      }
    }
    return completed;
  });
  await db.loginAttempt.deleteMany({ where: { expiresAt: { lte: now } } });
  await db.factFeedback.deleteMany({
    where: {
      userId: null,
      createdAt: { lte: new Date(now.getTime() - 86400000) },
    },
  });
  await db.guestConversion.deleteMany({ where: { expiresAt: { lte: now } } });
  await db.userSession.deleteMany({
    where: { OR: [{ expiresAt: { lte: now } }, { revokedAt: { not: null } }] },
  });
  return { deletedAccounts };
}

