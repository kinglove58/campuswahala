import { z } from "zod";
import { processTime, type AcademicTerm } from "./academics";
const metric = z.enum(["energy", "satiety", "mood", "wellbeing"]);
export type LifeMetric = z.infer<typeof metric>;
const amount = z.number().int().min(0).max(10000);
const flag = z.enum([
  "ate_before_class",
  "quiet_evening",
  "long_food_queue",
  "stayed_focused",
  "joined_gist",
  "took_a_break",
]);
const effectsSchema = z
  .object({
    energy: z.number().int().min(-4000).max(10000),
    satiety: z.number().int().min(-4000).max(10000),
    mood: z.number().int().min(-4000).max(10000),
    wellbeing: z.number().int().min(-4000).max(10000),
  })
  .strict();
export type LifeEffects = z.infer<typeof effectsSchema>;
export const conditionSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("metric_below"), metric, value: amount }).strict(),
  z.object({ op: z.literal("metric_above"), metric, value: amount }).strict(),
  z
    .object({
      op: z.literal("venue_type"),
      value: z.enum([
        "food",
        "commercial",
        "hostel",
        "social",
        "sports",
        "library",
        "lecture_hall",
      ]),
    })
    .strict(),
  z
    .object({
      op: z.literal("campus"),
      value: z.enum(["futa", "oau", "unilag"]),
    })
    .strict(),
  z
    .object({
      op: z.literal("time_window"),
      start: z.number().int().min(0).max(1439),
      end: z.number().int().min(0).max(1439),
    })
    .strict(),
  z
    .object({
      op: z.literal("academic_event_within"),
      minutes: z.number().int().min(1).max(180),
    })
    .strict(),
  z.object({ op: z.literal("has_carryover") }).strict(),
  z
    .object({
      op: z.literal("stage_activity_tag"),
      value: z.enum([
        "SIWES",
        "industrial_training",
        "internship",
        "final_project",
      ]),
    })
    .strict(),
  z
    .object({
      op: z.literal("previous_wahala"),
      value: z.string().regex(/^cw-[a-z-]{2,40}$/),
    })
    .strict(),
  z.object({ op: z.literal("story_flag"), value: flag }).strict(),
]);
const choiceSchema = z
  .object({
    id: z.string().regex(/^[a-z-]{2,30}$/),
    label: z.string().min(1).max(100),
    minutes: z.number().int().min(0).max(120),
    effects: effectsSchema,
    flag: flag.optional(),
  })
  .strict();
export const wahalaTemplateSchema = z
  .object({
    id: z.string().regex(/^cw-[a-z-]{2,40}$/),
    version: z.literal(1),
    category: z.enum(["food", "hostel", "time", "social", "recovery", "study"]),
    title: z.string().min(1).max(80),
    situation: z.string().min(1).max(300),
    eligibility: z.array(conditionSchema).min(1).max(8),
    weight: z.number().int().min(1).max(100),
    cooldownMinutes: z.number().int().min(180).max(10080),
    expiresAfterMinutes: z.number().int().min(20).max(180),
    choices: z.array(choiceSchema).min(2).max(4),
  })
  .strict()
  .superRefine((t, c) => {
    if (new Set(t.choices.map((x) => x.id)).size !== t.choices.length)
      c.addIssue({ code: "custom", message: "Duplicate choice" });
    if (
      !t.choices.some(
        (x) =>
          x.minutes === 0 && Object.values(x.effects).every((n) => n === 0),
      )
    )
      c.addIssue({ code: "custom", message: "Neutral route required" });
  });
export type WahalaTemplate = z.infer<typeof wahalaTemplateSchema>;
const activityKind = z.enum(["EAT", "REST", "SLEEP", "SOCIALIZE", "EXERCISE"]);
const optionSchema = z
  .object({
    id: z.string().regex(/^[a-z-]{2,30}$/),
    label: z.string().min(1).max(80),
    kind: activityKind,
    minutes: z.number().int().min(1).max(480),
    effects: effectsSchema,
    venues: z.array(z.string().min(1).max(30)).min(1).max(5),
  })
  .strict();
