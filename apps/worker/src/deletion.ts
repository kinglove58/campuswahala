import { PrismaClient } from "@campuswahala/database";
export async function cleanupAccounts(db: PrismaClient, now = new Date()) {
  const requests = await db.deletionRequest.findMany({
    where: { completedAt: null, userId: { not: null } },
    take: 100,
  });
  for (const request of requests)
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${request.userId}::uuid FOR UPDATE`;
      await tx.factFeedback.deleteMany({ where: { userId: request.userId! } });
      await tx.user.deleteMany({
        where: { id: request.userId!, status: "deletion_pending" },
      });
      await tx.deletionRequest.update({
        where: { id: request.id },
        data: { completedAt: now },
      });
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
  return { deletedAccounts: requests.length };
}
