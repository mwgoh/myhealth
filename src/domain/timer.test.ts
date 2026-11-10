import { describe, expect, it } from "vitest";
import { SEED_EXERCISES } from "./seed";
import {
  buildSegments,
  checkTimerPlan,
  formatClock,
  cuesBetween,
  newTimerPlan,
  positionAt,
  TIMER_PRESETS,
  timerCues,
  timerSummary,
  totalSec,
  type TimerPlan,
} from "./timer";

const BASIC = newTimerPlan("t1");
const CIRCUIT: TimerPlan = { ...BASIC, workSec: 40, restSec: 20, rounds: 3, roundRestSec: 60, exerciseIds: ["a", "b", "c", "d"] };
const NAMES: Record<string, string> = { a: "스쿼트", b: "푸시업", c: "플랭크", d: "버피" };
const nameOf = (id: string) => NAMES[id] ?? id;
const preset = (id: string) => TIMER_PRESETS.find((p) => p.id === id)!;

describe("buildSegments", () => {
  it("기본 인터벌: 준비 → (운동 → 휴식) × 세트, 마지막 운동 뒤에는 휴식이 없다", () => {
    const s = buildSegments(BASIC);
    expect(s.map((x) => [x.kind, x.sec])).toEqual([
      ["prep", 10],
      ["work", 30],
      ["rest", 10],
      ["work", 30],
      ["rest", 10],
      ["work", 30],
    ]);
    expect(totalSec(s)).toBe(120);
    expect(s.map((x) => x.startSec)).toEqual([0, 10, 40, 50, 80, 90]);
  });

  it("서킷: 라운드 안 종목 사이는 휴식, 라운드 사이는 라운드 휴식, 총 790초", () => {
    const s = buildSegments(CIRCUIT);
    expect(totalSec(s)).toBe(790);
    expect(s.filter((x) => x.kind === "roundRest")).toHaveLength(2);
    expect(s.filter((x) => x.kind === "work").map((x) => x.exerciseId)).toEqual(["a", "b", "c", "d", "a", "b", "c", "d", "a", "b", "c", "d"]);
    const firstRest = s.find((x) => x.kind === "rest")!;
    expect(firstRest).toMatchObject({ round: 1, nextExerciseId: "b" });
    expect(s.find((x) => x.kind === "roundRest")).toMatchObject({ round: 1, nextExerciseId: "a" });
    expect(s.at(-1)).toMatchObject({ kind: "work", round: 3, index: 3, exerciseId: "d" });
  });

  it("0초 구간(준비 0, 휴식 0)은 만들지 않는다", () => {
    const s = buildSegments({ ...BASIC, prepSec: 0, restSec: 0 });
    expect(s.map((x) => x.kind)).toEqual(["work", "work", "work"]);
  });
});

describe("positionAt", () => {
  const s = buildSegments(BASIC);
  it("남은 초는 올림이고 구간 경계에서 다음 구간으로 넘어간다", () => {
    expect(positionAt(s, 0)).toEqual({ segmentIndex: 0, remainingSec: 10, done: false });
    expect(positionAt(s, 9999)).toEqual({ segmentIndex: 0, remainingSec: 1, done: false });
    expect(positionAt(s, 10000)).toEqual({ segmentIndex: 1, remainingSec: 30, done: false });
  });
  it("총 시간 이상이면 끝", () => {
    expect(positionAt(s, 120000)).toEqual({ segmentIndex: 5, remainingSec: 0, done: true });
  });
});

