import { z } from "zod";
import { isValidDateStr } from "./date";

export const MEASURE_KINDS = ["weighted", "reps", "timed", "cardio"] as const;
export type MeasureKind = (typeof MEASURE_KINDS)[number];

export const CATEGORIES = ["strength", "bodyweight", "core", "stretching", "cardio"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  strength: "#근력운동",
  bodyweight: "#맨몸운동",
  core: "#코어운동",
  stretching: "#스트레칭",
  cardio: "#유산소",
};

export const KIND_LABEL: Record<MeasureKind, string> = {
  weighted: "무게×횟수",
  reps: "횟수",
  timed: "시간(초)",
  cardio: "시간(분)·거리",
};

export type Limit = { min: number; max: number; integer: boolean; minExclusive: boolean };

// 설계 4절 입력값 범위
export const LIMITS = {
  weightKg: { min: 0, max: 1000, integer: false, minExclusive: false },
  reps: { min: 1, max: 1000, integer: true, minExclusive: false },
  addedKg: { min: 0, max: 500, integer: false, minExclusive: false },
  seconds: { min: 1, max: 36000, integer: true, minExclusive: false },
  cardioDurationMin: { min: 0, max: 1440, integer: false, minExclusive: true },
  distanceKm: { min: 0, max: 1000, integer: false, minExclusive: true },
  workoutDurationMin: { min: 1, max: 1440, integer: true, minExclusive: false },
} as const satisfies Record<string, Limit>;

export const MEMO_MAX = 1000;

export function withinLimit(n: number, l: Limit): boolean {
  if (!Number.isFinite(n)) return false;
  if (l.integer && !Number.isInteger(n)) return false;
  if (l.minExclusive ? n <= l.min : n < l.min) return false;
  return n <= l.max;
}

const limited = (l: Limit) => z.number().refine((n) => withinLimit(n, l));

const idSchema = z.string().min(1);

export const exerciseSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  kind: z.enum(MEASURE_KINDS),
  category: z.enum(CATEGORIES),
  archived: z.boolean(),
});

const entryBase = { id: idSchema, exerciseId: idSchema };

export const entrySchema = z.discriminatedUnion("kind", [
  z.object({
    ...entryBase,
    kind: z.literal("weighted"),
    sets: z.array(z.object({ weightKg: limited(LIMITS.weightKg), reps: limited(LIMITS.reps) })).min(1),
  }),
  z.object({
    ...entryBase,
    kind: z.literal("reps"),
    sets: z.array(z.object({ reps: limited(LIMITS.reps), addedKg: limited(LIMITS.addedKg) })).min(1),
  }),
  z.object({
    ...entryBase,
    kind: z.literal("timed"),
    sets: z.array(z.object({ seconds: limited(LIMITS.seconds) })).min(1),
  }),
  z.object({
    ...entryBase,
    kind: z.literal("cardio"),
    durationMin: limited(LIMITS.cardioDurationMin),
    distanceKm: limited(LIMITS.distanceKm).optional(),
  }),
]);

export const workoutSchema = z.object({
  id: idSchema,
  date: z.string().refine(isValidDateStr),
  createdAt: z.iso.datetime(),
  durationMin: limited(LIMITS.workoutDurationMin).optional(),
  memo: z.string().max(MEMO_MAX).optional(),
  entries: z.array(entrySchema).min(1),
});

export const storeSchema = z.object({
  version: z.literal(1),
  exercises: z.array(exerciseSchema),
  workouts: z.array(workoutSchema),
});

export type Exercise = z.infer<typeof exerciseSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type Workout = z.infer<typeof workoutSchema>;
export type Store = z.infer<typeof storeSchema>;

export type StoreErrorCode = "unsupported-version" | "invalid-shape" | "unknown-exercise" | "kind-mismatch";

const hasDuplicates = (ids: string[]) => new Set(ids).size !== ids.length;

export function parseStore(input: unknown): { ok: true; store: Store } | { ok: false; error: StoreErrorCode } {
  if (typeof input !== "object" || input === null) return { ok: false, error: "invalid-shape" };

  const version = (input as { version?: unknown }).version;
  if (typeof version === "number" && version > 1) return { ok: false, error: "unsupported-version" };

  const parsed = storeSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid-shape" };
  const store = parsed.data;

  if (hasDuplicates(store.exercises.map((e) => e.id)) || hasDuplicates(store.workouts.map((w) => w.id))) {
    return { ok: false, error: "invalid-shape" };
  }

  const refError = checkReferences(store);
  return refError ? { ok: false, error: refError } : { ok: true, store };
}

/** 모든 기록이 존재하는 종목을, 같은 측정 방식으로 가리키는지 검사한다 */
export function checkReferences(store: Store): "unknown-exercise" | "kind-mismatch" | null {
  const byId = new Map(store.exercises.map((e) => [e.id, e]));
  const entries = store.workouts.flatMap((w) => w.entries);
  if (entries.some((en) => !byId.has(en.exerciseId))) return "unknown-exercise";
  if (entries.some((en) => byId.get(en.exerciseId)!.kind !== en.kind)) return "kind-mismatch";
  return null;
}
