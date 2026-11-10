/** 인터벌 타이머 설정. 종목이 없으면 기본 인터벌, 있으면 서킷이다. */
export type TimerPlan = {
  id: string;
  name: string;
  prepSec: number;
  workSec: number;
  restSec: number;
  /** 기본 인터벌은 세트 수, 서킷은 라운드 수 */
  rounds: number;
  /** 서킷의 라운드 사이 휴식. 기본 인터벌에서는 쓰지 않는다 */
  roundRestSec: number;
  exerciseIds: string[];
};

type Range = { min: number; max: number };

// 설계 2절 값 범위
export const TIMER_LIMITS = {
  prepSec: { min: 0, max: 600 },
  workSec: { min: 5, max: 3600 },
  restSec: { min: 0, max: 3600 },
  rounds: { min: 1, max: 50 },
  roundRestSec: { min: 0, max: 3600 },
  nameMax: 30,
  exercisesMax: 20,
} as const satisfies Record<string, Range | number>;

export function newTimerPlan(id: string): TimerPlan {
  return { id, name: "내 타이머", prepSec: 10, workSec: 30, restSec: 10, rounds: 3, roundRestSec: 60, exerciseIds: [] };
}

const preset = (id: string, name: string, v: Omit<TimerPlan, "id" | "name">): TimerPlan => ({ id, name, ...v });

/** 기본 프리셋. 고칠 수 없고 복사해서 내 타이머로 만든다(설계 2절 표). */
export const TIMER_PRESETS: readonly TimerPlan[] = [
  preset("preset-basic", "기본 인터벌", { prepSec: 10, workSec: 30, restSec: 10, rounds: 3, roundRestSec: 60, exerciseIds: [] }),
  preset("preset-tabata", "타바타", { prepSec: 10, workSec: 20, restSec: 10, rounds: 8, roundRestSec: 60, exerciseIds: [] }),
  preset("preset-hiit-beginner", "HIIT 초급", { prepSec: 10, workSec: 30, restSec: 30, rounds: 8, roundRestSec: 60, exerciseIds: [] }),
  preset("preset-hiit-intermediate", "HIIT 중급", { prepSec: 10, workSec: 40, restSec: 20, rounds: 8, roundRestSec: 60, exerciseIds: [] }),
  preset("preset-full-body", "전신 서킷", {
    prepSec: 10,
    workSec: 40,
    restSec: 20,
    rounds: 3,
    roundRestSec: 60,
    exerciseIds: ["seed-air-squat", "seed-push-up", "seed-plank", "seed-burpee"],
  }),
  preset("preset-core", "코어 서킷", {
    prepSec: 10,
    workSec: 30,
    restSec: 15,
    rounds: 3,
    roundRestSec: 45,
    exerciseIds: ["seed-crunch", "seed-leg-raise", "seed-dead-bug", "seed-mountain-climber"],
  }),
];

export const isPresetId = (id: string): boolean => id.startsWith("preset-");

export type TimerField = "name" | "prepSec" | "workSec" | "restSec" | "rounds" | "roundRestSec" | "exerciseIds";

const inRange = (n: number, r: Range) => Number.isInteger(n) && n >= r.min && n <= r.max;

/** 범위를 벗어난 칸. 모두 맞으면 빈 배열 */
export function checkTimerPlan(p: TimerPlan): TimerField[] {
  const bad: TimerField[] = [];
  const name = p.name.trim();
  if (name.length < 1 || name.length > TIMER_LIMITS.nameMax) bad.push("name");
  for (const f of ["prepSec", "workSec", "restSec", "rounds", "roundRestSec"] as const) {
    if (!inRange(p[f], TIMER_LIMITS[f])) bad.push(f);
  }
  if (p.exerciseIds.length > TIMER_LIMITS.exercisesMax || new Set(p.exerciseIds).size !== p.exerciseIds.length) bad.push("exerciseIds");
  return bad;
}

export type SegmentKind = "prep" | "work" | "rest" | "roundRest";

export type Segment = {
  kind: SegmentKind;
  sec: number;
  startSec: number;
  /** 1부터 */
  round: number;
  /** 라운드 안 종목 순서(0부터). 기본 인터벌은 0 */
  index: number;
  exerciseId?: string;
  /** 준비·휴식 구간에서 다음 운동의 종목 */
  nextExerciseId?: string;
};

