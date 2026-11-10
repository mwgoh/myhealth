import { describe, expect, it } from "vitest";
import {
  entrySummaryText,
  formatDateLabel,
  formatDuration,
  formatInt,
  formatKm,
  formatMonthLabel,
  workoutTimeText,
  formatWeekLabel,
  workoutCategories,
  workoutSummaryText,
} from "./format";
import { SEED_EXERCISES } from "./seed";
import type { Entry, Workout } from "./types";

const byId = new Map(SEED_EXERCISES.map((e) => [e.id, e]));
const bench = byId.get("seed-bench-press")!;
const running = byId.get("seed-running")!;

const weightedSets = (n: number): Entry => ({
  id: "e",
  exerciseId: "seed-bench-press",
  kind: "weighted",
  sets: Array.from({ length: n }, () => ({ weightKg: 60, reps: 8 })),
});
const run = (durationMin: number, distanceKm?: number): Entry =>
  distanceKm === undefined
    ? { id: "r", exerciseId: "seed-running", kind: "cardio", durationMin }
    : { id: "r", exerciseId: "seed-running", kind: "cardio", durationMin, distanceKm };

describe("숫자 형식", () => {
  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("0분");
    expect(formatDuration(45)).toBe("45분");
    expect(formatDuration(90)).toBe("1시간 30분");
    expect(formatDuration(120)).toBe("2시간");
    expect(formatDuration(59.6)).toBe("1시간");
  });

  it("formatInt", () => {
    expect(formatInt(12345.6)).toBe("12,346");
    expect(formatInt(0)).toBe("0");
  });

  it("formatKm", () => {
    expect(formatKm(0.1 + 0.2)).toBe("0.3");
    expect(formatKm(10)).toBe("10.0");
  });
});

describe("날짜 형식", () => {
  it("formatDateLabel", () => {
    expect(formatDateLabel("2026-11-09")).toBe("11월 9일 (월)");
  });

  it("formatWeekLabel", () => {
    expect(formatWeekLabel({ start: "2026-11-09", end: "2026-11-15" })).toBe("11월 9일 – 11월 15일");
    expect(formatWeekLabel({ start: "2026-12-28", end: "2027-01-03" })).toBe("2026년 12월 28일 – 2027년 1월 3일");
  });

  it("formatMonthLabel", () => {
    expect(formatMonthLabel("2026-11-09")).toBe("2026년 11월");
  });
});

describe("기록 요약 문구", () => {
  it("entrySummaryText", () => {
    expect(entrySummaryText(weightedSets(5), bench)).toBe("벤치프레스 5세트");
    expect(entrySummaryText(run(30), running)).toBe("러닝 30분");
    expect(entrySummaryText(run(30, 5.2), running)).toBe("러닝 30분 5.2km");
    expect(entrySummaryText(run(90), running)).toBe("러닝 1시간 30분");
    expect(entrySummaryText(weightedSets(2), undefined)).toBe("알 수 없는 종목 2세트");
  });

  const w1: Workout = {
    id: "w1",
    date: "2026-11-09",
    createdAt: "2026-11-09T01:00:00.000Z",
    entries: [
      { id: "a", exerciseId: "seed-bench-press", kind: "weighted", sets: [{ weightKg: 60, reps: 8 }, { weightKg: 60, reps: 8 }] },
      { id: "b", exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: 60 }] },
    ],
  };
  const w3: Workout = {
    id: "w3",
    date: "2026-11-11",
    createdAt: "2026-11-11T01:00:00.000Z",
    entries: [
      { id: "e", exerciseId: "seed-hamstring-stretch", kind: "timed", sets: [{ seconds: 30 }] },
      { id: "d", exerciseId: "seed-push-up", kind: "reps", sets: [{ reps: 20, addedKg: 0 }] },
      { id: "g", exerciseId: "seed-pull-up", kind: "reps", sets: [{ reps: 5, addedKg: 0 }] },
    ],
  };

  it("workoutSummaryText", () => {
    expect(workoutSummaryText(w1, byId)).toBe("벤치프레스 2세트 · 플랭크 1세트");
  });

  it("workoutCategories는 CATEGORIES 순서이고 중복이 없다", () => {
    expect(workoutCategories(w3, byId)).toEqual(["bodyweight", "stretching"]);
  });
});

describe("workoutTimeText", () => {
  const base = { id: "w", date: "2026-11-10", createdAt: "2026-11-10T01:00:00.000Z", entries: [] };
  it("시작·종료가 있으면 시간대와 총 운동 시간", () => {
    expect(workoutTimeText({ ...base, startTime: "07:10", endTime: "08:25", durationMin: 75 })).toBe("07:10–08:25 · 1시간 15분");
  });
  it("하나만 있으면 시작 또는 종료 시각, 총 시간이 있으면 덧붙인다", () => {
    expect(workoutTimeText({ ...base, startTime: "07:10" })).toBe("07:10 시작");
    expect(workoutTimeText({ ...base, endTime: "08:25", durationMin: 40 })).toBe("08:25 종료 · 40분");
  });
  it("시간 없이 총 시간만 있는 예전 기록은 총 시간만, 아무것도 없으면 null", () => {
    expect(workoutTimeText({ ...base, durationMin: 45 })).toBe("45분");
    expect(workoutTimeText(base)).toBeNull();
  });
});
