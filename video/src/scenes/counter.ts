import { ease } from "../figure/geometry";

/**
 * reps: 시작 자세 → 끝 자세(goFrames) → 끝 자세에서 멈춤(pauseFrames, 선택) → 시작 자세(returnFrames)를 reps번.
 *   스쿼트처럼 내리기가 먼저면 go가 내리기, 데드리프트처럼 들기가 먼저면 go가 들기다.
 * hold: 자세 잡기(setupFrames) 뒤 버티기(holdFrames)
 * timer: 정해진 시간 동안 계속하는 동작
 */
export type Timing =
  | { kind: "reps"; reps: number; goFrames: number; pauseFrames?: number; returnFrames: number }
  | { kind: "hold"; setupFrames: number; holdFrames: number }
  | { kind: "timer"; frames: number };

export type RepsTiming = Extract<Timing, { kind: "reps" }>;

export type CounterView = { text: string; progress: number };

/** 제목·완료 구간 길이(프레임) */
export const TITLE_FRAMES = 60;
export const DONE_FRAMES = 60;

/** 반복 한 번의 프레임 수 */
export const repFrames = (t: RepsTiming): number => t.goFrames + (t.pauseFrames ?? 0) + t.returnFrames;

export function mainFrames(t: Timing): number {
  switch (t.kind) {
    case "reps":
      return t.reps * repFrames(t);
    case "hold":
      return t.setupFrames + t.holdFrames;
    case "timer":
      return t.frames;
  }
}

export const totalFrames = (t: Timing): number => TITLE_FRAMES + mainFrames(t) + DONE_FRAMES;

export function formatClock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

// 첫 프레임에 전체 초를, 마지막 프레임에 0:00을 보여준다
function countdown(frame: number, frames: number, fps: number): CounterView {
  const f = Math.min(Math.max(frame, 0), frames - 1);
  return { text: formatClock(Math.ceil((frames - 1 - f) / fps)), progress: f / (frames - 1) };
}

/** 본 동작 프레임(0부터)의 카운터 표시값과 진행 비율 */
export function counterAt(t: Timing, frame: number, fps: number): CounterView {
  switch (t.kind) {
    case "reps": {
      const total = mainFrames(t);
      // 시작 자세로 돌아오는 프레임에서 1 증가한다
      const done = Math.min(t.reps, Math.floor((frame + 1) / repFrames(t)));
      return { text: `${done} / ${t.reps}`, progress: Math.min(Math.max(frame, 0), total - 1) / (total - 1) };
    }
    case "hold":
      if (frame < t.setupFrames) return { text: "준비", progress: 0 };
      return countdown(frame - t.setupFrames, t.holdFrames, fps);
    case "timer":
      return countdown(frame, t.frames, fps);
  }
}

/** 반복 동작의 진행도. 0은 시작 자세, 1은 끝 자세다. 가기 → 멈춤 → 돌아오기 순서로 움직인다. */
export function repPhase(t: RepsTiming, frame: number): number {
  const f = frame % repFrames(t);
  const pause = t.pauseFrames ?? 0;
  if (f < t.goFrames) return ease(f / t.goFrames);
  if (f < t.goFrames + pause) return 1;
  return 1 - ease((f - t.goFrames - pause) / t.returnFrames);
}

/** 지금 몇 번째 반복인가(0부터). 좌우를 번갈아 하는 동작에 쓴다. */
export const repIndex = (t: RepsTiming, frame: number): number => Math.min(t.reps - 1, Math.floor(frame / repFrames(t)));
