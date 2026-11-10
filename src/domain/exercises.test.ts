import { describe, expect, it } from "vitest";
import { checkExerciseDelete, checkNewExerciseName, defaultKindFor, exerciseUseCount, isSeedExercise, pickerList } from "./exercises";
import { createInitialStore } from "./seed";
import { CATEGORIES, type Category, type Exercise, type Store, type Workout } from "./types";

function workoutUsing(id: string, date: string, exerciseId: string): Workout {
  return {
    id,
    date,
    createdAt: `${date}T01:00:00.000Z`,
    entries: [{ id: `${id}-e`, exerciseId, kind: "timed", sets: [{ seconds: 30 }] }],
  };
}

describe("defaultKindFor", () => {
  it("분류별 기본 측정 방식", () => {
    expect(CATEGORIES.map(defaultKindFor)).toEqual(["weighted", "weighted", "weighted", "reps", "reps", "timed", "cardio"]);
  });
});

describe("checkNewExerciseName", () => {
  const ex = createInitialStore().exercises;

  it("앞뒤 공백을 무시하고 중복을 찾는다", () => {
    expect(checkNewExerciseName(ex, "  벤치프레스 ")).toEqual({ ok: false, reason: "duplicate" });
  });

  it("빈 이름은 거부한다", () => {
    expect(checkNewExerciseName(ex, "   ")).toEqual({ ok: false, reason: "empty" });
  });

  it("새 이름은 통과한다", () => {
    expect(checkNewExerciseName(ex, "배틀 로프")).toEqual({ ok: true });
  });

  it("대소문자를 무시하고 숨긴 종목의 중복을 알려준다", () => {
    const withEng: Exercise[] = [
      ...ex,
      { id: "x", name: "pull up", kind: "reps", category: "bodyweight", archived: true },
    ];
    expect(checkNewExerciseName(withEng, "Pull Up")).toEqual({
      ok: false,
      reason: "duplicate-archived",
      existingId: "x",
    });
  });
});

describe("pickerList", () => {
  it("기록이 없으면 Store 순서, 검색은 분류 안에서만", () => {
    const s = createInitialStore();
    expect(pickerList(s, { category: "all", query: "플랭" }).map((e) => e.id)).toEqual([
      "seed-plank",
      "seed-side-plank",
    ]);
    expect(pickerList(s, { category: "stretching", query: "플랭" })).toEqual([]);
  });

  it("검색은 공백을 무시한다", () => {
    expect(
      pickerList(createInitialStore(), { category: "core", query: "사이드플랭크" }).map((e) => e.id),
    ).toEqual(["seed-side-plank"]);
  });

  it("최근 사용순, 쓰지 않은 종목은 기본 순서", () => {
    const s: Store = {
      ...createInitialStore(),
      workouts: [
        workoutUsing("a", "2026-11-01", "seed-plank"),
        { ...workoutUsing("b", "2026-11-05", "seed-crunch"), entries: [{ id: "b-e", exerciseId: "seed-crunch", kind: "reps", sets: [{ reps: 10, addedKg: 0 }] }] },
      ],
    };
    expect(pickerList(s, { category: "core", query: "" }).map((e) => e.id)).toEqual([
      "seed-crunch",
      "seed-plank",
      "seed-side-plank",
      "seed-hollow-hold",
      "seed-leg-raise",
      "seed-dead-bug",
      "seed-bird-dog",
      "seed-russian-twist",
      "seed-mountain-climber",
    ]);
  });

  it("같은 날짜면 createdAt이 늦은 쪽이 앞이다", () => {
    const s: Store = {
      ...createInitialStore(),
      workouts: [
        { ...workoutUsing("a", "2026-11-05", "seed-plank"), createdAt: "2026-11-05T09:00:00.000Z" },
        { ...workoutUsing("b", "2026-11-05", "seed-side-plank"), createdAt: "2026-11-05T01:00:00.000Z" },
      ],
    };
    expect(pickerList(s, { category: "core", query: "" }).slice(0, 2).map((e) => e.id)).toEqual([
      "seed-plank",
      "seed-side-plank",
    ]);
  });

  it("숨긴 종목은 보이지 않는다", () => {
    const s = createInitialStore();
    s.exercises.find((e) => e.id === "seed-plank")!.archived = true;
    expect(pickerList(s, { category: "core", query: "" }).map((e) => e.id)).not.toContain("seed-plank");
  });
});

describe("checkExerciseDelete", () => {
  const custom: Exercise = { id: "c1", name: "배틀 로프", kind: "timed", category: "strength", archived: false };
  const withCustom = (workouts: Workout[] = []): Store => {
    const s = createInitialStore();
    return { ...s, exercises: [...s.exercises, custom], workouts };
  };

  it("기록에 쓰이지 않은 직접 추가 종목은 삭제할 수 있다", () => {
    expect(checkExerciseDelete(withCustom(), "c1")).toEqual({ ok: true });
  });

  it("기본 종목은 삭제할 수 없다(숨기기만)", () => {
    expect(checkExerciseDelete(withCustom(), "seed-plank")).toEqual({ ok: false, reason: "seed" });
    expect(isSeedExercise("seed-plank")).toBe(true);
    expect(isSeedExercise("c1")).toBe(false);
  });

  it("기록에 쓰인 종목은 삭제할 수 없고, 쓰인 기록 수를 알려준다", () => {
    const s = withCustom([workoutUsing("w1", "2026-11-01", "c1"), workoutUsing("w2", "2026-11-02", "c1"), workoutUsing("w3", "2026-11-03", "seed-plank")]);
    expect(exerciseUseCount(s, "c1")).toBe(2);
    expect(checkExerciseDelete(s, "c1")).toEqual({ ok: false, reason: "in-use", uses: 2, timers: 0 });
  });

  it("한 기록에 같은 종목이 여러 번 있어도 기록 1개로 센다", () => {
    const w = workoutUsing("w1", "2026-11-01", "c1");
    const twice: Workout = { ...w, entries: [...w.entries, { ...w.entries[0], id: "w1-e2" }] };
    expect(exerciseUseCount(withCustom([twice]), "c1")).toBe(1);
  });

  it("없는 종목", () => {
    expect(checkExerciseDelete(withCustom(), "nope")).toEqual({ ok: false, reason: "not-found" });
  });
});

describe("분류 #케틀벨·#덤벨 (2026-11-10)", () => {
  it("분류는 7개이고 두 분류의 기본 측정 방식은 무게×횟수", () => {
    expect(CATEGORIES).toEqual(["strength", "kettlebell", "dumbbell", "bodyweight", "core", "stretching", "cardio"]);
    expect(defaultKindFor("kettlebell" as Category)).toBe("weighted");
    expect(defaultKindFor("dumbbell" as Category)).toBe("weighted");
  });
});

describe("checkExerciseDelete: 타이머 (2026-11-10)", () => {
  it("타이머에 쓰인 직접 추가 종목은 삭제할 수 없고, 쓰인 타이머 수를 알려준다", () => {
    const s = createInitialStore();
    const custom: Exercise = { id: "c9", name: "배틀 로프", kind: "timed", category: "cardio", archived: false };
    const store: Store = {
      ...s,
      exercises: [...s.exercises, custom],
      timers: [{ id: "t1", name: "서킷", prepSec: 10, workSec: 30, restSec: 10, rounds: 3, roundRestSec: 60, exerciseIds: ["c9"] }],
    };
    expect(checkExerciseDelete(store, "c9")).toEqual({ ok: false, reason: "in-use", uses: 0, timers: 1 });
  });
});
