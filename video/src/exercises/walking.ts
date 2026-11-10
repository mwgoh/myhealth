import type { Timing } from "../scenes/counter";
import { gaitPose, groundTicks, type Gait } from "./gait";
import type { ExerciseVideoDef } from "./types";

const timing: Timing = { kind: "timer", frames: 900 };

// 빠른 걸음: 분당 약 106보, 두 발이 동시에 뜨지 않고 팔을 자연스럽게 흔든다
const WALK: Gait = {
  cycle: 34,
  thighSwing: 22,
  kneeBend: 45,
  kneeBase: 6,
  armSwing: 22,
  elbow: 20,
  torso: 88,
  bounce: 0,
  hipX: 270,
  speed: 4,
};

export const walking: ExerciseVideoDef = {
  id: "seed-walking",
  timing,
  keyFrames: [0, 9, 17],
  pose: (frame) => gaitPose(WALK, frame),
  props: (frame) => groundTicks(WALK, frame),
};
