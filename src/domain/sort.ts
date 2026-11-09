import type { Workout } from "./types";

/** 날짜 내림차순, 같은 날짜는 만든 시각 내림차순. 원본 배열은 바꾸지 않는다. */
export function sortNewestFirst(workouts: readonly Workout[]): Workout[] {
  const key = (w: Workout) => `${w.date}|${w.createdAt}`;
  return [...workouts].sort((a, b) => (key(a) < key(b) ? 1 : key(a) > key(b) ? -1 : 0));
}
