import { add, armIK, lerpVec } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { pt, STAND, standOn } from "./helpers";
import { kettlebell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 밀어 올리기(1초) → 내리기(2초). 한쪽(가까운 쪽 팔)만 보여준다.
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

const BASE = standOn(STAND, 230);
// 벨을 어깨에 얹은 자세(랙)에서 머리 위로 곧게 민다
const RACK = add(BASE.shoulder, pt(14, -6));
const LOCKOUT = add(BASE.shoulder, pt(2, -128));
const ELBOW = pt(0.6, 1);

const handAt = (frame: number) => lerpVec(RACK, LOCKOUT, repPhase(timing, frame));

export const kbPress: ExerciseVideoDef = {
  id: "seed-kb-press",
  timing,
  // 머리 위로 뻗은 팔이 제목과 겹치지 않게 줄인다
  scale: 0.8,
  pose: (frame) => armIK(BASE, "near", handAt(frame), ELBOW),
  // 벨 몸통은 손목 뒤(팔뚝 바깥)에 얹힌다
  props: (frame) => kettlebell(handAt(frame), 180),
};
