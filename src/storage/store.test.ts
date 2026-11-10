import { describe, expect, it, vi } from "vitest";
import { createInitialStore } from "@/domain/seed";
import type { Store, Workout } from "@/domain/types";
import { createWorkoutStore, STORAGE_KEY, type StoreState } from "./store";

function memoryStorage(initial?: string) {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(STORAGE_KEY, initial);
  const s = {
    setCalls: 0,
    failWrites: false,
    failReads: false,
    getItem(key: string) {
      if (s.failReads) throw new Error("저장소 접근 거부");
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      s.setCalls++;
      if (s.failWrites) throw new DOMException("용량 초과", "QuotaExceededError");
      data.set(key, value);
    },
    raw: () => data.get(STORAGE_KEY),
    put: (value: string) => data.set(STORAGE_KEY, value),
  };
  return s;
}

const workout = (id: string, memo?: string): Workout => ({
  id,
  date: "2026-11-09",
  createdAt: "2026-11-09T01:00:00.000Z",
  ...(memo ? { memo } : {}),
  entries: [{ id: `${id}-e`, exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: 60 }] }],
});

function readyStore(state: StoreState): Store {
  if (state.status !== "ready") throw new Error(`ready가 아님: ${state.status}`);
  return state.store;
}

function loaded(storage = memoryStorage()) {
  const st = createWorkoutStore(storage);
  st.load();
  return { st, storage };
}

describe("불러오기", () => {
  it("처음 상태는 loading", () => {
    expect(createWorkoutStore(memoryStorage()).getState()).toEqual({ status: "loading" });
  });

  it("빈 저장소 → 기본 데이터를 만들어 저장한다", () => {
    const { st, storage } = loaded();
    const store = readyStore(st.getState());
    expect(store.exercises).toHaveLength(42);
    expect(JSON.parse(storage.raw()!)).toEqual(store);
  });

  it("손상된 JSON → corrupt, 쓰기 차단, 원본 유지", () => {
    const { st, storage } = loaded(memoryStorage("{bad json"));
    expect(st.getState()).toEqual({ status: "corrupt", raw: "{bad json" });
    expect(st.upsertWorkout(workout("w1"))).toBe("blocked");
    expect(st.setExerciseArchived("seed-plank", true)).toBe("blocked");
    expect(st.replaceAll(createInitialStore())).toBe("blocked");
    expect(storage.raw()).toBe("{bad json");
    expect(storage.setCalls).toBe(0);
  });

  it("스키마 불일치 → corrupt", () => {
    const { st } = loaded(memoryStorage('{"version":1}'));
    expect(st.getState()).toEqual({ status: "corrupt", raw: '{"version":1}' });
  });

  it("새 버전 → unsupported-version, 쓰기 차단", () => {
    const raw = JSON.stringify({ ...createInitialStore(), version: 2 });
    const { st, storage } = loaded(memoryStorage(raw));
    expect(st.getState()).toEqual({ status: "unsupported-version", raw });
    expect(st.deleteWorkout("x")).toBe("blocked");
    expect(storage.raw()).toBe(raw);
  });

  it("저장된 유효한 데이터를 그대로 읽는다", () => {
    const saved: Store = { ...createInitialStore(), workouts: [workout("w1")] };
    const { st } = loaded(memoryStorage(JSON.stringify(saved)));
    expect(readyStore(st.getState())).toEqual(saved);
  });

  it("getItem 예외 → 읽지 못한 데이터를 덮어쓰지 않는다", () => {
    const storage = memoryStorage(JSON.stringify(createInitialStore()));
    storage.failReads = true;
    const { st } = loaded(storage);
    expect(st.getState().status).toBe("ready");
    expect(st.upsertWorkout(workout("w1"))).toBe("failed");
    expect(st.resetAll()).toBe("failed");
    expect(storage.setCalls).toBe(0);
  });
});

