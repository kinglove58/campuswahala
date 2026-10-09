import {
  createCampusWorld,
  isCampus,
  parseWorldState,
  safeLocation,
  defaultAppearance,
  parseAppearance,
} from "@campuswahala/game-engine";
import {
  BadRequestException,
  UnauthorizedException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { PrismaClient, Prisma } from "@campuswahala/database";
import {
  hashGuestToken,
  issueGuestToken,
  validGuestToken,
  challenge,
  equalSecret,
  LocalIdentityProvider,
  EntraExternalIdentityProvider,
  type BrowserIdentityProvider,
} from "@campuswahala/auth";
import type { AppConfig } from "@campuswahala/config";
import {
  accountBeginSchema,
  accountCallbackSchema,
  privacyInputSchema,
} from "@campuswahala/domain";
export class AccountService {
  readonly db: PrismaClient | null;
  readonly provider: BrowserIdentityProvider | null;
  constructor(
    private readonly config: AppConfig,
    private readonly key: string,
    db?: PrismaClient,
    provider?: BrowserIdentityProvider,
  ) {
    this.db =
      db ??
      (config.PLAYER_STORE === "postgres"
        ? new PrismaClient({
            datasources: { db: { url: config.DATABASE_URL! } },
          })
        : null);
    this.provider =
      provider ??
      (config.AUTH_PROVIDER === "local"
        ? new LocalIdentityProvider(config.APP_ENV)
        : config.AUTH_PROVIDER === "entra"
          ? new EntraExternalIdentityProvider({
              issuer: config.ENTRA_ISSUER!,
              clientId: config.ENTRA_CLIENT_ID!,
              authorizationEndpoint: config.ENTRA_AUTHORIZATION_ENDPOINT!,
              tokenEndpoint: config.ENTRA_TOKEN_ENDPOINT!,
              jwksUri: config.ENTRA_JWKS_URI!,
              clientSecret: config.ENTRA_CLIENT_SECRET,
            })
          : null);
  }
  private database() {
    if (!this.db)
      throw new ServiceUnavailableException("ACCOUNT_DATABASE_REQUIRED");
    return this.db;
  }
  hash(token: string) {
    return hashGuestToken(token, this.key);
  }
  async begin(input: unknown, client: string) {
    const parsed = accountBeginSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException("INVALID_AUTH_INPUT");
    if (!this.provider)
      throw new ServiceUnavailableException("IDENTITY_NOT_CONFIGURED");
    const c = challenge(`${this.config.GAME_ORIGIN}/api/account/callback`);
    await this.database().loginAttempt.create({
      data: {
        stateHash: this.hash(c.state),
        clientHash: this.hash(client),
        provider: this.provider.name,
        nonce: c.nonce,
        verifier: c.verifier,
        redirectUri: c.redirectUri,
        ageBand: parsed.data.ageBand,
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    return {
      authorizationUrl: this.provider.authorizationUrl(c),
      provider: this.provider.name,
    };
  }
  async callback(input: unknown, client: string, previousSession?: string) {
    const parsed = accountCallbackSchema.safeParse(input);
    if (!parsed.success || !this.provider)
      throw new UnauthorizedException("AUTH_CALLBACK_REJECTED");
    const db = this.database();
    const attempt = await db.loginAttempt.findUnique({
      where: { stateHash: this.hash(parsed.data.state) },
    });
    if (
      !attempt ||
      attempt.consumedAt ||
      attempt.expiresAt <= new Date() ||
      attempt.provider !== this.provider.name ||
      !equalSecret(attempt.clientHash, this.hash(client))
    )
      throw new UnauthorizedException("AUTH_STATE_REJECTED");
    const consumed = await db.loginAttempt.updateMany({
      where: {
        stateHash: attempt.stateHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { consumedAt: new Date() },
    });
    if (consumed.count !== 1)
      throw new UnauthorizedException("AUTH_REPLAY_REJECTED");
    let identity;
    try {
      identity = await this.provider.exchange(parsed.data.code, {
        state: parsed.data.state,
        nonce: attempt.nonce,
        verifier: attempt.verifier,
        redirectUri: attempt.redirectUri,
      });
    } catch {
      throw new UnauthorizedException("IDENTITY_VERIFICATION_FAILED");
    }
    const token = issueGuestToken();
    const user = await db.$transaction(async (tx) => {
      // Serialize first-time linking across API requests without trusting email or client identifiers.
      const identityLock = BigInt.asIntN(
        64,
        BigInt(
          `0x${this.hash(`${identity.provider}\n${identity.subject}`).slice(0, 16)}`,
        ),
      );
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(${identityLock})::text`;
      const existing = await tx.externalIdentity.findUnique({
        where: { provider_subject: identity },
        include: { user: true },
      });
      const user =
        existing?.user ??
        (await tx.user.create({
          data: {
            identities: { create: identity },
            profile: {
              create: {
                ageBand: attempt.ageBand,
                consentVersion: "privacy-2026-10-09",
              },
            },
            privacy: { create: {} },
          },
        }));
      if (user.status !== "active")
        throw new UnauthorizedException("ACCOUNT_UNAVAILABLE");
      if (validGuestToken(previousSession))
        await tx.userSession.updateMany({
          where: { tokenHash: this.hash(previousSession) },
          data: { revokedAt: new Date() },
        });
      await tx.userSession.create({
        data: {
          userId: user.id,
          tokenHash: this.hash(token),
          expiresAt: new Date(Date.now() + 7 * 86400000),
        },
      });
      return user;
    });
    return { token, userId: user.id };
  }
  async principal(token: unknown) {
    if (!validGuestToken(token))
      throw new UnauthorizedException("INVALID_ACCOUNT_SESSION");
    const session = await this.database().userSession.findUnique({
      where: { tokenHash: this.hash(token) },
      include: { user: true },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt <= new Date() ||
      session.user.status !== "active"
    )
      throw new UnauthorizedException("ACCOUNT_SESSION_EXPIRED");
    return session.user;
  }
  async self(token: unknown) {
    const user = await this.principal(token);
    const db = this.database();
    const [profile, privacy, character] = await Promise.all([
      db.userProfile.findUnique({
        where: { userId: user.id },
        select: { ageBand: true, consentVersion: true },
      }),
      db.userPrivacySettings.findUnique({
        where: { userId: user.id },
        select: {
          visibility: true,
          discoverable: true,
          analyticsConsent: true,
        },
      }),
      this.character(user.id),
    ]);
    return { profile, privacy, character };
  }
  async character(userId: string) {
    const row = await this.database().playerCharacter.findUnique({
      where: { userId },
      include: { campus: true, programme: true, stage: true },
    });
    if (!row) return null;
    // Compatibility view keeps the current world alive; canonical UUID position remains explicit.
    return {
      id: row.id,
      campusId: row.campus.slug,
      programmeId: row.programme.slug,
      level: Number(row.stage.displayCode),
      durationYears: row.durationYears,
      avatar: row.avatar,
      nickname: row.nickname,
      createdAt: row.createdAt.toISOString(),
      position: {
        campusId: row.campusId,
        programmeId: row.programmeId,
        structureId: row.structureId,
        structureVersion: row.structureVersion,
        stageId: row.stageId,
        semesterId: row.semesterId,
        entryMode: row.entryMode,
      },
      preferences: row.preferences,
    };
  }
  async convert(token: unknown, guestToken: unknown) {
    const user = await this.principal(token);
    if (!validGuestToken(guestToken))
      throw new UnauthorizedException("GUEST_OWNERSHIP_REQUIRED");
    const hash = this.hash(guestToken);
    const db = this.database();
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`;
      const current = await tx.user.findUniqueOrThrow({
        where: { id: user.id },
      });
      if (current.status !== "active")
        throw new UnauthorizedException("ACCOUNT_UNAVAILABLE");
      const receipt = await tx.guestConversion.findUnique({
        where: { tokenHash: hash },
      });
      if (receipt) {
        if (receipt.userId !== user.id || receipt.expiresAt <= new Date())
          throw new UnauthorizedException("GUEST_ALREADY_CONSUMED");
        return;
      }
      await tx.$queryRaw`SELECT "id" FROM "GuestPlayer" WHERE "tokenHash" = ${hash} FOR UPDATE`;
      const guest = await tx.guestPlayer.findUnique({
        where: { tokenHash: hash },
      });
      if (!guest || guest.expiresAt <= new Date())
        throw new UnauthorizedException("GUEST_SESSION_EXPIRED");
      const existing = await tx.playerCharacter.findUnique({
        where: { userId: user.id },
      });
      if (!existing) {
        const campus = await tx.campus.findUnique({
          where: { slug: guest.campusId },
        });
        const programme = await tx.programme.findFirst({
          where: {
            slug: guest.programmeId,
            department: {
              faculty: {
                campusId: campus?.id ?? "00000000-0000-0000-0000-000000000000",
              },
            },
          },
          include: {
            structures: {
              orderBy: { version: "desc" },
              include: { stages: true },
            },
          },
        });
        const structure = programme?.structures[0];
        const stage = structure?.stages.find(
          (s) =>
            s.displayCode === String(guest.level) &&
            s.entryModes.includes("standard"),
        );
        if (!campus || !programme || !structure || !stage)
          throw new BadRequestException("CATALOGUE_POSITION_UNAVAILABLE");
        await tx.playerCharacter.create({
          data: {
            userId: user.id,
            campusId: campus.id,
            programmeId: programme.id,
            structureId: structure.id,
            structureVersion: structure.version,
            stageId: stage.id,
            entryMode: "standard",
            nickname: guest.nickname,
            avatar: guest.avatar,
            durationYears: guest.durationYears,
          },
        });
      }
      await tx.guestConversion.create({
        data: {
          tokenHash: hash,
          userId: user.id,
          outcome: existing ? "existing_character_kept" : "converted",
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
      const guestActor = this.hash(`feedback:${guestToken}`);
      const userActor = this.hash(`feedback:${user.id}`);
      // Preserve guest reports as private account data; an existing account report wins on duplicates.
      await tx.$executeRaw`DELETE FROM "FactFeedback" guest USING "FactFeedback" own
        WHERE guest."actorHash" = ${guestActor} AND own."actorHash" = ${userActor} AND guest."factId" = own."factId"`;
      await tx.factFeedback.updateMany({
        where: { actorHash: guestActor, userId: null },
        data: { userId: user.id, actorHash: userActor },
      });
      await tx.guestPlayer.delete({ where: { id: guest.id } });
    });
    return { character: await this.character(user.id), converted: true };
  }
  async privacy(token: unknown, input: unknown) {
    const user = await this.principal(token);
    const parsed = privacyInputSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException("INVALID_PRIVACY_INPUT");
    return this.database().$transaction(async (tx) => {
      const profile = await tx.userProfile.findUniqueOrThrow({
        where: { userId: user.id },
      });
      const band = parsed.data.ageBand ?? profile.ageBand;
      await tx.userProfile.update({
        where: { userId: user.id },
        data: { ageBand: band, consentVersion: "privacy-2026-10-09" },
      });
      await tx.userPrivacySettings.update({
        where: { userId: user.id },
        data: {
          visibility: "private",
          discoverable: false,
          analyticsConsent:
            band === "18_or_over" && parsed.data.analyticsConsent === true,
        },
      });
      return { updated: true };
    });
  }
  async logout(token: unknown) {
    await this.principal(token);
    await this.database().userSession.updateMany({
      where: { tokenHash: this.hash(String(token)) },
      data: { revokedAt: new Date() },
    });
    return { revoked: true };
  }
  async requestDeletion(token: unknown) {
    const user = await this.principal(token);
    await this.database().$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { status: "deletion_pending" },
      });
      await tx.userSession.updateMany({
        where: { userId: user.id },
        data: { revokedAt: new Date() },
      });
      await tx.deletionRequest.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });
    });
    return { deletionRequested: true };
  }
  async publishedCatalogue() {
    if (!this.db) return { facts: [] };
    const rows = await this.db.campusFact.findMany({
      where: {
        status: "published",
        staleAt: { gt: new Date() },
        currentVersionId: { not: null },
      },
      take: 100,
      include: {
        campus: { select: { slug: true } },
        currentVersion: {
          include: {
            evidence: {
              include: {
                evidence: {
                  include: {
                    observation: {
                      include: { source: { select: { url: true } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    return {
      facts: rows.map((row) => ({
        id: row.id,
        campus: row.campus.slug,
        category: row.currentVersion!.category,
        key: row.key,
        value: row.currentVersion!.value,
        lastObservedAt: row.currentVersion!.lastObservedAt,
        staleAt: row.staleAt,
        sources: [
          ...new Set(
            row.currentVersion!.evidence.map(
              (e) => e.evidence.observation.source.url,
            ),
          ),
        ],
      })),
    };
  }
  async worldState(token: unknown) {
    const user = await this.principal(token);
    const db = this.database();
    const character = await this.character(user.id);
    if (!character || !isCampus(character.campusId))
      throw new BadRequestException("CHARACTER_REQUIRED");
    const row = await db.playerWorldState.findUnique({
      where: { userId: user.id },
    });
    const campusId =
      row && isCampus(row.campusId) ? row.campusId : character.campusId;
    const world = createCampusWorld(campusId);
    let appearance = {
      ...defaultAppearance,
      top: character.avatar as typeof defaultAppearance.top,
    };
    if (row) {
      try {
        appearance = parseAppearance(row.appearance);
      } catch {
        /* Safe cosmetic migration default. */
      }
    }
    return { ...safeLocation(world, row), appearance };
  }
  async saveWorldState(token: unknown, input: unknown) {
    const user = await this.principal(token);
    const campusId =
      input && typeof input === "object" && "campusId" in input
        ? input.campusId
        : null;
    if (!isCampus(campusId))
      throw new BadRequestException("INVALID_WORLD_STATE");
    let state;
    try {
      state = parseWorldState(input, createCampusWorld(campusId));
    } catch {
      throw new BadRequestException("INVALID_WORLD_STATE");
    }
    return this.database().$transaction(async (tx) => {
      // Serialize with deletion and guest conversion. Browser cannot choose owner or coordinates.
      await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`;
      const active = await tx.user.findUnique({ where: { id: user.id } });
      const session = await tx.userSession.findUnique({
        where: { tokenHash: this.hash(String(token)) },
      });
      if (
        active?.status !== "active" ||
        !session ||
        session.revokedAt ||
        session.expiresAt <= new Date()
      )
        throw new UnauthorizedException("ACCOUNT_UNAVAILABLE");
      if (
        !(await tx.playerCharacter.findUnique({ where: { userId: user.id } }))
      )
        throw new BadRequestException("CHARACTER_REQUIRED");
      const data = { ...state, appearance: { ...state.appearance } };
      await tx.playerWorldState.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...data },
        update: data,
      });
      return state;
    });
  }
  async close() {
    await this.db?.$disconnect();
  }
}
export type AccountTransaction = Prisma.TransactionClient;
