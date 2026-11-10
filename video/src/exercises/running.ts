import type { Timing } from "../scenes/counter";
import { gaitPose, groundTicks, type Gait } from "./gait";
import type { ExerciseVideoDef } from "./types";

const timing: Timing = { kind: "timer", frames: 900 };

// 대화가 가능한 편한 달리기: 분당 약 160보, 상체를 조금 앞으로 기울이고 팔꿈치는 90° 가까이 굽힌다
const RUN: Gait = {
  cycle: 22,
  thighSwing: 32,
  kneeBend: 75,
  kneeBase: 15,
  armSwing: 38,
  elbow: 85,
  torso: 82,
  bounce: 8,
  hipX: 270,
  speed: 9,
};

export const running: ExerciseVideoDef = {
  id: "seed-running",
  timing,
  keyFrames: [0, 6, 11],
  pose: (frame) => gaitPose(RUN, frame),
  props: (frame) => groundTicks(RUN, frame),
};
