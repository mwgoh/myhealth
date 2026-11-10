import { describe, expect, it } from "vitest";
import { SEED_EXERCISES } from "./seed";
import { LIMITS, type Workout } from "./types";
import {
  addSet,
  appendExercises,
  draftFromWorkout,
  hasCompletedSets,
  newEntryDraft,
  newWorkoutDraft,
  readField,
  toPersistable,
  type EntryDraft,
  withDate,
  type WorkoutDraft,
} from "./workout";

const seed = (id: string) => SEED_EXERCISES.find((e) => e.id === id)!;

function draftWith(entries: EntryDraft[], over: Partial<WorkoutDraft> = {}): WorkoutDraft {
  return {
    id: "w1",
    date: "2026-11-09",
    createdAt: "2026-11-09T01:00:00.000Z",
    durationMin: "",
    memo: "",
    entries,
    ...over,
  };
}

function persisted(d: WorkoutDraft): Workout {
  const r = toPersistable(d);
  if (!r.ok) throw new Error(`저장 불가: ${r.reason}`);
  return r.workout;
}

describe("readField", () => {
  it("숫자 문자열을 읽고 범위를 검사한다", () => {
    expect(readField("52,5", LIMITS.weightKg)).toEqual({ kind: "valid", value: 52.5 });
    expect(readField(" 60 ", LIMITS.weightKg)).toEqual({ kind: "valid", value: 60 });
    expect(readField("", LIMITS.weightKg)).toEqual({ kind: "empty" });
    expect(readField("-5", LIMITS.addedKg)).toEqual({ kind: "invalid" });
    expect(readField("1e3", LIMITS.weightKg)).toEqual({ kind: "invalid" });
    expect(readField("8.5", LIMITS.reps)).toEqual({ kind: "invalid" });
    expect(readField("1001", LIMITS.weightKg)).toEqual({ kind: "invalid" });
  });
});

describe("초안 만들기", () => {
  it("newWorkoutDraft", () => {
    const d = newWorkoutDraft("2026-11-09", new Date("2026-11-09T01:02:03.000Z"));
    expect(d).toMatchObject({ date: "2026-11-09", createdAt: "2026-11-09T01:02:03.000Z", durationMin: "", memo: "", entries: [] });
    expect(d.id).not.toBe("");
  });

  it("newEntryDraft는 세트형이면 빈 세트 1개, 유산소면 빈 칸", () => {
    expect(newEntryDraft(seed("seed-plank"))).toMatchObject({ kind: "timed", exerciseId: "seed-plank", sets: [{ seconds: "" }] });
    expect(newEntryDraft(seed("seed-bench-press"))).toMatchObject({ kind: "weighted", sets: [{ weightKg: "", reps: "" }] });
    expect(newEntryDraft(seed("seed-push-up"))).toMatchObject({ kind: "reps", sets: [{ reps: "", addedKg: "" }] });
    expect(newEntryDraft(seed("seed-running"))).toMatchObject({ kind: "cardio", durationMin: "", distanceKm: "" });
  });
});

describe("addSet", () => {
  it("직전 세트를 복사하고 원본을 바꾸지 않는다", () => {
    const e: EntryDraft = { id: "e", exerciseId: "seed-bench-press", kind: "weighted", sets: [{ weightKg: "60", reps: "8" }] };
    const r = addSet(e);
    expect(r).toMatchObject({ sets: [{ weightKg: "60", reps: "8" }, { weightKg: "60", reps: "8" }] });
    expect(e.sets).toHaveLength(1);
  });

  it("세트가 없으면 빈 세트를 붙인다", () => {
    const e: EntryDraft = { id: "e", exerciseId: "seed-plank", kind: "timed", sets: [] };
    expect(addSet(e)).toMatchObject({ sets: [{ seconds: "" }] });
  });

  it("유산소는 그대로 돌려준다", () => {
    const e: EntryDraft = { id: "e", exerciseId: "seed-running", kind: "cardio", durationMin: "30", distanceKm: "" };
    expect(addSet(e)).toEqual(e);
  });
});

