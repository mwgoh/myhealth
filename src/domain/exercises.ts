import { SEED_EXERCISES } from "./seed";
import type { Category, Exercise, MeasureKind, Store } from "./types";

const DEFAULT_KIND: Record<Category, MeasureKind> = {
  strength: "weighted",
  bodyweight: "reps",
  core: "reps",
  stretching: "timed",
  cardio: "cardio",
};

export function defaultKindFor(c: Category): MeasureKind {
  return DEFAULT_KIND[c];
}

export type NameCheck =
  | { ok: true }
  | { ok: false; reason: "empty" | "duplicate" }
  | { ok: false; reason: "duplicate-archived"; existingId: string };

const normalizeName = (name: string) => name.trim().toLowerCase();

export function checkNewExerciseName(exercises: readonly Exercise[], name: string): NameCheck {
  const key = normalizeName(name);
  if (key === "") return { ok: false, reason: "empty" };
  const same = exercises.find((e) => normalizeName(e.name) === key);
  if (!same) return { ok: true };
  return same.archived
    ? { ok: false, reason: "duplicate-archived", existingId: same.id }
    : { ok: false, reason: "duplicate" };
}

// 검색은 띄어쓰기를 빼먹어도 찾도록 공백을 모두 지운다
const searchKey = (s: string) => s.replace(/\s+/g, "").toLowerCase();

export function pickerList(store: Store, opts: { category: Category | "all"; query: string }): Exercise[] {
  // 종목별 마지막 사용 시점. "날짜|createdAt" 문자열은 사전순 비교가 곧 시간순 비교다
  const lastUsed = new Map<string, string>();
  for (const w of store.workouts) {
    const stamp = `${w.date}|${w.createdAt}`;
    for (const e of w.entries) {
      const prev = lastUsed.get(e.exerciseId);
      if (!prev || stamp > prev) lastUsed.set(e.exerciseId, stamp);
    }
  }

  const q = searchKey(opts.query);
  const visible = store.exercises.filter(
    (e) =>
      !e.archived &&
      (opts.category === "all" || e.category === opts.category) &&
      searchKey(e.name).includes(q),
  );

  const used = visible
    .filter((e) => lastUsed.has(e.id))
    .sort((a, b) => {
      const x = lastUsed.get(a.id)!;
      const y = lastUsed.get(b.id)!;
      return y > x ? 1 : y < x ? -1 : 0; // 시점이 같으면 Store 순서 유지
    });
  const unused = visible.filter((e) => !lastUsed.has(e.id));
  return [...used, ...unused];
}

const SEED_IDS: ReadonlySet<string> = new Set(SEED_EXERCISES.map((e) => e.id));

/** 앱이 처음부터 넣어 둔 기본 종목인가 */
export const isSeedExercise = (id: string): boolean => SEED_IDS.has(id);

/** 이 종목을 쓴 기록(Workout) 수. 한 기록에 여러 번 있어도 1로 센다. */
export function exerciseUseCount(store: Store, id: string): number {
  return store.workouts.filter((w) => w.entries.some((e) => e.exerciseId === id)).length;
}

export type DeleteCheck =
  | { ok: true }
  | { ok: false; reason: "seed" | "not-found" }
  | { ok: false; reason: "in-use"; uses: number };

/**
 * 종목을 삭제할 수 있는지. 직접 추가했고 어떤 기록에도 쓰이지 않은 종목만 삭제할 수 있다.
 * 기록에 쓰인 종목을 지우면 그 기록이 없는 종목을 가리켜 Store 전체가 손상으로 판정되므로 막는다(숨기기를 쓴다).
 */
export function checkExerciseDelete(store: Store, id: string): DeleteCheck {
  if (!store.exercises.some((e) => e.id === id)) return { ok: false, reason: "not-found" };
  if (isSeedExercise(id)) return { ok: false, reason: "seed" };
  const uses = exerciseUseCount(store, id);
  return uses > 0 ? { ok: false, reason: "in-use", uses } : { ok: true };
}
