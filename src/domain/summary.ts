import type { DateStr } from "./date";
import { CATEGORIES, type Category, type Store } from "./types";

export type Summary = {
  workoutDays: number;
  categoryDays: Record<Category, number>;
  totalDurationMin: number;
  missingDurationCount: number;
  volumeKg: number;
  totalReps: number;
  cardioDurationMin: number;
  cardioDistanceKm: number;
};

/** 기간(양 끝 포함) 안의 기록을 설계 6절 규칙으로 집계한다 */
export function summarize(store: Store, range: { start: DateStr; end: DateStr }): Summary {
  const categoryOf = new Map(store.exercises.map((e) => [e.id, e.category]));
  const days = new Set<DateStr>();
  const daysByCategory = new Map<Category, Set<DateStr>>(CATEGORIES.map((c) => [c, new Set()]));
  const s: Summary = {
    workoutDays: 0,
    categoryDays: Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>,
    totalDurationMin: 0,
    missingDurationCount: 0,
    volumeKg: 0,
    totalReps: 0,
    cardioDurationMin: 0,
    cardioDistanceKm: 0,
  };

  // "YYYY-MM-DD"는 사전순 비교가 날짜순 비교와 같다
  for (const w of store.workouts.filter((w) => w.date >= range.start && w.date <= range.end)) {
    days.add(w.date);
    let cardioMin = 0;
    for (const e of w.entries) {
      const category = categoryOf.get(e.exerciseId);
      if (category) daysByCategory.get(category)!.add(w.date);
      switch (e.kind) {
        case "weighted":
          for (const set of e.sets) s.volumeKg += set.weightKg * set.reps;
          break;
        case "reps":
          for (const set of e.sets) s.totalReps += set.reps;
          break;
        case "timed":
          break; // 시간 세트는 일수에만 반영한다
        case "cardio":
          cardioMin += e.durationMin;
          s.cardioDistanceKm += e.distanceKm ?? 0;
          break;
      }
    }
    s.cardioDurationMin += cardioMin;
    if (w.durationMin !== undefined) {
      s.totalDurationMin += w.durationMin;
    } else {
      s.totalDurationMin += cardioMin;
      if (!w.entries.some((e) => e.kind === "cardio")) s.missingDurationCount += 1;
    }
  }

  s.workoutDays = days.size;
  for (const c of CATEGORIES) s.categoryDays[c] = daysByCategory.get(c)!.size;
  return s;
}