describe("쓰기", () => {
  it("upsertWorkout: 새 기록은 추가, 같은 id는 교체, 구독자는 1번 호출", () => {
    const { st, storage } = loaded();
    const listener = vi.fn();
    st.subscribe(listener);

    expect(st.upsertWorkout(workout("w1"))).toBe("saved");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(st.upsertWorkout(workout("w2"))).toBe("saved");
    expect(st.upsertWorkout(workout("w1", "수정"))).toBe("saved");

    const store = readyStore(st.getState());
    expect(store.workouts.map((w) => [w.id, w.memo])).toEqual([
      ["w1", "수정"],
      ["w2", undefined],
    ]);
    expect(JSON.parse(storage.raw()!)).toEqual(store);
  });

  it("구독을 해제하면 더 이상 호출되지 않는다", () => {
    const { st } = loaded();
    const listener = vi.fn();
    const off = st.subscribe(listener);
    off();
    st.upsertWorkout(workout("w1"));
    expect(listener).not.toHaveBeenCalled();
  });

  it("deleteWorkout", () => {
    const { st } = loaded();
    st.upsertWorkout(workout("w1"));
    st.upsertWorkout(workout("w2"));
    expect(st.deleteWorkout("w1")).toBe("saved");
    expect(readyStore(st.getState()).workouts.map((w) => w.id)).toEqual(["w2"]);
  });

  it("addExercise: 중복 거부, 성공하면 다듬은 이름으로 저장", () => {
    const { st, storage } = loaded();
    expect(st.addExercise({ name: "벤치프레스", category: "strength", kind: "weighted" })).toEqual({
      ok: false,
      reason: "duplicate",
    });
    const r = st.addExercise({ name: " 케틀벨 스윙 ", category: "strength", kind: "weighted" });
    expect(r).toMatchObject({
      ok: true,
      write: "saved",
      exercise: { name: "케틀벨 스윙", category: "strength", kind: "weighted", archived: false },
    });
    const saved: Store = JSON.parse(storage.raw()!);
    expect(saved.exercises.at(-1)?.name).toBe("케틀벨 스윙");
  });

  it("deleteExercise: 기록에 쓰이지 않은 직접 추가 종목만 지운다", () => {
    const { st, storage } = loaded();
    const added = st.addExercise({ name: "케틀벨 스윙", category: "strength", kind: "weighted" });
    if (!added.ok) throw new Error("추가 실패");
    expect(st.deleteExercise(added.exercise.id)).toEqual({ ok: true, write: "saved" });
    expect(readyStore(st.getState()).exercises.some((e) => e.id === added.exercise.id)).toBe(false);
    const saved: Store = JSON.parse(storage.raw()!);
    expect(saved.exercises.some((e) => e.id === added.exercise.id)).toBe(false);
  });

  it("deleteExercise: 기본 종목과 기록에 쓰인 종목은 지우지 않고 이유를 알려준다", () => {
    const { st, storage } = loaded();
    const added = st.addExercise({ name: "케틀벨 스윙", category: "strength", kind: "timed" });
    if (!added.ok) throw new Error("추가 실패");
    st.upsertWorkout({ ...workout("w1"), entries: [{ id: "e", exerciseId: added.exercise.id, kind: "timed", sets: [{ seconds: 30 }] }] });
    const before = storage.setCalls;
    expect(st.deleteExercise("seed-plank")).toEqual({ ok: false, reason: "seed" });
    expect(st.deleteExercise(added.exercise.id)).toEqual({ ok: false, reason: "in-use", uses: 1 });
    expect(storage.setCalls).toBe(before);
    expect(readyStore(st.getState()).exercises.some((e) => e.id === added.exercise.id)).toBe(true);
  });

  it("setExerciseArchived", () => {
    const { st } = loaded();
    expect(st.setExerciseArchived("seed-plank", true)).toBe("saved");
    expect(readyStore(st.getState()).exercises.find((e) => e.id === "seed-plank")?.archived).toBe(true);
  });

  it("replaceAll", () => {
    const { st } = loaded();
    const next: Store = { ...createInitialStore(), workouts: [workout("imported")] };
    expect(st.replaceAll(next)).toBe("saved");
    expect(readyStore(st.getState())).toEqual(next);
  });

  it("setItem 예외 → failed, 메모리에는 반영", () => {
    const { st, storage } = loaded();
    storage.failWrites = true;
    expect(st.upsertWorkout(workout("w1"))).toBe("failed");
    expect(readyStore(st.getState()).workouts.map((w) => w.id)).toEqual(["w1"]);
  });

  it("resetAll은 corrupt에서도 동작한다", () => {
    const { st, storage } = loaded(memoryStorage("{bad json"));
    expect(st.resetAll()).toBe("saved");
    expect(readyStore(st.getState()).exercises).toHaveLength(42);
    expect(JSON.parse(storage.raw()!)).toEqual(createInitialStore());
  });
});

describe("참조 무결성", () => {
  it("없는 종목을 가리키는 기록은 저장하지 않고 상태도 바꾸지 않는다", () => {
    const { st, storage } = loaded();
    const before = storage.raw();
    const stateBefore = st.getState();
    const bad: Workout = {
      ...workout("w1"),
      entries: [{ id: "x", exerciseId: "deleted-elsewhere", kind: "timed", sets: [{ seconds: 30 }] }],
    };
    expect(st.upsertWorkout(bad)).toBe("failed");
    expect(storage.raw()).toBe(before);
    expect(st.getState()).toBe(stateBefore);
  });

  it("종목과 측정 방식이 다른 기록도 저장하지 않는다", () => {
    const { st } = loaded();
    const bad: Workout = {
      ...workout("w1"),
      entries: [{ id: "x", exerciseId: "seed-bench-press", kind: "timed", sets: [{ seconds: 30 }] }],
    };
    expect(st.upsertWorkout(bad)).toBe("failed");
    expect(readyStore(st.getState()).workouts).toEqual([]);
  });
});

describe("상태 객체", () => {
  it("getState는 바뀌기 전까지 같은 객체", () => {
    const { st } = loaded();
    expect(st.getState()).toBe(st.getState());
  });

  it("다른 탭이 바꾼 내용은 load()로 다시 읽는다", () => {
    const { st, storage } = loaded();
    storage.put(JSON.stringify({ ...createInitialStore(), workouts: [workout("other-tab")] }));
    st.load();
    expect(readyStore(st.getState()).workouts.map((w) => w.id)).toEqual(["other-tab"]);
  });
});
