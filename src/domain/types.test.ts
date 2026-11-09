import { describe, expect, it } from "vitest";
import { LIMITS, parseStore, withinLimit, type Store } from "./types";

function validStore(): Store {
  return {
    version: 1,
    exercises: [{ id: "ex1", name: "벤치프레스", kind: "weighted", category: "strength", archived: false }],
    workouts: [
      {
        id: "w1",
        date: "2026-11-09",
        createdAt: "2026-11-09T01:00:00.000Z",
        entries: [{ id: "e1", exerciseId: "ex1", kind: "weighted", sets: [{ weightKg: 60, reps: 8 }] }],
      },
    ],
  };
}

describe("withinLimit", () => {
  it("범위와 정수 조건을 검사한다", () => {
    expect(withinLimit(0, LIMITS.weightKg)).toBe(true);
    expect(withinLimit(1000.5, LIMITS.weightKg)).toBe(false);
    expect(withinLimit(8.5, LIMITS.reps)).toBe(false);
    expect(withinLimit(0, LIMITS.cardioDurationMin)).toBe(false);
    expect(withinLimit(0.1, LIMITS.distanceKm)).toBe(true);
  });
});

describe("parseStore", () => {
  it("유효한 store는 통과한다", () => {
    const store = validStore();
    expect(parseStore(store)).toEqual({ ok: true, store });
  });

  it("version이 1보다 크면 unsupported-version", () => {
    expect(parseStore({ ...validStore(), version: 2 })).toEqual({ ok: false, error: "unsupported-version" });
  });

  it("객체가 아니거나 필드가 빠지면 invalid-shape", () => {
    expect(parseStore(null)).toEqual({ ok: false, error: "invalid-shape" });
    expect(parseStore("text")).toEqual({ ok: false, error: "invalid-shape" });
    expect(parseStore({ version: 1, workouts: [] })).toEqual({ ok: false, error: "invalid-shape" });
  });

  it("존재하지 않는 날짜는 invalid-shape", () => {
    const s = validStore();
    s.workouts[0].date = "2026-02-30";
    expect(parseStore(s)).toEqual({ ok: false, error: "invalid-shape" });
  });

  it("종목이 없는 기록은 invalid-shape", () => {
    const s = validStore();
    s.workouts[0].entries = [];
    expect(parseStore(s)).toEqual({ ok: false, error: "invalid-shape" });
  });

  it("범위를 벗어난 값은 invalid-shape", () => {
    const s = validStore();
    s.workouts[0].entries = [{ id: "e1", exerciseId: "ex1", kind: "weighted", sets: [{ weightKg: 60, reps: 0 }] }];
    expect(parseStore(s)).toEqual({ ok: false, error: "invalid-shape" });
  });

  it("메모가 1000자를 넘으면 invalid-shape", () => {
    const s = validStore();
    s.workouts[0].memo = "가".repeat(1001);
    expect(parseStore(s)).toEqual({ ok: false, error: "invalid-shape" });
  });

  it("종목 id가 중복되면 invalid-shape", () => {
    const s = validStore();
    s.exercises.push({ ...s.exercises[0], name: "다른 이름" });
    expect(parseStore(s)).toEqual({ ok: false, error: "invalid-shape" });
  });

  it("없는 종목을 참조하면 unknown-exercise", () => {
    const s = validStore();
    s.workouts[0].entries[0].exerciseId = "nope";
    expect(parseStore(s)).toEqual({ ok: false, error: "unknown-exercise" });
  });

  it("종목과 측정 방식이 다르면 kind-mismatch", () => {
    const s = validStore();
    s.workouts[0].entries = [{ id: "e1", exerciseId: "ex1", kind: "reps", sets: [{ reps: 10, addedKg: 0 }] }];
    expect(parseStore(s)).toEqual({ ok: false, error: "kind-mismatch" });
  });
});