describe("toPersistable", () => {
  it("근력: 미완성·범위 초과 세트를 뺀다", () => {
    const w = persisted(
      draftWith([
        {
          id: "e1",
          exerciseId: "seed-bench-press",
          kind: "weighted",
          sets: [
            { weightKg: "60", reps: "8" },
            { weightKg: "", reps: "8" },
            { weightKg: "1001", reps: "5" },
          ],
        },
      ]),
    );
    expect(w.entries).toEqual([{ id: "e1", exerciseId: "seed-bench-press", kind: "weighted", sets: [{ weightKg: 60, reps: 8 }] }]);
  });

  it("횟수: 추가 중량이 비면 0, 잘못되면 그 세트를 뺀다", () => {
    const w = persisted(
      draftWith([
        {
          id: "e1",
          exerciseId: "seed-push-up",
          kind: "reps",
          sets: [
            { reps: "10", addedKg: "" },
            { reps: "10", addedKg: "-5" },
            { reps: "8.5", addedKg: "" },
          ],
        },
      ]),
    );
    expect(w.entries[0]).toMatchObject({ sets: [{ reps: 10, addedKg: 0 }] });
  });

  it("시간: 0초는 뺀다", () => {
    const w = persisted(
      draftWith([{ id: "e1", exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: "0" }, { seconds: "45" }] }]),
    );
    expect(w.entries[0]).toMatchObject({ sets: [{ seconds: 45 }] });
  });

  it("유산소", () => {
    const run = (durationMin: string, distanceKm: string): EntryDraft => ({
      id: "e1",
      exerciseId: "seed-running",
      kind: "cardio",
      durationMin,
      distanceKm,
    });
    const keep: EntryDraft = { id: "k", exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: "30" }] };

    expect(persisted(draftWith([run("", "5"), keep])).entries.map((e) => e.id)).toEqual(["k"]);
    expect(persisted(draftWith([run("30", "")])).entries[0]).toEqual({
      id: "e1",
      exerciseId: "seed-running",
      kind: "cardio",
      durationMin: 30,
    });
    expect(persisted(draftWith([run("30", "5.2")])).entries[0]).toMatchObject({ durationMin: 30, distanceKm: 5.2 });
    expect(persisted(draftWith([run("30", "abc"), keep])).entries.map((e) => e.id)).toEqual(["k"]);
  });

  it("기록 단위 필드", () => {
    const keep: EntryDraft = { id: "k", exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: "30" }] };
    expect(persisted(draftWith([keep], { durationMin: "0" })).durationMin).toBeUndefined();
    expect(persisted(draftWith([keep], { durationMin: "45" })).durationMin).toBe(45);
    expect("memo" in persisted(draftWith([keep], { memo: "  " }))).toBe(false);
    expect(persisted(draftWith([keep], { memo: "가".repeat(1200) })).memo).toHaveLength(1000);
  });

  it("완성된 종목이 없으면 no-entries", () => {
    expect(
      toPersistable(draftWith([{ id: "e", exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: "" }] }])),
    ).toEqual({ ok: false, reason: "no-entries" });
    expect(toPersistable(draftWith([]))).toEqual({ ok: false, reason: "no-entries" });
  });

  it("날짜가 잘못되면 invalid-date", () => {
    const keep: EntryDraft = { id: "k", exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: "30" }] };
    expect(toPersistable(draftWith([keep], { date: "" }))).toEqual({ ok: false, reason: "invalid-date" });
  });
});

describe("draftFromWorkout", () => {
  it("저장 형식 → 초안 → 저장 형식이 원래와 같다", () => {
    const w: Workout = {
      id: "w9",
      date: "2026-11-09",
      createdAt: "2026-11-09T01:00:00.000Z",
      durationMin: 50,
      memo: "가볍게",
      entries: [
        { id: "a", exerciseId: "seed-bench-press", kind: "weighted", sets: [{ weightKg: 52.5, reps: 8 }] },
        { id: "b", exerciseId: "seed-push-up", kind: "reps", sets: [{ reps: 15, addedKg: 0 }] },
        { id: "c", exerciseId: "seed-running", kind: "cardio", durationMin: 20 },
      ],
    };
    const d = draftFromWorkout(w);
    expect(d.entries[0]).toMatchObject({ sets: [{ weightKg: "52.5", reps: "8" }] });
    expect(d.entries[1]).toMatchObject({ sets: [{ reps: "15", addedKg: "" }] });
    expect(d.entries[2]).toMatchObject({ durationMin: "20", distanceKm: "" });
    expect(persisted(d)).toEqual(w);
  });
});

describe("hasCompletedSets", () => {
  it("완성된 세트가 있는지 판단한다", () => {
    expect(hasCompletedSets({ id: "e", exerciseId: "x", kind: "weighted", sets: [{ weightKg: "", reps: "" }] })).toBe(false);
    expect(hasCompletedSets({ id: "e", exerciseId: "x", kind: "weighted", sets: [{ weightKg: "60", reps: "8" }] })).toBe(true);
    expect(hasCompletedSets({ id: "e", exerciseId: "x", kind: "cardio", durationMin: "30", distanceKm: "" })).toBe(true);
    expect(hasCompletedSets({ id: "e", exerciseId: "x", kind: "cardio", durationMin: "", distanceKm: "5" })).toBe(false);
  });
});

describe("withDate", () => {
  it("빈 값이나 존재하지 않는 날짜는 무시하고 같은 초안을 돌려준다", () => {
    const d = draftWith([]);
    expect(withDate(d, "")).toBe(d);
    expect(withDate(d, "2026-02-30")).toBe(d);
  });

  it("유효한 날짜면 바꾼다", () => {
    expect(withDate(draftWith([]), "2026-11-01").date).toBe("2026-11-01");
  });
});

describe("appendExercises", () => {
  it("고른 순서대로 종목 초안을 덧붙이고, 새로 붙은 초안을 돌려준다", () => {
    const d = draftWith([]);
    const { draft, added } = appendExercises(d, [seed("seed-squat"), seed("seed-plank")]);
    expect(draft.entries.map((e) => e.exerciseId)).toEqual(["seed-squat", "seed-plank"]);
    expect(added.map((e) => e.exerciseId)).toEqual(["seed-squat", "seed-plank"]);
  });

  it("이미 기록에 있는 종목과 같은 목록 안의 중복은 덧붙이지 않는다", () => {
    const d = draftWith([newEntryDraft(seed("seed-squat"))]);
    const { draft, added } = appendExercises(d, [seed("seed-squat"), seed("seed-plank"), seed("seed-plank")]);
    expect(draft.entries.map((e) => e.exerciseId)).toEqual(["seed-squat", "seed-plank"]);
    expect(added.map((e) => e.exerciseId)).toEqual(["seed-plank"]);
  });

  it("덧붙일 것이 없으면 같은 초안 객체를 돌려준다", () => {
    const d = draftWith([newEntryDraft(seed("seed-squat"))]);
    const r = appendExercises(d, [seed("seed-squat")]);
    expect(r.draft).toBe(d);
    expect(r.added).toEqual([]);
  });
});
