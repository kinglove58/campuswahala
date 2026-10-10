import {
  BadRequestException,
  ConflictException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { Prisma } from "@campuswahala/database";
import {
  applyLifeCommand,
  applyLifeEffects,
  attachLife,
  advanceLifeState,
  createLife,
  expireWahala,
  lifeActions,
  lifeCommandSchema,
  LifeError,
  selectWahala,
  validateLifeState,
  wahalaTemplateSchema,
  type AcademicTerm,
  type LifeState,
  type LifeView,
  type WahalaOccurrence,
} from "@campuswahala/domain";
import type { AcademicService } from "./academics";
const json = (value: object): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
const readState = (value: Prisma.JsonValue): LifeState => {
  const s = structuredClone(value) as unknown as LifeState;
  try {
    validateLifeState(s);
  } catch {
    throw new ServiceUnavailableException("LIFE_REVISION_UNAVAILABLE");
  }
  return s;
};
export async function lifeHistory(
  tx: Prisma.TransactionClient,
  userId: string,
) {
  const rows = await tx.wahalaOccurrence.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 60,
  });
  return rows.reverse().map((r) => {
    const h = structuredClone(r.snapshot) as unknown as WahalaOccurrence;
    wahalaTemplateSchema.parse(h.template);
    if (h.id !== r.id || h.termId !== r.termId || h.status !== r.status)
      throw new ServiceUnavailableException("WAHALA_REVISION_UNAVAILABLE");
    return h;
  });
}
async function saveHistory(
  tx: Prisma.TransactionClient,
  userId: string,
  history: WahalaOccurrence[],
) {
  if (!history.length) return;
  const stored = await tx.wahalaOccurrence.findMany({
    where: { userId, id: { in: history.map((h) => h.id) } },
    select: { id: true, status: true },
  });
  const byId = new Map(stored.map((h) => [h.id, h]));
  // Clear old pending rows before inserting a replacement; bounded bulk lookup.
  for (const h of history)
    if (byId.get(h.id)?.status === "pending" && h.status !== "pending")
      await tx.wahalaOccurrence.update({
        where: { id: h.id },
        data: { status: h.status, snapshot: json(h) },
      });
  for (const h of history)
    if (!byId.has(h.id))
      await tx.wahalaOccurrence.create({
        data: {
          id: h.id,
          userId,
          termId: h.termId,
          status: h.status,
          snapshot: json(h),
        },
      });
}
/** Called inside the academic User lock/transaction; never opens a second transaction. */
export async function syncAcademicLife(
  tx: Prisma.TransactionClient,
  userId: string,
  characterId: string,
  term: AcademicTerm,
  event: string,
  from: number,
) {
  const row = await tx.lifeSimulation.findUnique({ where: { userId } });
  if (!row && event !== "START_TERM") return;
  if (row && row.characterId !== characterId)
    throw new ConflictException("CHARACTER_REVISION_CONFLICT");
  const state = row ? readState(row.snapshot) : createLife(term),
    history = await lifeHistory(tx, userId);
  if (event === "START_TERM") {
    for (const h of history) if (h.status === "pending") h.status = "expired";
    attachLife(state, term);
  } else {
    if (state.termId !== term.id)
      throw new ConflictException("LIFE_TERM_CONFLICT");
    advanceLifeState(state, from, term.minute);
    if (event === "TRAVEL_TO_VENUE")
      applyLifeEffects(state, {
        energy: -(term.minute - from) * state.policy.travelEnergyPerMinute,
        satiety: 0,
        mood: 0,
        wellbeing: 0,
      });
    expireWahala(history, term.minute);
  }
  state.revision++;
  // No trigger on start, zero-time submissions/completion, GET or cosmetic motion.
  if (term.minute > from && event !== "START_TERM") {
    const occurrence = selectWahala(
      state,
      term,
      history,
      randomUUID(),
      randomInt,
    );
    if (occurrence) history.push(occurrence);
  }
  await saveHistory(tx, userId, history);
  await tx.lifeSimulation.upsert({
    where: { userId },
    create: { userId, characterId, snapshot: json(state) },
    update: { snapshot: json(state) },
  });
}
export class LifeService {
  constructor(private readonly academics: AcademicService) {}
  private async view(
    tx: Prisma.TransactionClient,
    userId: string,
    term: AcademicTerm | null,
  ): Promise<LifeView> {
    const row = await tx.lifeSimulation.findUnique({ where: { userId } }),
      state = row ? readState(row.snapshot) : null,
      history = await lifeHistory(tx, userId);
    return {
      state,
      pending:
        history.find(
          (h) =>
            term !== null &&
            h.status === "pending" &&
            h.termId === term?.id &&
            h.expiresMinute >= term.minute,
        ) ?? null,
      recent: history.slice(-8),
      allowedActions: lifeActions(state, term, history),
    };
  }
  async read(token: unknown) {
    return this.academics.locked(token, async (tx, userId) => {
      const academic = await this.academics.readView(tx, userId);
      return this.view(tx, userId, academic.term);
    });
  }
  async command(token: unknown, input: unknown) {
    const parsed = lifeCommandSchema.safeParse(input);
    if (!parsed.success) throw new BadRequestException("INVALID_LIFE_COMMAND");
    const command = parsed.data,
      hash = createHash("sha256").update(JSON.stringify(command)).digest("hex");
    try {
      return await this.academics.locked(token, async (tx, userId) => {
        const old = await tx.lifeCommandReceipt.findUnique({
          where: { userId_commandId: { userId, commandId: command.commandId } },
        });
        if (old) {
          if (old.requestHash !== hash)
            throw new ConflictException("IDEMPOTENCY_CONFLICT");
          const academic = await this.academics.readView(tx, userId);
          return {
            receipt: old.result,
            state: await this.view(tx, userId, academic.term),
            academic,
          };
        }
        const academic = await this.academics.readView(tx, userId),
          term = academic.term;
        if (!term || term.status !== "active" || term.id !== command.termId)
          throw new ConflictException("ACTIVE_LIFE_TERM_REQUIRED");
        const character = await tx.playerCharacter.findUniqueOrThrow({
          where: { userId },
        });
        if (
          character.programmeId !== term.programmeId ||
          character.structureId !== term.structureId ||
          character.structureVersion !== term.structureVersion ||
          character.stageId !== term.stageId ||
          character.semesterId !== term.semesterId
        )
          throw new ConflictException("ACADEMIC_POSITION_CONFLICT");
        const row = await tx.lifeSimulation.findUnique({ where: { userId } });
        if (row && row.characterId !== character.id)
          throw new ConflictException("CHARACTER_REVISION_CONFLICT");
        if (!row && command.type !== "START_LIFE")
          throw new ConflictException("START_LIFE_REQUIRED");
        const state = row ? readState(row.snapshot) : createLife(term),
          history = await lifeHistory(tx, userId),
          from = term.minute;
        if (
          state.termId !== term.id ||
          state.lastProcessedMinute !== term.minute
        )
          throw new ConflictException("LIFE_CLOCK_CONFLICT");
        // START_LIFE is idempotent even for a distinct initialization key; no reset.
        if (command.type !== "START_LIFE")
          applyLifeCommand(state, term, command, history);
        if (
          (await tx.lifeCommandReceipt.count({
            where: { userId, termId: term.id },
          })) >= state.policy.receiptCapacity
        )
          throw new ConflictException("LIFE_RECEIPT_CAPACITY");
        if (command.type !== "START_LIFE" || !row) state.revision++;
        if (term.minute > from) {
          await tx.academicTerm.update({
            where: { id: term.id },
            data: { snapshot: json(term) },
          });
          await tx.academicSimulation.update({
            where: { userId },
            data: { revision: { increment: 1 } },
          });
          const occurrence = selectWahala(
            state,
            term,
            history,
            randomUUID(),
            randomInt,
          );
          if (occurrence) history.push(occurrence);
        }
        await saveHistory(tx, userId, history);
        await tx.lifeSimulation.upsert({
          where: { userId },
          create: { userId, characterId: character.id, snapshot: json(state) },
          update: { snapshot: json(state) },
        });
        const receipt = {
          commandId: command.commandId,
          type: command.type,
          termId: term.id,
          academicMinute: term.minute,
          revision: state.revision,
        };
        await tx.lifeCommandReceipt.create({
          data: {
            userId,
            commandId: command.commandId,
            requestHash: hash,
            type: command.type,
            termId: term.id,
            academicMinute: term.minute,
            revision: state.revision,
            result: json(receipt),
          },
        });
        const next = await this.academics.readView(tx, userId);
        return {
          receipt,
          state: await this.view(tx, userId, next.term),
          academic: next,
        };
      });
    } catch (e) {
      if (e instanceof LifeError) throw new ConflictException(e.message);
      throw e;
    }
  }
}
