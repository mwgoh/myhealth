import { parseDateStr, weekdayKo, type DateStr } from "./date";
import { CATEGORIES, type Category, type Entry, type Exercise, type Workout } from "./types";

export function formatDuration(min: number): string {
  const total = Math.round(min);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}분`;
  return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
}

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString("ko-KR");
}

export function formatKm(n: number): string {
  return n.toFixed(1);
}

function parts(s: DateStr) {
  const d = parseDateStr(s);
  if (!d) throw new Error(`잘못된 날짜: ${s}`);
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

export function formatDateLabel(s: DateStr): string {
  const { m, d } = parts(s);
  return `${m}월 ${d}일 (${weekdayKo(s)})`;
}

export function formatWeekLabel(r: { start: DateStr; end: DateStr }): string {
  const a = parts(r.start);
  const b = parts(r.end);
  // 연말을 넘는 주는 헷갈리지 않게 양쪽에 연도를 붙인다
  if (a.y !== b.y) return `${a.y}년 ${a.m}월 ${a.d}일 – ${b.y}년 ${b.m}월 ${b.d}일`;
  return `${a.m}월 ${a.d}일 – ${b.m}월 ${b.d}일`;
}

export function formatMonthLabel(s: DateStr): string {
  const { y, m } = parts(s);
  return `${y}년 ${m}월`;
}

export function entrySummaryText(e: Entry, ex: Exercise | undefined): string {
  const name = ex?.name ?? "알 수 없는 종목";
  if (e.kind !== "cardio") return `${name} ${e.sets.length}세트`;
  const distance = e.distanceKm === undefined ? "" : ` ${formatKm(e.distanceKm)}km`;
  return `${name} ${formatDuration(e.durationMin)}${distance}`;
}

export function workoutSummaryText(w: Workout, byId: ReadonlyMap<string, Exercise>): string {
  return w.entries.map((e) => entrySummaryText(e, byId.get(e.exerciseId))).join(" · ");
}

export function workoutCategories(w: Workout, byId: ReadonlyMap<string, Exercise>): Category[] {
  const used = new Set(w.entries.map((e) => byId.get(e.exerciseId)?.category));
  return CATEGORIES.filter((c) => used.has(c));
}

/**
 * 기록 카드의 운동 시간 줄. 시작·종료가 있으면 "07:10–08:25 · 1시간 15분",
 * 하나만 있으면 "07:10 시작"/"08:25 종료", 시간 없이 총 시간만 있으면 "45분". 아무것도 없으면 null.
 */
export function workoutTimeText(w: Workout): string | null {
  const range =
    w.startTime && w.endTime ? `${w.startTime}–${w.endTime}` : w.startTime ? `${w.startTime} 시작` : w.endTime ? `${w.endTime} 종료` : null;
  const duration = w.durationMin === undefined ? null : formatDuration(w.durationMin);
  if (range && duration) return `${range} · ${duration}`;
  return range ?? duration;
}
