import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { Prisma, type PrismaClient } from "@campuswahala/database";
import { createCampusWorld, isCampus } from "@campuswahala/game-engine";
import {
  academicCommandSchema,
  AcademicError,
  createTerm,
  simulationCourses,
  applyAcademicCommand,
  completeResults,
  allowedActions,
  academicNotifications,
  type AcademicTerm,
  type AcademicHistory,
  type AcademicView,
  type CourseTemplate,
  type ProgressionDecision,
} from "@campuswahala/domain";
import { AccountService } from "./accounts";

const json = (value: object): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
function snapshot(value: Prisma.JsonValue): AcademicTerm {
  // DB is a trusted private persistence boundary; fail closed on unknown schema.
  const term = value as unknown as AcademicTerm;
  if (
    !term ||
    term.schemaVersion !== 1 ||
    !["active", "completed"].includes(term.status)
  )
    throw new ServiceUnavailableException("ACADEMIC_REVISION_UNAVAILABLE");
  return structuredClone(term);
}
function carryovers(value: Prisma.JsonValue): CourseTemplate[] {
  if (!Array.isArray(value) || value.length > 12)
    throw new ServiceUnavailableException("ACADEMIC_REVISION_UNAVAILABLE");
  return value as unknown as CourseTemplate[];
}
export class AcademicService {
  constructor(private readonly accounts: AccountService) {}
  private database(): PrismaClient {
    if (!this.accounts.db)
      throw new ServiceUnavailableException("ACADEMIC_DATABASE_REQUIRED");
    return this.accounts.db;
  }
  /** Same User lock order as deletion/conversion. Revalidate session inside lock. */
  private async locked<T>(
    token: unknown,
    action: (tx: Prisma.TransactionClient, userId: string) => Promise<T>,
  ) {
    const user = await this.accounts.principal(token);
    return this.database().$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${user.id}::uuid FOR UPDATE`;
        const active = await tx.user.findUnique({ where: { id: user.id } });
        const session = await tx.userSession.findUnique({
          where: { tokenHash: this.accounts.hash(String(token)) },
        });
        if (
          active?.status !== "active" ||
          !session ||
          session.userId !== user.id ||
          session.revokedAt ||
          session.expiresAt <= new Date()
        )
          throw new UnauthorizedException("ACCOUNT_SESSION_EXPIRED");
        return action(tx, user.id);
      },
      { maxWait: 10000, timeout: 15000 },
    );
  }
  private async readView(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<AcademicView> {
    const character = await tx.playerCharacter.findUnique({
      where: { userId },
      include: { programme: true, stage: true, semester: true },
    });
    if (!character) throw new BadRequestException("CHARACTER_REQUIRED");
    const state = await tx.academicSimulation.findUnique({ where: { userId } });
    const rows = await tx.academicTerm.findMany({
      where: { userId },
      orderBy: { sequence: "asc" },
      take: 100,
    });
    const terms = rows.map((r) => snapshot(r.snapshot)),
      term = terms.at(-1) ?? null;
    const history = terms
      .filter((t) => t.status === "completed")
      .map(
        (t): AcademicHistory => ({
          termId: t.id,
          sequence: t.sequence,
          label: t.label,
          stageId: t.stageId,
          semesterId: t.semesterId,
          result: t.result!,
          progression: t.progression!,
        }),
      );
    const canStart =
      term?.progression?.outcome !== "hold" &&
      ["computing-demo", "engineering-demo"].includes(
        character.programme.slug,
      ) &&
      character.stage.entryModes.includes(character.entryMode);
    return {
      revision: state?.revision ?? 0,
      term,
      history,
      carryovers: state ? carryovers(state.carryovers) : [],
      allowedActions: canStart
        ? allowedActions(term)
        : term?.status === "active"
          ? allowedActions(term)
          : [],
      notifications: academicNotifications(term),
      position: {
        programme: character.programme.name,
        stage: character.stage.label,
        semester: character.semester?.label ?? "First simulation semester",
        entryMode: character.entryMode,
        activityTags: character.stage.activityTags,
      },
    };
  }
  async read(token: unknown) {
    return this.locked(token, (tx, id) => this.readView(tx, id));
  }
  async command(token: unknown, input: unknown) {
    const parsed = academicCommandSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestException("INVALID_ACADEMIC_COMMAND");
    const command = parsed.data;
    const hash = createHash("sha256")
      .update(JSON.stringify(command))
      .digest("hex");
    try {
      return await this.locked(token, async (tx, userId) => {
        const old = await tx.academicCommandReceipt.findUnique({
          where: { userId_commandId: { userId, commandId: command.commandId } },
        });
        if (old) {
          if (old.requestHash !== hash)
            throw new ConflictException("IDEMPOTENCY_CONFLICT");
          return {
            receipt: old.result,
            state: await this.readView(tx, userId),
          };
        }
        const character = await tx.playerCharacter.findUnique({
          where: { userId },
          include: {
            campus: true,
            programme: true,
            stage: true,
            structure: {
              include: {
                stages: { orderBy: { order: "asc" } },
                semesters: { orderBy: { order: "asc" } },
              },
            },
          },
        });
        if (!character) throw new BadRequestException("CHARACTER_REQUIRED");
        const state = await tx.academicSimulation.upsert({
          where: { userId },
          create: { userId, characterId: character.id },
          update: {},
        });
        if (state.characterId !== character.id)
          throw new ConflictException("CHARACTER_REVISION_CONFLICT");
        const latest = await tx.academicTerm.findFirst({
          where: { userId },
          orderBy: { sequence: "desc" },
        });
        let term: AcademicTerm;
        if (command.type === "START_TERM") {
          if (latest?.status === "active")
            throw new ConflictException("ACTIVE_TERM_EXISTS");
          if (
            latest &&
            snapshot(latest.snapshot).progression?.outcome === "hold"
          )
            throw new ConflictException("PROGRESSION_HOLD");
          const track =
            character.programme.slug === "computing-demo"
              ? "computing"
              : character.programme.slug === "engineering-demo"
                ? "engineering"
                : null;
          if (!track || !isCampus(character.campus.slug))
            throw new BadRequestException("SIMULATION_TRACK_UNAVAILABLE");
          if (
            character.structure.version !== character.structureVersion ||
            character.stage.structureId !== character.structureId ||
            !character.stage.entryModes.includes(character.entryMode)
          )
            throw new BadRequestException("ACADEMIC_POSITION_UNAVAILABLE");
          const semesters = character.structure.semesters.filter(
            (s) => s.stageId === character.stageId,
          );
          const semester = character.semesterId
            ? semesters.find((s) => s.id === character.semesterId)
            : semesters[0];
          if (!semester)
            throw new BadRequestException("SEMESTER_TEMPLATE_UNAVAILABLE");
          const sequence = (latest?.sequence ?? 0) + 1;
          if (sequence > 100)
            throw new ConflictException("SIMULATION_HISTORY_CAPACITY");
          const world = createCampusWorld(character.campus.slug);
          const venues = world.venues.map((v) => {
            const spawn = world.spawnPoints.find(
              (s) => s.id === v.safeSpawnId,
            )!;
            return {
              id: v.id,
              name: v.name,
              type: v.type,
              x: spawn.x,
              y: spawn.y,
            };
          });
          const outstanding = carryovers(state.carryovers);
          const templates = [
            ...outstanding,
            ...simulationCourses(
              track,
              character.stage.order,
              semester.order,
            ).filter((c) => !outstanding.some((o) => o.id === c.id)),
          ];
          term = createTerm({
            id: randomUUID(),
            sequence,
            label: `${character.stage.label} · ${semester.label} · Attempt ${sequence}`,
            track,
            programmeId: character.programmeId,
            structureId: character.structureId,
            structureVersion: character.structureVersion,
            stageId: character.stageId,
            semesterId: semester.id,
            entryMode: character.entryMode,
            activityTags: character.stage.activityTags,
            campusId: world.campusId,
            worldVersion: world.version,
            presenceVenueId:
              venues.find((v) => v.type === "hostel")?.id ?? venues[0]!.id,
            venues,
            studyVenueIds: venues
              .filter((v) => ["library", "hostel"].includes(v.type))
              .map((v) => v.id),
            templates,
          });
          term.courses.forEach(
            (c) => (c.carryover = outstanding.some((o) => o.id === c.id)),
          );
          await tx.academicTerm.create({
            data: {
              id: term.id,
              userId,
              sequence,
              status: "active",
              snapshot: json(term),
            },
          });
          await tx.playerCharacter.update({
            where: { id: character.id },
            data: { semesterId: semester.id },
          });
        } else {
          if (!latest) throw new ConflictException("START_TERM_REQUIRED");
          term = snapshot(latest.snapshot);
          if (command.termId !== term.id)
            throw new ConflictException("TERM_REVISION_CONFLICT");
          if (command.type === "COMPLETE_TERM") {
            const view = await this.readView(tx, userId);
            const result = completeResults(term, view.history);
            const outstanding = term.courses
              .filter((c) => !c.result!.passed)
              .map(
                (c): CourseTemplate => ({
                  id: c.id,
                  code: c.code,
                  title: c.title,
                  version: c.version,
                  units: c.units,
                  difficulty: c.difficulty,
                  requiredEffort: c.requiredEffort,
                  weights: c.weights,
                }),
              );
            const failedUnits = outstanding.reduce((n, c) => n + c.units, 0);
            const semesters = character.structure.semesters.filter(
              (s) => s.stageId === term.stageId,
            );
            const semester = semesters.find((s) => s.id === term.semesterId);
            if (!semester)
              throw new ConflictException("ACADEMIC_POSITION_UNAVAILABLE");
            const nextSemester = semesters.find(
              (s) => s.order > semester.order,
            );
            const nextStage = character.structure.stages.find(
              (s) => s.order > character.stage.order,
            );
            const repeat =
              failedUnits * 10000 >=
              result.attemptedUnits *
                term.progressionPolicy.repeatFailedUnitsBasisPoints;
            const targetStage = repeat
              ? character.stage
              : nextSemester
                ? character.stage
                : nextStage;
            const targetSemester = repeat
              ? semesters[0]
              : (nextSemester ??
                character.structure.semesters.find(
                  (s) => s.stageId === nextStage?.id,
                ));
            const decision: ProgressionDecision = {
              outcome:
                !targetStage || !targetSemester
                  ? "hold"
                  : repeat
                    ? "repeat_stage"
                    : outstanding.length
                      ? "progress_with_carryovers"
                      : "progress",
              reason:
                !targetStage || !targetSemester
                  ? "Configured programme stages completed; future activity review required."
                  : repeat
                    ? "Failed-unit threshold reached under CampusWahala simulation rules."
                    : outstanding.length
                      ? "Continue with outstanding simulation courses."
                      : "Simulation term passed.",
              nextStageId: targetStage?.id ?? character.stageId,
              nextSemesterId: targetSemester?.id ?? term.semesterId,
              activityTags:
                targetStage?.activityTags ?? character.stage.activityTags,
              policyId: term.progressionPolicy.id,
              policyVersion: term.progressionPolicy.version,
            };
            term.progression = decision;
            await tx.academicSimulation.update({
              where: { userId },
              data: { carryovers: json(outstanding) },
            });
            await tx.playerCharacter.update({
              where: { id: character.id },
              data: {
                stageId: decision.nextStageId,
                semesterId: decision.nextSemesterId,
              },
            });
          } else applyAcademicCommand(term, command);
          await tx.academicTerm.update({
            where: { id: term.id },
            data: { status: term.status, snapshot: json(term) },
          });
        }
        // Bounded compact receipts retain exact acknowledgement, never evict a key
        // and execute it again. Capacity rejects safely; deletion cascades all data.
        if (
          (await tx.academicCommandReceipt.count({
            where: { userId, termId: term.id },
          })) >= 2000
        )
          throw new ConflictException("COMMAND_RECEIPT_CAPACITY");
        const revision = state.revision + 1;
        await tx.academicSimulation.update({
          where: { userId },
          data: { revision },
        });
        const receipt = {
          commandId: command.commandId,
          type: command.type,
          termId: term.id,
          academicMinute: term.minute,
          revision,
          status: term.status,
        };
        await tx.academicCommandReceipt.create({
          data: {
            userId,
            commandId: command.commandId,
            requestHash: hash,
            type: command.type,
            termId: term.id,
            academicMinute: term.minute,
            revision,
            result: json(receipt),
          },
        });
        return { receipt, state: await this.readView(tx, userId) };
      });
    } catch (error) {
      if (error instanceof AcademicError)
        throw new ConflictException(error.message);
      throw error;
    }
  }
}
