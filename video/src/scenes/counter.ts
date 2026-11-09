import { ease } from "../figure/geometry";

export type Timing =
  | { kind: "reps"; reps: number; downFrames: number; upFrames: number }
  | { kind: "hold"; setupFrames: number; holdFrames: number }
  | { kind: "timer"; frames: number };

export type RepsTiming = Extract<Timing, { kind: "reps" }>;

export type CounterView = { text: string; progress: number };

/** 제목·완료 구간 길이(프레임) */
export const TITLE_FRAMES = 60;
export const DONE_FRAMES = 60;

export function mainFrames(t: Timing): number {
  switch (t.kind) {
    case "reps":
      return t.reps * (t.downFrames + t.upFrames);
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
      // 올리기를 마치는 프레임에서 1 증가한다
      const done = Math.min(t.reps, Math.floor((frame + 1) / (t.downFrames + t.upFrames)));
      return { text: `${done} / ${t.reps}`, progress: Math.min(Math.max(frame, 0), total - 1) / (total - 1) };
    }
    case "hold":
      if (frame < t.setupFrames) return { text: "준비", progress: 0 };
      return countdown(frame - t.setupFrames, t.holdFrames, fps);
    case "timer":
      return countdown(frame, t.frames, fps);
  }
}

/** 반복 동작의 깊이. 0은 시작 자세, 1은 가장 낮은 지점이다. 내리기 → 올리기 순서로 움직인다. */
export function repPhase(t: RepsTiming, frame: number): number {
  const f = frame % (t.downFrames + t.upFrames);
  return f < t.downFrames ? ease(f / t.downFrames) : 1 - ease((f - t.downFrames) / t.upFrames);
}