export const lifePolicySchema = z
  .object({
    id: z.literal("cw-life-policy"),
    version: z.literal(1),
    starting: effectsSchema,
    decayPerHour: z
      .object({
        energy: amount,
        satiety: amount,
        mood: amount,
        wellbeing: amount,
      })
      .strict(),
    lowSatiety: amount,
    hungryMoodPerHour: amount,
    travelEnergyPerMinute: z.number().int().min(0).max(100),
    globalCooldown: z.number().int().min(180).max(1440),
    maximumPerDay: z.number().int().min(1).max(3),
    maximumPerTerm: z.number().int().min(1).max(60),
    receiptCapacity: z.number().int().min(100).max(2000),
    options: z.array(optionSchema).min(3).max(20),
  })
  .strict()
  .superRefine((p, c) => {
    if (
      new Set(p.options.map((x) => x.id)).size !== p.options.length ||
      Object.values(p.starting).some((n) => n < 0)
    )
      c.addIssue({ code: "custom", message: "Invalid life policy" });
  });
export type LifePolicy = z.infer<typeof lifePolicySchema>;
const effects = (
  energy = 0,
  satiety = 0,
  mood = 0,
  wellbeing = 0,
): LifeEffects => ({ energy, satiety, mood, wellbeing });
export const lifePolicy: LifePolicy = lifePolicySchema.parse({
  id: "cw-life-policy",
  version: 1,
  starting: effects(8500, 7500, 7500, 8500),
  decayPerHour: { energy: 40, satiety: 100, mood: 8, wellbeing: 12 },
  lowSatiety: 2000,
  hungryMoodPerHour: 25,
  travelEnergyPerMinute: 12,
  globalCooldown: 180,
  maximumPerDay: 2,
  maximumPerTerm: 40,
  receiptCapacity: 2000,
  options: [
    {
      id: "quick-bite",
      kind: "EAT",
      label: "Bread & egg · quick bite",
      minutes: 15,
      effects: effects(200, 2400, 250),
      venues: ["food", "commercial"],
    },
    {
      id: "proper-meal",
      kind: "EAT",
      label: "Rice & stew · proper meal",
      minutes: 30,
      effects: effects(350, 4200, 500),
      venues: ["food", "commercial"],
    },
    {
      id: "filling-meal",
      kind: "EAT",
      label: "Beans & plantain · filling meal",
      minutes: 45,
      effects: effects(500, 5800, 650),
      venues: ["food", "commercial"],
    },
    {
      id: "rest-short",
      kind: "REST",
      label: "Rest · 30 min",
      minutes: 30,
      effects: effects(1600, 0, 400, 200),
      venues: ["hostel", "social"],
    },
    {
      id: "rest-long",
      kind: "REST",
      label: "Rest · 60 min",
      minutes: 60,
      effects: effects(2600, 0, 650, 350),
      venues: ["hostel", "social"],
    },
    {
      id: "sleep-four",
      kind: "SLEEP",
      label: "Sleep · 4 hours",
      minutes: 240,
      effects: effects(5200, 0, 900, 1000),
      venues: ["hostel"],
    },
    {
      id: "sleep-six",
      kind: "SLEEP",
      label: "Sleep · 6 hours",
      minutes: 360,
      effects: effects(7600, 0, 1200, 1400),
      venues: ["hostel"],
    },
    {
      id: "sleep-eight",
      kind: "SLEEP",
      label: "Sleep · 8 hours",
      minutes: 480,
      effects: effects(10000, 0, 1500, 1800),
      venues: ["hostel"],
    },
    {
      id: "social-short",
      kind: "SOCIALIZE",
      label: "Spend time in the common area · 30 min",
      minutes: 30,
      effects: effects(-200, -150, 1300),
      venues: ["hostel", "social", "food"],
    },
    {
      id: "exercise-short",
      kind: "EXERCISE",
      label: "Exercise · 30 min",
      minutes: 30,
      effects: effects(-600, -400, 850, 800),
      venues: ["sports"],
    },
    {
      id: "exercise-long",
      kind: "EXERCISE",
      label: "Exercise · 60 min",
      minutes: 60,
      effects: effects(-1100, -700, 1400, 1300),
      venues: ["sports"],
    },
  ],
});
export const lifeCommandSchema = z.discriminatedUnion("type", [
  z
    .object({
      type: z.literal("START_LIFE"),
      commandId: z.string().uuid(),
      termId: z.string().uuid(),
    })
    .strict(),
  ...["EAT", "REST", "SLEEP", "SOCIALIZE", "EXERCISE"].map((type) =>
    z
      .object({
        type: z.literal(
          type as "EAT" | "REST" | "SLEEP" | "SOCIALIZE" | "EXERCISE",
        ),
        commandId: z.string().uuid(),
        termId: z.string().uuid(),
        optionId: z.string().regex(/^[a-z-]{2,30}$/),
      })
      .strict(),
  ),
  z
    .object({
      type: z.literal("RESOLVE_WAHALA"),
      commandId: z.string().uuid(),
      termId: z.string().uuid(),
      occurrenceId: z.string().uuid(),
      choiceId: z.string().regex(/^[a-z-]{2,30}$/),
    })
    .strict(),
]);
export type LifeCommand = z.infer<typeof lifeCommandSchema>;
export interface LifeState {
  schemaVersion: 1;
  termId: string;
  homeVenueId: string;
  policy: LifePolicy;
  metrics: LifeEffects;
  remainders: LifeEffects;
  lastProcessedMinute: number;
  revision: number;
  flags: z.infer<typeof flag>[];
}
export interface WahalaOccurrence {
  id: string;
  termId: string;
  template: WahalaTemplate;
  triggeredMinute: number;
  expiresMinute: number;
  status: "pending" | "resolved" | "dismissed" | "expired";
  chosenChoiceId: string | null;
  resolvedMinute: number | null;
  context: {
    campus: string;
    venueId: string;
    minute: number;
    eligibleIds: string[];
    roll: number;
  };
  effect: LifeEffects | null;
}
export interface LifeView {
  state: LifeState | null;
  pending: WahalaOccurrence | null;
  recent: WahalaOccurrence[];
  allowedActions: LifeCommand[];
}
export class LifeError extends Error {}
const ensure = (condition: unknown, code: string) => {
  if (!condition) throw new LifeError(code);
};
const clamp = (n: number) => Math.max(0, Math.min(10000, n));
const metricValues = z
  .object({ energy: amount, satiety: amount, mood: amount, wellbeing: amount })
  .strict();
