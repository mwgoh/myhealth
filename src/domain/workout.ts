import { isValidDateStr, type DateStr } from "./date";
import { createId } from "./id";
import { LIMITS, MEMO_MAX, withinLimit, type Entry, type Exercise, type Limit, type Workout } from "./types";

// 편집 화면의 초안. 입력값은 사용자가 친 문자열 그대로 둔다.
export type WeightedSetDraft = { weightKg: string; reps: string };
export type RepsSetDraft = { reps: string; addedKg: string };
export type TimedSetDraft = { seconds: string };

export type EntryDraft =
  | { id: string; exerciseId: string; kind: "weighted"; sets: WeightedSetDraft[] }
  | { id: string; exerciseId: string; kind: "reps"; sets: RepsSetDraft[] }
  | { id: string; exerciseId: string; kind: "timed"; sets: TimedSetDraft[] }
  | { id: string; exerciseId: string; kind: "cardio"; durationMin: string; distanceKm: string };

export type WorkoutDraft = {
  id: string;
  date: string;
  createdAt: string;
  durationMin: string;
  memo: string;
  entries: EntryDraft[];
};

export type FieldState = { kind: "empty" } | { kind: "valid"; value: number } | { kind: "invalid" };

const NUMBER_RE = /^\d+(\.\d+)?$/;

export function readField(raw: string, limit: Limit): FieldState {
  const s = raw.trim();
  if (s === "") return { kind: "empty" };
  // 일부 키패드는 소수점으로 쉼표를 낸다
  const normalized = s.replace(",", ".");
  if (!NUMBER_RE.test(normalized)) return { kind: "invalid" };
  const value = Number(normalized);
  return withinLimit(value, limit) ? { kind: "valid", value } : { kind: "invalid" };
}

const valueOf = (raw: string, limit: Limit): number | null => {
  const f = readField(raw, limit);
  return f.kind === "valid" ? f.value : null;
};

export function newWorkoutDraft(date: DateStr, now: Date): WorkoutDraft {
  return { id: createId(), date, createdAt: now.toISOString(), durationMin: "", memo: "", entries: [] };
}

const numToStr = (n: number | undefined) => (n === undefined ? "" : String(n));

export function draftFromWorkout(w: Workout): WorkoutDraft {
  return {
    id: w.id,
    date: w.date,
    createdAt: w.createdAt,
    durationMin: numToStr(w.durationMin),
    memo: w.memo ?? "",
    entries: w.entries.map((e): EntryDraft => {
      switch (e.kind) {
        case "weighted":
          return { ...e, sets: e.sets.map((s) => ({ weightKg: String(s.weightKg), reps: String(s.reps) })) };
        case "reps":
          // 추가 중량 0은 빈 칸으로 보여준다
          return { ...e, sets: e.sets.map((s) => ({ reps: String(s.reps), addedKg: s.addedKg === 0 ? "" : String(s.addedKg) })) };
        case "timed":
          return { ...e, sets: e.sets.map((s) => ({ seconds: String(s.seconds) })) };
        case "cardio":
          return { ...e, durationMin: String(e.durationMin), distanceKm: numToStr(e.distanceKm) };
      }
    }),
  };
}

export function newEntryDraft(ex: Exercise): EntryDraft {
  const base = { id: createId(), exerciseId: ex.id };
  switch (ex.kind) {
    case "weighted":
      return { ...base, kind: "weighted", sets: [{ weightKg: "", reps: "" }] };
    case "reps":
      return { ...base, kind: "reps", sets: [{ reps: "", addedKg: "" }] };
    case "timed":
      return { ...base, kind: "timed", sets: [{ seconds: "" }] };
    case "cardio":
      return { ...base, kind: "cardio", durationMin: "", distanceKm: "" };
  }
}

/**
 * 고른 종목들을 순서대로 초안에 덧붙인다. 이미 초안에 있는 종목과 목록 안의 중복은 건너뛴다.
 * added는 새로 붙은 종목 초안이다. 붙인 것이 없으면 같은 초안 객체를 돌려준다.
 */