/** 설정을 구간 목록으로 펼친다. 0초 구간은 만들지 않고, 마지막 운동 뒤에는 휴식이 없다. */
export function buildSegments(p: TimerPlan): Segment[] {
  const segments: Segment[] = [];
  let t = 0;
  const push = (s: Omit<Segment, "startSec">) => {
    if (s.sec <= 0) return;
    segments.push({ ...s, startSec: t });
    t += s.sec;
  };
  const ex = p.exerciseIds;
  const circuit = ex.length > 0;
  const perRound = circuit ? ex.length : 1;
  push({ kind: "prep", sec: p.prepSec, round: 1, index: 0, nextExerciseId: ex[0] });
  for (let round = 1; round <= p.rounds; round++) {
    for (let i = 0; i < perRound; i++) {
      push({ kind: "work", sec: p.workSec, round, index: i, exerciseId: ex[i] });
      if (round === p.rounds && i === perRound - 1) continue;
      if (i < perRound - 1) push({ kind: "rest", sec: p.restSec, round, index: i, nextExerciseId: ex[i + 1] });
      else if (circuit) push({ kind: "roundRest", sec: p.roundRestSec, round, index: i, nextExerciseId: ex[0] });
      else push({ kind: "rest", sec: p.restSec, round, index: i });
    }
  }
  return segments;
}

export const totalSec = (segments: readonly Segment[]): number => segments.reduce((sum, s) => sum + s.sec, 0);

export type Position = { segmentIndex: number; remainingSec: number; done: boolean };

/** 흐른 시간(ms)에서 지금 구간과 남은 초(올림) */
export function positionAt(segments: readonly Segment[], elapsedMs: number): Position {
  const sec = elapsedMs / 1000;
  if (sec >= totalSec(segments)) return { segmentIndex: segments.length - 1, remainingSec: 0, done: true };
  const i = segments.findIndex((s) => sec < s.startSec + s.sec);
  const s = segments[i];
  return { segmentIndex: i, remainingSec: Math.ceil(s.startSec + s.sec - sec), done: false };
}

export type Cue = { atMs: number; speech?: string; beep?: "short" | "long" };

/** 전체 안내 목록(시간순). 설계 3절 표 */
export function timerCues(segments: readonly Segment[], nameOf: (exerciseId: string) => string): Cue[] {
  const cues: Cue[] = [];
  const rounds = segments.reduce((m, s) => Math.max(m, s.round), 0);
  const circuit = segments.some((s) => s.exerciseId !== undefined);
  for (const s of segments) {
    const start = s.startSec * 1000;
    const end = start + s.sec * 1000;
    switch (s.kind) {
      case "prep":
        cues.push({ atMs: start, speech: s.nextExerciseId ? `준비하세요. 첫 운동은 ${nameOf(s.nextExerciseId)}` : "준비하세요" });
        break;
      case "work": {
        const last = rounds > 1 && s.round === rounds && s.index === 0 ? `마지막 ${circuit ? "라운드" : "세트"}. ` : "";
        cues.push({ atMs: start, speech: `${last}${s.exerciseId ? `${nameOf(s.exerciseId)} 시작` : "시작"}`, beep: "long" });
        if (s.sec >= 20) cues.push({ atMs: start + s.sec * 500, speech: "절반" });
        break;
      }
      case "rest":
        cues.push({ atMs: start, speech: s.nextExerciseId ? `휴식. 다음은 ${nameOf(s.nextExerciseId)}` : "휴식" });
        break;
      case "roundRest":
        cues.push({ atMs: start, speech: `라운드 휴식. 다음은 ${s.round + 1}라운드` });
        break;
    }
    if (s.sec >= 4) {
      for (const n of [3, 2, 1]) cues.push({ atMs: end - n * 1000, speech: String(n), beep: "short" });
    }
  }
  cues.push({ atMs: totalSec(segments) * 1000, speech: "운동 끝. 수고하셨습니다", beep: "long" });
  return cues.sort((a, b) => a.atMs - b.atMs);
}

/** 직전 확인 이후로 낼 안내(prevMs < atMs ≤ nowMs). 1.5초 넘게 지났으면 그사이 안내는 버린다. */
export function cuesBetween(segments: readonly Segment[], nameOf: (exerciseId: string) => string, prevMs: number, nowMs: number): Cue[] {
  if (nowMs - prevMs > 1500) return [];
  return timerCues(segments, nameOf).filter((c) => c.atMs > prevMs && c.atMs <= nowMs);
}

/** 목록에 보여줄 요약. 예: "40초 운동 · 20초 휴식 · 3라운드 · 4종목 · 약 13분" */
export function timerSummary(p: TimerPlan): string {
  const circuit = p.exerciseIds.length > 0;
  const parts = [`${p.workSec}초 운동`];
  if (p.restSec > 0) parts.push(`${p.restSec}초 휴식`);
  parts.push(circuit ? `${p.rounds}라운드` : `${p.rounds}세트`);
  if (circuit) parts.push(`${p.exerciseIds.length}종목`);
  parts.push(`약 ${Math.max(1, Math.round(totalSec(buildSegments(p)) / 60))}분`);
  return parts.join(" · ");
}

/** 초를 "m:ss"로. 실행 화면의 남은 시간에 쓴다. */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
