import { add, armIK, lerpVec } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { pt, STAND, standOn } from "./helpers";
import { barbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 밀어 올리기(1초) → 내리기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

const BASE = standOn(STAND, 230);
// 바는 쇄골 앞(어깨 기준 앞 16, 위 10)에서 머리 위(팔을 편 길이)까지 거의 수직으로 오른다
const RACK = add(BASE.shoulder, pt(16, -10));
const LOCKOUT = add(BASE.shoulder, pt(4, -128));
const ELBOW = pt(0.6, 1);

const barAt = (frame: number) => lerpVec(RACK, LOCKOUT, repPhase(timing, frame));

export const overheadPress: ExerciseVideoDef = {
  id: "seed-overhead-press",
  timing,
  // 머리 위로 뻗은 팔과 바가 제목과 겹치지 않게 줄인다
  scale: 0.8,
  pose(frame) {
    const bar = barAt(frame);
    return armIK(armIK(BASE, "far", bar, ELBOW), "near", bar, ELBOW);
  },
  props: (frame) => barbell(barAt(frame)),
};