const remainder = z.number().int().min(0).max(59);
const lifeStateSchema = z
  .object({
    schemaVersion: z.literal(1),
    termId: z.string().uuid(),
    homeVenueId: z.string().min(1).max(100),
    policy: lifePolicySchema,
    metrics: metricValues,
    remainders: z
      .object({
        energy: remainder,
        satiety: remainder,
        mood: remainder,
        wellbeing: remainder,
      })
      .strict(),
    lastProcessedMinute: z.number().int().min(0).max(40320),
    revision: z.number().int().min(0),
    flags: z.array(flag).max(32),
  })
  .strict();
export function validateLifeState(state: LifeState) {
  ensure(lifeStateSchema.safeParse(state).success, "LIFE_REVISION_UNAVAILABLE");
  lifePolicySchema.parse(state.policy);
  ensure(
    Object.values(state.metrics).every(
      (n) => Number.isInteger(n) && n >= 0 && n <= 10000,
    ) &&
      Object.values(state.remainders).every(
        (n) => Number.isInteger(n) && n >= 0 && n < 60,
      ),
    "INVALID_LIFE_METRICS",
  );
  ensure(
    Number.isInteger(state.lastProcessedMinute) &&
      state.lastProcessedMinute >= 0 &&
      Number.isInteger(state.revision) &&
      state.revision >= 0 &&
      state.flags.length <= 32 &&
      new Set(state.flags).size === state.flags.length,
    "INVALID_LIFE_STATE",
  );
  state.flags.forEach((f) => flag.parse(f));
}
export function createLife(term: AcademicTerm): LifeState {
  const home = term.venues.find((v) => v.type === "hostel");
  ensure(home, "SIMULATION_HOME_UNAVAILABLE");
  return {
    schemaVersion: 1,
    termId: term.id,
    homeVenueId: home!.id,
    policy: structuredClone(lifePolicy),
    metrics: structuredClone(lifePolicy.starting),
    remainders: effects(),
    lastProcessedMinute: term.minute,
    revision: 0,
    flags: [],
  };
}
export function attachLife(state: LifeState, term: AcademicTerm) {
  validateLifeState(state);
  const home =
    term.venues.find(
      (v) => v.id === state.homeVenueId && v.type === "hostel",
    ) ?? term.venues.find((v) => v.type === "hostel");
  ensure(home, "SIMULATION_HOME_UNAVAILABLE");
  state.termId = term.id;
  state.homeVenueId = home!.id;
  state.lastProcessedMinute = term.minute;
}
export function advanceLifeState(
  state: LifeState,
  from: number,
  to: number,
  policy = state.policy,
) {
  validateLifeState(state);
  lifePolicySchema.parse(policy);
  ensure(
    Number.isInteger(from) &&
      Number.isInteger(to) &&
      from >= 0 &&
      to >= from &&
      to <= 40320 &&
      from <= state.lastProcessedMinute,
    "INVALID_LIFE_INTERVAL",
  );
  // Integer minute steps preserve thresholds and fractional decay across batching.
  for (let m = state.lastProcessedMinute; m < to; m++) {
    const hungry = state.metrics.satiety < policy.lowSatiety;
    for (const key of ["energy", "satiety", "mood", "wellbeing"] as const) {
      const n =
        state.remainders[key] +
        policy.decayPerHour[key] +
        (key === "mood" && hungry ? policy.hungryMoodPerHour : 0);
      state.metrics[key] = clamp(state.metrics[key] - Math.floor(n / 60));
      state.remainders[key] = state.metrics[key] === 0 ? 0 : n % 60;
    }
  }
  state.lastProcessedMinute = Math.max(to, state.lastProcessedMinute);
}
export function applyLifeEffects(
  state: LifeState,
  change: LifeEffects,
  storyFlag?: z.infer<typeof flag>,
) {
  effectsSchema.parse(change);
  for (const key of ["energy", "satiety", "mood", "wellbeing"] as const)
    state.metrics[key] = clamp(state.metrics[key] + change[key]);
  if (storyFlag && !state.flags.includes(storyFlag)) {
    ensure(state.flags.length < 32, "STORY_FLAG_CAPACITY");
    state.flags.push(flag.parse(storyFlag));
  }
}
const neutral = {
  id: "leave",
  label: "Leave it for now",
  minutes: 0,
  effects: effects(),
};
function template(
  id: string,
  category: WahalaTemplate["category"],
  title: string,
  situation: string,
  eligibility: WahalaTemplate["eligibility"],
  label: string,
  minutes: number,
  change: LifeEffects,
  storyFlag?: z.infer<typeof flag>,
): WahalaTemplate {
  return wahalaTemplateSchema.parse({
    id: `cw-${id}`,
    version: 1,
    category,
    title,
    situation,
    eligibility,
    weight: 10,
    cooldownMinutes: 1440,
    expiresAfterMinutes: 90,
    choices: [
      {
        id: "take-time",
        label,
        minutes,
        effects: change,
        ...(storyFlag ? { flag: storyFlag } : {}),
      },
      {
        id: "stay-focused",
        label: "Stay focused and move on",
        minutes: 5,
        effects: effects(0, 0, 100),
        flag: "stayed_focused",
      },
      neutral,
    ],
  });
}
export const wahalaTemplates: WahalaTemplate[] = [
  template(
    "food-queue",
    "food",
    "The queue has its own timetable",
    "The fictional food corner is packed. Your next campus decision is how much time to spend here.",
    [
      { op: "venue_type", value: "food" },
      { op: "metric_below", metric: "satiety", value: 8000 },
    ],
    "Wait for rice & stew",
    45,
    effects(200, 4000, 500),
    "long_food_queue",
  ),
  template(
    "hostel-noise",
    "hostel",
    "One more gist before quiet time",
    "The simulation hostel common area is lively. You can settle down or spend a little time with the crowd.",
    [
      { op: "venue_type", value: "hostel" },
      { op: "time_window", start: 1080, end: 1439 },
    ],
    "Hang out briefly",
    30,
    effects(-150, 0, 850),
    "joined_gist",
  ),
  template(
    "almost-late",
    "time",
    "Your lecture is coming up",
    "A scheduled campus activity starts soon. Any extra time here still counts on your simulation timetable.",
    [{ op: "academic_event_within", minutes: 60 }],
    "Finish what you're doing",
    20,
    effects(-100, 0, 250),
  ),
  template(
    "campus-gist",
    "social",
    "Small gist, big audience",
    "A fictional campus story has drawn a small crowd. Nobody is waiting for you to join.",
    [{ op: "venue_type", value: "social" }],
    "Check out the gist",
    30,
    effects(-200, -100, 900),
    "joined_gist",
  ),
  template(
    "long-day",
    "recovery",
    "The day has been long",
    "Your character could use a break. Going home remains available even with depleted energy.",
    [
      { op: "metric_below", metric: "energy", value: 3500 },
      { op: "time_window", start: 960, end: 1439 },
    ],
    "Take a quiet pause here",
    30,
    effects(1000, 0, 300, 200),
    "took_a_break",
  ),
  template(
    "study-snack",
    "study",
    "Food before the next chapter?",
    "At this fictional study space, you notice you're low on game satiety. A small demo snack takes time too.",
    [
      { op: "venue_type", value: "library" },
      { op: "metric_below", metric: "satiety", value: 3000 },
    ],
    "Pause for your packed snack",
    20,
    effects(150, 1800, 250),
  ),
  template(
    "quiet-evening",
    "hostel",
    "A quiet corner is free",
    "There's a calm corner in the simulation hostel. It might be a good place to unwind.",
    [
      { op: "venue_type", value: "hostel" },
      { op: "metric_below", metric: "mood", value: 6000 },
    ],
    "Sit quietly",
    30,
    effects(650, 0, 900, 300),
    "quiet_evening",
  ),
  template(
    "sports-invite",
    "recovery",
    "The court is still open",
    "Some fictional students are stretching nearby. You can spend a little game time moving around.",
    [
      { op: "venue_type", value: "sports" },
      { op: "metric_above", metric: "energy", value: 2500 },
    ],
    "Join a short warm-up",
    20,
    effects(-350, -200, 600, 400),
  ),
  template(
    "carryover-focus",
    "study",
    "One course at a time",
    "You have outstanding simulation coursework. A short pause may help you settle into your plan; it doesn't award academic credit.",
    [{ op: "has_carryover" }, { op: "venue_type", value: "library" }],
    "Make a quiet plan",
    15,
    effects(0, 0, 500),
    "stayed_focused",
  ),
  template(
    "queue-followup",
    "food",
    "A shorter queue this time",
    "After the last long fictional food queue, this corner looks calmer. These meals are game choices, not a real vendor menu.",
    [
      { op: "previous_wahala", value: "cw-food-queue" },
      { op: "venue_type", value: "food" },
    ],
    "Take a quick bite",
    15,
    effects(150, 2200, 250),
    "ate_before_class",
  ),
];
export function conditionMatches(
  input: unknown,
  state: LifeState,
  term: AcademicTerm,
  history: WahalaOccurrence[],
): boolean {
  const parsed = conditionSchema.safeParse(input);
  if (!parsed.success) return false;
  const c = parsed.data;
  switch (c.op) {
    case "metric_below":
      return state.metrics[c.metric] < c.value;
    case "metric_above":
      return state.metrics[c.metric] > c.value;
    case "venue_type":
      return term.venues.some(
        (v) => v.id === term.presenceVenueId && v.type === c.value,
      );
    case "campus":
      return term.campusId === c.value;
    case "time_window": {
      const m = term.minute % 1440;
      return c.start <= c.end
        ? m >= c.start && m <= c.end
        : m >= c.start || m <= c.end;
    }
    case "academic_event_within":
      return term.courses.some((course) =>
        [...course.lectures, course.test, course.exam].some(
          (e) =>
            e.status === "scheduled" &&
            e.start >= term.minute &&
            e.start - term.minute <= c.minutes &&
            e.venueId !== term.presenceVenueId,
        ),
      );
    case "has_carryover":
      return term.courses.some((c) => c.carryover);
    case "stage_activity_tag":
      return term.activityTags.includes(c.value);
    case "previous_wahala":
      return history.some(
        (h) => h.template.id === c.value && h.status === "resolved",
      );
    case "story_flag":
      return state.flags.includes(c.value);
  }
}
export function expireWahala(history: WahalaOccurrence[], minute: number) {
  for (const h of history)
    if (h.status === "pending" && minute > h.expiresMinute)
      h.status = "expired";
}
export function selectWahala(
  state: LifeState,
  term: AcademicTerm,
  history: WahalaOccurrence[],
  id: string,
  roll: (upper: number) => number,
): WahalaOccurrence | null {
  const p = state.policy;
  validateLifeState(state);
  if (term.minute >= term.endMinute)
    for (const h of history)
      if (h.status === "pending" && h.termId === term.id) h.status = "expired";
  expireWahala(history, term.minute);
  const current = history.filter((h) => h.termId === term.id);
  const last = current.at(-1);
  if (
    term.status !== "active" ||
    term.minute >= term.endMinute ||
    history.some((h) => h.status === "pending") ||
    current.length >= p.maximumPerTerm ||
    current.filter(
      (h) =>
        Math.floor(h.triggeredMinute / 1440) === Math.floor(term.minute / 1440),
    ).length >= p.maximumPerDay ||
    (last && term.minute - last.triggeredMinute < p.globalCooldown)
  )
    return null;
  const eligible = wahalaTemplates.filter(
    (t) =>
      t.eligibility.every((c) => conditionMatches(c, state, term, history)) &&
      !current.some(
        (h) =>
          h.template.id === t.id &&
          term.minute - h.triggeredMinute < t.cooldownMinutes,
      ),
  );
  if (!eligible.length) return null;
  const total = eligible.reduce((n, t) => n + t.weight, 0),
    value = roll(total);
  ensure(
    Number.isInteger(value) && value >= 0 && value < total,
    "INVALID_SERVER_ROLL",
  );
  let remaining = value;
  const chosen = eligible.find((t) => {
    remaining -= t.weight;
    return remaining < 0;
  })!;
  return {
    id,
    termId: term.id,
    template: structuredClone(chosen),
    triggeredMinute: term.minute,
    expiresMinute: Math.min(
      term.endMinute,
      term.minute + chosen.expiresAfterMinutes,
    ),
    status: "pending",
    chosenChoiceId: null,
    resolvedMinute: null,
    context: {
      campus: term.campusId,
      venueId: term.presenceVenueId,
      minute: term.minute,
      eligibleIds: eligible.map((t) => t.id),
      roll: value,
    },
    effect: null,
  };
}
export function applyLifeCommand(
  state: LifeState,
  term: AcademicTerm,
  command: LifeCommand,
  history: WahalaOccurrence[],
) {
  validateLifeState(state);
  ensure(
    term.status === "active" &&
      term.id === command.termId &&
      state.termId === term.id,
    "ACTIVE_LIFE_TERM_REQUIRED",
  );
  ensure(state.lastProcessedMinute === term.minute, "LIFE_CLOCK_CONFLICT");
  if (command.type === "START_LIFE") return;
  let minutes: number,
    change: LifeEffects,
    storyFlag: z.infer<typeof flag> | undefined;
  let occurrence: WahalaOccurrence | undefined;
  if (command.type === "RESOLVE_WAHALA") {
    occurrence = history.find(
      (h) => h.id === command.occurrenceId && h.termId === term.id,
    );
    ensure(
      occurrence?.status === "pending" &&
        term.minute <= occurrence.expiresMinute,
      "WAHALA_NOT_PENDING",
    );
    wahalaTemplateSchema.parse(occurrence!.template);
    const choice = occurrence!.template.choices.find(
      (c) => c.id === command.choiceId,
    );
    ensure(choice, "WAHALA_CHOICE_UNAVAILABLE");
    if (choice!.id !== "leave")
      ensure(
        occurrence!.template.eligibility
          .filter((c) => c.op === "venue_type" || c.op === "campus")
          .every((c) => conditionMatches(c, state, term, history)),
        "WAHALA_CONTEXT_CHANGED",
      );
    minutes = choice!.minutes;
    change = choice!.effects;
    storyFlag = choice!.flag;
  } else {
    const option = state.policy.options.find((o) => o.id === command.optionId);
    ensure(option, "LIFE_OPTION_UNAVAILABLE");
    ensure(option!.kind === command.type, "LIFE_OPTION_UNAVAILABLE");
    const venue = term.venues.find((v) => v.id === term.presenceVenueId);
    ensure(venue && option!.venues.includes(venue.type), "LIFE_VENUE_REQUIRED");
    if (command.type === "SLEEP")
      ensure(venue!.id === state.homeVenueId, "HOME_VENUE_REQUIRED");
    minutes = option!.minutes;
    change = option!.effects;
  }
  const from = term.minute;
  ensure(from + minutes <= term.endMinute, "LIFE_TIME_UNAVAILABLE");
  processTime(term, from + minutes);
  advanceLifeState(state, from, term.minute);
  applyLifeEffects(state, change, storyFlag);
  if (occurrence && command.type === "RESOLVE_WAHALA") {
    occurrence.status = command.choiceId === "leave" ? "dismissed" : "resolved";
    occurrence.chosenChoiceId = command.choiceId;
    occurrence.resolvedMinute = term.minute;
    occurrence.effect = structuredClone(change);
  }
  expireWahala(history, term.minute);
}
const placeholder = "00000000-0000-4000-8000-000000000000";
export function lifeActions(
  state: LifeState | null,
  term: AcademicTerm | null,
  history: WahalaOccurrence[],
): LifeCommand[] {
  if (!term || term.status !== "active") return [];
  if (!state)
    return [{ type: "START_LIFE", termId: term.id, commandId: placeholder }];
  const candidates: LifeCommand[] = state.policy.options.map((o) => ({
    type: o.kind,
    optionId: o.id,
    termId: term.id,
    commandId: placeholder,
  }));
  const pending = history.find(
    (h) =>
      h.status === "pending" &&
      h.termId === term.id &&
      h.expiresMinute >= term.minute,
  );
  if (pending)
    for (const c of pending.template.choices)
      candidates.push({
        type: "RESOLVE_WAHALA",
        occurrenceId: pending.id,
        choiceId: c.id,
        termId: term.id,
        commandId: placeholder,
      });
  return candidates.filter((c) => {
    try {
      applyLifeCommand(
        structuredClone(state),
        structuredClone(term),
        c,
        structuredClone(history),
      );
      return true;
    } catch {
      return false;
    }
  });
}
