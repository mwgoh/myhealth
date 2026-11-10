import { add, armIK, lerpVec } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { pt, STAND, standOn } from "./helpers";
import { dumbbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 밀어 올리기(1초) → 내리기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

const BASE = standOn(STAND, 230);
// 덤벨은 어깨 앞 위(턱 옆)에서 머리 위까지. 옆에서 본 그림이라 귀 옆까지 올리면
// 팔꿈치가 앞으로 뻗은 막대처럼 보여, 바벨 오버헤드프레스의 시작 자세와 같게 둔다.
const START = add(BASE.shoulder, pt(16, -10));
const TOP = add(BASE.shoulder, pt(2, -128));
const ELBOW = pt(0.6, 1);

const handAt = (frame: number) => lerpVec(START, TOP, repPhase(timing, frame));

export const dbShoulderPress: ExerciseVideoDef = {
  id: "seed-db-shoulder-press",
  timing,
  scale: 0.8,
  pose(frame) {
    const h = handAt(frame);
    return armIK(armIK(BASE, "far", h, ELBOW), "near", h, ELBOW);
  },
  props: (_frame, pose) => [...dumbbell(pose.far.hand), ...dumbbell(pose.near.hand, true)],
};
