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