describe("안내(cuesBetween)", () => {
  const basic = buildSegments(BASIC);
  const circuit = buildSegments(CIRCUIT);
  const at = (segs: ReturnType<typeof buildSegments>, ms: number) => cuesBetween(segs, nameOf, ms - 1, ms);

  it("준비 시작과 운동 시작", () => {
    expect(at(basic, 0)).toEqual([{ atMs: 0, speech: "준비하세요" }]);
    expect(at(basic, 10000)).toEqual([{ atMs: 10000, speech: "시작", beep: "long" }]);
    expect(at(circuit, 0)).toEqual([{ atMs: 0, speech: "준비하세요. 첫 운동은 스쿼트" }]);
    expect(at(circuit, 10000)).toEqual([{ atMs: 10000, speech: "스쿼트 시작", beep: "long" }]);
  });

  it("휴식, 라운드 휴식, 마지막 라운드·세트", () => {
    expect(at(circuit, 50000)).toEqual([{ atMs: 50000, speech: "휴식. 다음은 푸시업" }]);
    const roundRest = circuit.find((x) => x.kind === "roundRest")!;
    expect(at(circuit, roundRest.startSec * 1000)[0].speech).toBe("라운드 휴식. 다음은 2라운드");
    const lastFirst = circuit.find((x) => x.kind === "work" && x.round === 3 && x.index === 0)!;
    expect(at(circuit, lastFirst.startSec * 1000)[0].speech).toBe("마지막 라운드. 스쿼트 시작");
    expect(at(basic, 90000)[0].speech).toBe("마지막 세트. 시작");
    expect(at(basic, 40000)[0].speech).toBe("휴식");
  });

  it("운동 20초 이상일 때만 절반", () => {
    expect(at(basic, 25000)).toEqual([{ atMs: 25000, speech: "절반" }]);
    const short = buildSegments({ ...BASIC, workSec: 15 });
    expect(timerCues(short, nameOf).some((c) => c.speech === "절반")).toBe(false);
  });

  it("4초 이상 구간의 마지막 3초는 3·2·1과 짧은 삐, 그보다 짧은 구간은 없다", () => {
    expect(at(basic, 7000)).toEqual([{ atMs: 7000, speech: "3", beep: "short" }]);
    expect(at(basic, 9000)).toEqual([{ atMs: 9000, speech: "1", beep: "short" }]);
    const shortRest = buildSegments({ ...BASIC, restSec: 3 });
    const rest = shortRest.find((x) => x.kind === "rest")!;
    const restStart = rest.startSec * 1000;
    expect(timerCues(shortRest, nameOf).filter((c) => c.atMs > restStart && c.atMs < restStart + 3000)).toEqual([]);
  });

  it("끝", () => {
    expect(at(basic, 120000)).toEqual([{ atMs: 120000, speech: "운동 끝. 수고하셨습니다", beep: "long" }]);
  });

  it("250ms 간격으로 끝까지 훑으면 모든 안내가 정확히 한 번씩 나온다", () => {
    const seen = [];
    for (let ms = 0, prev = -1; prev < 790000; prev = ms, ms += 250) seen.push(...cuesBetween(circuit, nameOf, prev, ms));
    expect(seen).toEqual(timerCues(circuit, nameOf));
  });

  it("1.5초 넘게 지났으면(다른 앱에 갔다 옴) 그사이 안내는 버린다", () => {
    expect(cuesBetween(basic, nameOf, 8000, 10000)).toEqual([]);
    expect(cuesBetween(basic, nameOf, 8600, 10000)).toHaveLength(2);
  });
});

describe("checkTimerPlan", () => {
  it("범위를 벗어난 칸을 알려준다", () => {
    expect(checkTimerPlan(BASIC)).toEqual([]);
    expect(checkTimerPlan({ ...BASIC, workSec: 4 })).toEqual(["workSec"]);
    expect(checkTimerPlan({ ...BASIC, rounds: 0 })).toEqual(["rounds"]);
    expect(checkTimerPlan({ ...BASIC, name: "   " })).toEqual(["name"]);
    expect(checkTimerPlan({ ...BASIC, prepSec: 1.5 })).toEqual(["prepSec"]);
    expect(checkTimerPlan({ ...BASIC, exerciseIds: Array.from({ length: 21 }, (_, i) => `e${i}`) })).toEqual(["exerciseIds"]);
    expect(checkTimerPlan({ ...BASIC, exerciseIds: ["a", "a"] })).toEqual(["exerciseIds"]);
  });

  it("기본 프리셋 6개는 모두 유효하고 기본 종목을 가리킨다", () => {
    expect(TIMER_PRESETS.map((p) => p.id)).toEqual([
      "preset-basic",
      "preset-tabata",
      "preset-hiit-beginner",
      "preset-hiit-intermediate",
      "preset-full-body",
      "preset-core",
    ]);
    const seedIds = new Set(SEED_EXERCISES.map((e) => e.id));
    for (const p of TIMER_PRESETS) {
      expect(checkTimerPlan(p), p.id).toEqual([]);
      for (const id of p.exerciseIds) expect(seedIds.has(id), id).toBe(true);
    }
    expect(preset("preset-tabata")).toMatchObject({ prepSec: 10, workSec: 20, restSec: 10, rounds: 8 });
  });
});

describe("timerSummary", () => {
  it("기본 인터벌과 서킷", () => {
    expect(timerSummary(BASIC)).toBe("30초 운동 · 10초 휴식 · 3세트 · 약 2분");
    expect(timerSummary(preset("preset-full-body"))).toBe("40초 운동 · 20초 휴식 · 3라운드 · 4종목 · 약 13분");
  });
});

describe("formatClock", () => {
  it("m:ss", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(9)).toBe("0:09");
    expect(formatClock(790)).toBe("13:10");
  });
});
