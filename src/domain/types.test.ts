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

describe("운동 시작·종료 시간", () => {
  it("선택 필드다. 없는 예전 기록과 HH:MM으로 있는 기록 모두 통과한다", () => {
    expect(parseStore(validStore()).ok).toBe(true);
    const s = validStore();
    s.workouts[0] = { ...s.workouts[0], startTime: "07:10", endTime: "08:25" };
    const r = parseStore(s);
    expect(r.ok && r.store.workouts[0]).toMatchObject({ startTime: "07:10", endTime: "08:25" });
  });

  it("HH:MM이 아니면 invalid-shape", () => {
    const s = validStore();
    s.workouts[0] = { ...s.workouts[0], startTime: "25:00" };
    expect(parseStore(s)).toEqual({ ok: false, error: "invalid-shape" });
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

describe("타이머 저장 (2026-11-10)", () => {
  const timer = { id: "t1", name: "하체 서킷", prepSec: 10, workSec: 40, restSec: 20, rounds: 3, roundRestSec: 60, exerciseIds: ["ex1"] };

  it("timers는 선택 필드다. 없는 예전 데이터와 있는 데이터 모두 통과한다", () => {
    expect(parseStore(validStore()).ok).toBe(true);
    const r = parseStore({ ...validStore(), timers: [timer] });
    expect(r.ok && r.store.timers).toEqual([timer]);
  });

  it("범위를 벗어난 타이머는 invalid-shape, 없는 종목을 가리키면 unknown-exercise", () => {
    expect(parseStore({ ...validStore(), timers: [{ ...timer, workSec: 3 }] })).toEqual({ ok: false, error: "invalid-shape" });
    expect(parseStore({ ...validStore(), timers: [{ ...timer, exerciseIds: ["nope"] }] })).toEqual({ ok: false, error: "unknown-exercise" });
    expect(parseStore({ ...validStore(), timers: [timer, timer] })).toEqual({ ok: false, error: "invalid-shape" });
  });
});
