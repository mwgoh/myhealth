import { describe, expect, it } from "vitest";
import { createInitialStore } from "./seed";
import { summarize } from "./summary";
import type { Store } from "./types";

function fixture(): Store {
  return {
    ...createInitialStore(),
    workouts: [
      {
        id: "w1",
        date: "2026-11-09",
        createdAt: "2026-11-09T01:00:00.000Z",
        durationMin: 60,
        entries: [
          { id: "a", exerciseId: "seed-bench-press", kind: "weighted", sets: [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }] },
          { id: "b", exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: 60 }] },
        ],
      },
      {
        id: "w2",
        date: "2026-11-09",
        createdAt: "2026-11-09T10:00:00.000Z",
        entries: [{ id: "c", exerciseId: "seed-running", kind: "cardio", durationMin: 30, distanceKm: 5.2 }],
      },
      {
        id: "w3",
        date: "2026-11-11",
        createdAt: "2026-11-11T01:00:00.000Z",
        entries: [
          { id: "d", exerciseId: "seed-push-up", kind: "reps", sets: [{ reps: 20, addedKg: 0 }, { reps: 15, addedKg: 10 }] },
          { id: "e", exerciseId: "seed-hamstring-stretch", kind: "timed", sets: [{ seconds: 30 }] },
        ],
      },
      {
        id: "w4",
        date: "2026-11-16",
        createdAt: "2026-11-16T01:00:00.000Z",
        entries: [{ id: "f", exerciseId: "seed-bench-press", kind: "weighted", sets: [{ weightKg: 100, reps: 1 }] }],
      },
    ],
  };
}

const WEEK = { start: "2026-11-09", end: "2026-11-15" };

describe("summarize", () => {
  it("주간 집계", () => {
    expect(summarize(fixture(), WEEK)).toEqual({
      workoutDays: 2,
      categoryDays: { strength: 1, bodyweight: 1, core: 1, stretching: 1, cardio: 1 },
      totalDurationMin: 90,
      missingDurationCount: 1,
      volumeKg: 960,
      totalReps: 35,
      cardioDurationMin: 30,
      cardioDistanceKm: 5.2,
    });
  });

  it("빈 기간은 모두 0", () => {
    expect(summarize(fixture(), { start: "2026-10-01", end: "2026-10-31" })).toEqual({
      workoutDays: 0,
      categoryDays: { strength: 0, bodyweight: 0, core: 0, stretching: 0, cardio: 0 },
      totalDurationMin: 0,
      missingDurationCount: 0,
      volumeKg: 0,
      totalReps: 0,
      cardioDurationMin: 0,
      cardioDistanceKm: 0,
    });
  });

  it("숨긴 종목도 분류별 일수에 센다", () => {
    const s = fixture();
    s.exercises.find((e) => e.id === "seed-plank")!.archived = true;
    expect(summarize(s, WEEK).categoryDays.core).toBe(1);
  });

  it("양 끝 날짜를 포함한다", () => {
    expect(summarize(fixture(), { start: "2026-11-11", end: "2026-11-16" }).workoutDays).toBe(2);
  });
});
