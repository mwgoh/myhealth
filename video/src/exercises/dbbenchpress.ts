import { add, armIK, lerpVec } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { benchShapes, lyingOnBench } from "./benchpress";
import { pt } from "./helpers";
import { dumbbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 내리기(2초) → 밀기(1초). 바벨 벤치프레스와 같은 벤치·누운 자세를 쓴다.
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

const BASE = lyingOnBench();
// 덤벨은 가슴 위(팔을 편)에서 가슴 옆까지 내린다
const TOP = add(BASE.shoulder, pt(-6, -124));
const BOTTOM = add(BASE.shoulder, pt(-8, -12));
const ELBOW_DOWN = pt(0, 1);

const handAt = (frame: number) => lerpVec(TOP, BOTTOM, repPhase(timing, frame));

export const dbBenchPress: ExerciseVideoDef = {
  id: "seed-db-bench-press",
  timing,
  pose(frame) {
    const h = handAt(frame);
    return armIK(armIK(BASE, "far", h, ELBOW_DOWN), "near", h, ELBOW_DOWN);
  },
  props: (_frame, pose) => [...benchShapes(), ...dumbbell(pose.far.hand), ...dumbbell(pose.near.hand, true)],
};
