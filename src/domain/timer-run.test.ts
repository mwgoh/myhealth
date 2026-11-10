import { describe, expect, it } from "vitest";
import { buildSegments, newTimerPlan } from "./timer";
import { skipNext, skipPrev } from "./timer-run";

// 구간 시작(초): 준비 0, 운동 10, 휴식 40, 운동 50, 휴식 80, 운동 90, 끝 120
const SEGS = buildSegments(newTimerPlan("t"));
const at = (ms: number, running = true) => ({ elapsedMs: ms, running });

describe("skipNext", () => {
  it("지금 구간 끝(다음 구간 시작)으로 건너뛰고 실행 여부는 그대로", () => {
    expect(skipNext(SEGS, at(25000))).toEqual(at(40000));
    expect(skipNext(SEGS, at(25000, false))).toEqual(at(40000, false));
  });
  it("마지막 구간이면 끝으로", () => {
    expect(skipNext(SEGS, at(100000))).toEqual(at(120000));
  });
});

describe("skipPrev", () => {
  it("구간 시작 후 2초 안이면 앞 구간 시작으로", () => {
    expect(skipPrev(SEGS, at(41000))).toEqual(at(10000));
  });
  it("2초가 지났으면 지금 구간 시작으로", () => {
    expect(skipPrev(SEGS, at(45000))).toEqual(at(40000));
  });
  it("첫 구간이면 처음으로, 끝난 뒤면 마지막 구간 시작으로", () => {
    expect(skipPrev(SEGS, at(1000))).toEqual(at(0));
    expect(skipPrev(SEGS, at(120000))).toEqual(at(90000));
  });
});
