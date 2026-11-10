import { checkExerciseDelete, checkNewExerciseName, type DeleteCheck, type NameCheck } from "@/domain/exercises";
import { createId } from "@/domain/id";
import { createInitialStore } from "@/domain/seed";
import { checkReferences, parseStore, type Category, type Exercise, type MeasureKind, type Store, type Workout } from "@/domain/types";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export const STORAGE_KEY = "workout-log";

export type StoreState =
  | { status: "loading" }
  | { status: "ready"; store: Store }
  | { status: "corrupt"; raw: string }
  | { status: "unsupported-version"; raw: string };

/** saved: 저장됨, failed: 저장소 쓰기 실패(메모리에는 반영), blocked: ready가 아니라 아무것도 하지 않음 */
export type WriteResult = "saved" | "failed" | "blocked";

export type AddExerciseResult =
  | { ok: true; exercise: Exercise; write: WriteResult }
  | Extract<NameCheck, { ok: false }>;

export type DeleteExerciseResult = { ok: true; write: WriteResult } | Extract<DeleteCheck, { ok: false }>;

export interface WorkoutStore {
  getState(): StoreState;
  subscribe(listener: () => void): () => void;
  load(): void;
  upsertWorkout(w: Workout): WriteResult;
  deleteWorkout(id: string): WriteResult;
  addExercise(input: { name: string; category: Category; kind: MeasureKind }): AddExerciseResult;
  setExerciseArchived(id: string, archived: boolean): WriteResult;
  /** 기록에 쓰이지 않은 직접 추가 종목만 지운다. 기본 종목·기록에 쓰인 종목은 이유를 돌려준다(숨기기를 쓴다). */
  deleteExercise(id: string): DeleteExerciseResult;
  replaceAll(store: Store): WriteResult;
  resetAll(): WriteResult;
}

export function createWorkoutStore(storage: StorageLike): WorkoutStore {
  let state: StoreState = { status: "loading" };
  // 읽기조차 실패한 환경에서는 읽지 못한 기존 데이터를 덮어쓸 수 있으므로 쓰기를 막는다
  let writesDisabled = false;
  const listeners = new Set<() => void>();

  const setState = (next: StoreState) => {
    state = next;
    listeners.forEach((l) => l());
  };

  // 메모리 상태를 먼저 바꾸고 저장한다. 저장에 실패해도 화면의 입력은 남는다.
  const persist = (next: Store): WriteResult => {
    // 다른 탭이 종목을 지운 뒤 이 탭이 옛 초안을 저장하는 경우처럼, 다시 읽을 수 없는 데이터는 쓰지 않는다.
    // 쓰면 모든 탭이 손상 화면으로 잠긴다.
    if (checkReferences(next)) return "failed";
    setState({ status: "ready", store: next });
    if (writesDisabled) return "failed";
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
      return "saved";
    } catch {
      return "failed";
    }
  };

  const update = (fn: (s: Store) => Store): WriteResult =>
    state.status === "ready" ? persist(fn(state.store)) : "blocked";

  return {
    getState: () => state,

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    load() {
      let raw: string | null;
      try {
        raw = storage.getItem(STORAGE_KEY);
      } catch {
        writesDisabled = true;
        setState({ status: "ready", store: createInitialStore() });
        return;
      }
      writesDisabled = false;

      if (raw === null) {
        persist(createInitialStore());
        return;
      }

      let json: unknown;
      try {
        json = JSON.parse(raw);
      } catch {
        setState({ status: "corrupt", raw });
        return;
      }
      const parsed = parseStore(json);
      if (parsed.ok) setState({ status: "ready", store: parsed.store });
      else if (parsed.error === "unsupported-version") setState({ status: "unsupported-version", raw });
      else setState({ status: "corrupt", raw });
    },

    upsertWorkout: (w) =>
      update((s) => {
        const exists = s.workouts.some((x) => x.id === w.id);
        return { ...s, workouts: exists ? s.workouts.map((x) => (x.id === w.id ? w : x)) : [...s.workouts, w] };
      }),

    deleteWorkout: (id) => update((s) => ({ ...s, workouts: s.workouts.filter((w) => w.id !== id) })),

    addExercise({ name, category, kind }) {
      if (state.status !== "ready") throw new Error("저장소가 준비되지 않았습니다");
      const check = checkNewExerciseName(state.store.exercises, name);
      if (!check.ok) return check;
      const exercise: Exercise = { id: createId(), name: name.trim(), kind, category, archived: false };
      const write = update((s) => ({ ...s, exercises: [...s.exercises, exercise] }));
      return { ok: true, exercise, write };
    },

    setExerciseArchived: (id, archived) =>
      update((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === id ? { ...e, archived } : e)) })),

    deleteExercise(id) {
      if (state.status !== "ready") throw new Error("저장소가 준비되지 않았습니다");
      const check = checkExerciseDelete(state.store, id);
      if (!check.ok) return check;
      return { ok: true, write: update((s) => ({ ...s, exercises: s.exercises.filter((e) => e.id !== id) })) };
    },

    replaceAll: (next) => update(() => next),

    // 손상·새 버전 상태에서 빠져나오는 유일한 길이라 ready가 아니어도 허용한다
    resetAll: () => persist(createInitialStore()),
  };
}