export function appendExercises(d: WorkoutDraft, exercises: readonly Exercise[]): { draft: WorkoutDraft; added: EntryDraft[] } {
  const present = new Set(d.entries.map((e) => e.exerciseId));
  const added: EntryDraft[] = [];
  for (const ex of exercises) {
    if (present.has(ex.id)) continue;
    present.add(ex.id);
    added.push(newEntryDraft(ex));
  }
  return { draft: added.length === 0 ? d : { ...d, entries: [...d.entries, ...added] }, added };
}

export function addSet(entry: EntryDraft): EntryDraft {
  switch (entry.kind) {
    case "weighted":
      return { ...entry, sets: [...entry.sets, { ...(entry.sets.at(-1) ?? { weightKg: "", reps: "" }) }] };
    case "reps":
      return { ...entry, sets: [...entry.sets, { ...(entry.sets.at(-1) ?? { reps: "", addedKg: "" }) }] };
    case "timed":
      return { ...entry, sets: [...entry.sets, { ...(entry.sets.at(-1) ?? { seconds: "" }) }] };
    case "cardio":
      return entry;
  }
}

// 초안 종목 하나를 저장 형식으로 바꾼다. 완성된 부분이 없으면 null.
function persistEntry(e: EntryDraft): Entry | null {
  const base = { id: e.id, exerciseId: e.exerciseId };
  switch (e.kind) {
    case "weighted": {
      const sets = e.sets.flatMap((s) => {
        const weightKg = valueOf(s.weightKg, LIMITS.weightKg);
        const reps = valueOf(s.reps, LIMITS.reps);
        return weightKg === null || reps === null ? [] : [{ weightKg, reps }];
      });
      return sets.length ? { ...base, kind: "weighted", sets } : null;
    }
    case "reps": {
      const sets = e.sets.flatMap((s) => {
        const reps = valueOf(s.reps, LIMITS.reps);
        const added = readField(s.addedKg, LIMITS.addedKg);
        if (reps === null || added.kind === "invalid") return [];
        return [{ reps, addedKg: added.kind === "valid" ? added.value : 0 }];
      });
      return sets.length ? { ...base, kind: "reps", sets } : null;
    }
    case "timed": {
      const sets = e.sets.flatMap((s) => {
        const seconds = valueOf(s.seconds, LIMITS.seconds);
        return seconds === null ? [] : [{ seconds }];
      });
      return sets.length ? { ...base, kind: "timed", sets } : null;
    }
    case "cardio": {
      const durationMin = valueOf(e.durationMin, LIMITS.cardioDurationMin);
      const distance = readField(e.distanceKm, LIMITS.distanceKm);
      if (durationMin === null || distance.kind === "invalid") return null;
      return distance.kind === "valid"
        ? { ...base, kind: "cardio", durationMin, distanceKm: distance.value }
        : { ...base, kind: "cardio", durationMin };
    }
  }
}

/** 날짜 입력을 반영한다. 날짜 선택기의 '지우기'처럼 빈 값이나 잘못된 날짜면 무시하고 같은 초안을 돌려준다. */
export function withDate(d: WorkoutDraft, raw: string): WorkoutDraft {
  return isValidDateStr(raw) ? { ...d, date: raw } : d;
}

export function hasCompletedSets(entry: EntryDraft): boolean {
  return persistEntry(entry) !== null;
}

export function toPersistable(
  d: WorkoutDraft,
): { ok: true; workout: Workout } | { ok: false; reason: "no-entries" | "invalid-date" } {
  if (!isValidDateStr(d.date)) return { ok: false, reason: "invalid-date" };
  const entries = d.entries.map(persistEntry).filter((e): e is Entry => e !== null);
  if (entries.length === 0) return { ok: false, reason: "no-entries" };

  const workout: Workout = { id: d.id, date: d.date, createdAt: d.createdAt, entries };
  const durationMin = valueOf(d.durationMin, LIMITS.workoutDurationMin);
  if (durationMin !== null) workout.durationMin = durationMin;
  if (d.memo.trim() !== "") workout.memo = d.memo.slice(0, MEMO_MAX);
  return { ok: true, workout };
}
