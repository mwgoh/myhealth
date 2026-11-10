import { describe, expect, it } from "vitest";
import { counterAt, formatClock, mainFrames, repIndex, repPhase, type RepsTiming, type Timing } from "./counter";

const FPS = 30;
const REPS: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };
const PAUSED: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, pauseFrames: 30, returnFrames: 30 };
const HOLD: Timing = { kind: "hold", setupFrames: 60, holdFrames: 900 };
const TIMER: Timing = { kind: "timer", frames: 900 };

describe("mainFrames", () => {
  it("종목별 본 동작 길이", () => {
    expect(mainFrames(REPS)).toBe(900);
    expect(mainFrames(HOLD)).toBe(960);
    expect(mainFrames(TIMER)).toBe(900);
  });
});

describe("반복 종목", () => {
  it("첫 프레임은 0 / 10", () => {
    expect(counterAt(REPS, 0, FPS).text).toBe("0 / 10");
  });
  it("첫 반복을 마친 프레임에서 1 / 10", () => {
    expect(counterAt(REPS, 88, FPS).text).toBe("0 / 10");
    expect(counterAt(REPS, 89, FPS).text).toBe("1 / 10");
  });
  it("마지막 프레임은 10 / 10", () => {
    expect(counterAt(REPS, 899, FPS).text).toBe("10 / 10");
  });
  it("진행 비율은 0에서 1까지", () => {
    expect(counterAt(REPS, 0, FPS).progress).toBe(0);
    expect(counterAt(REPS, 899, FPS).progress).toBe(1);
  });
  it("repPhase: 시작은 0, 가기 끝은 1, 돌아오기 끝은 0", () => {
    expect(repPhase(REPS, 0)).toBe(0);
    expect(repPhase(REPS, 60)).toBe(1);
    expect(repPhase(REPS, 89)).toBeLessThan(0.01);
    expect(repPhase(REPS, 90)).toBe(0);
  });
  it("repPhase: 멈춤 구간 동안 1을 유지한다", () => {
    expect(mainFrames(PAUSED)).toBe(900);
    expect(repPhase(PAUSED, 30)).toBe(1);
    expect(repPhase(PAUSED, 59)).toBe(1);
    expect(repPhase(PAUSED, 60)).toBe(1);
    expect(repPhase(PAUSED, 89)).toBeLessThan(0.01);
    expect(counterAt(PAUSED, 89, FPS).text).toBe("1 / 10");
  });
  it("repIndex: 몇 번째 반복인지 0부터 센다", () => {
    expect(repIndex(REPS, 0)).toBe(0);
    expect(repIndex(REPS, 89)).toBe(0);
    expect(repIndex(REPS, 90)).toBe(1);
    expect(repIndex(REPS, 899)).toBe(9);
  });
});

describe("시간 종목", () => {
  it("자세 잡기 중에는 준비", () => {
    expect(counterAt(HOLD, 0, FPS).text).toBe("준비");
    expect(counterAt(HOLD, 59, FPS).text).toBe("준비");
    expect(counterAt(HOLD, 59, FPS).progress).toBe(0);
  });
  it("버티기 시작은 0:30, 끝은 0:00", () => {
    expect(counterAt(HOLD, 60, FPS).text).toBe("0:30");
    expect(counterAt(HOLD, 959, FPS).text).toBe("0:00");
    expect(counterAt(TIMER, 0, FPS).text).toBe("0:30");
    expect(counterAt(TIMER, 899, FPS).text).toBe("0:00");
  });
  it("진행 비율은 버티기 구간에서 0에서 1까지", () => {
    expect(counterAt(HOLD, 60, FPS).progress).toBe(0);
    expect(counterAt(HOLD, 959, FPS).progress).toBe(1);
    expect(counterAt(TIMER, 450, FPS).progress).toBeCloseTo(450 / 899, 6);
  });
  it("formatClock", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(75)).toBe("1:15");
  });
});
