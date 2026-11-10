import { add, armIK, dir, lerpVec, scale, type Angles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { ARMS_DOWN, pt, standOn } from "./helpers";
import { barbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 당기기(1초) → 내리기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 상체를 45° 숙이고 무릎을 살짝 굽혀 엉덩이를 뒤로 뺀다
const HINGE: Angles = {
  ...ARMS_DOWN,
  torso: 45,
  head: 60,
  nearThigh: -70,
  nearShin: -100,
  nearFoot: 0,
  farThigh: -70,
  farShin: -100,
  farFoot: 0,
};
const BASE = standOn(HINGE, 200);
// 바는 어깨 아래로 팔을 늘어뜨린 곳에서 배꼽(엉덩이에서 몸통을 따라 40px, 배 쪽으로 18px)까지 온다
const HANG = add(BASE.shoulder, pt(6, 128));
const NAVEL = add(add(BASE.hip, scale(dir(45), 40)), scale(dir(-45), 18));
const ELBOW_UP_BACK = pt(-1, -1);

const barAt = (frame: number) => lerpVec(HANG, NAVEL, repPhase(timing, frame));

export const barbellRow: ExerciseVideoDef = {
  id: "seed-barbell-row",
  timing,
  pose(frame) {
    const bar = barAt(frame);
    return armIK(armIK(BASE, "far", bar, ELBOW_UP_BACK), "near", bar, ELBOW_UP_BACK);
  },
  props: (frame) => barbell(barAt(frame)),
};
