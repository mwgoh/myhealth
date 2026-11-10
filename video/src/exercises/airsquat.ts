import { legIK, lerpAngles, type Angles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { ARMS_DOWN, KNEE_FORWARD, onGround, place } from "./helpers";
import { SQUAT_BOTTOM, SQUAT_STAND } from "./squat";
import type { ExerciseVideoDef } from "./types";

const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 다리는 바벨 스쿼트와 같다. 의자에 앉듯 엉덩이를 뒤로 빼며 팔을 앞으로 뻗어 균형을 잡는다.
const STAND: Angles = { ...SQUAT_STAND, ...ARMS_DOWN };
const BOTTOM: Angles = { ...SQUAT_BOTTOM, head: 70, nearUpperArm: 0, nearForearm: 0, farUpperArm: 3, farForearm: 3 };

const ANKLE_X = 230;

export const airSquat: ExerciseVideoDef = {
  id: "seed-air-squat",
  timing,
  pose(frame) {
    const p = place(lerpAngles(STAND, BOTTOM, repPhase(timing, frame)), (q) => q.near.ankle, onGround(ANKLE_X));
    return legIK(p, "far", onGround(ANKLE_X - 8), KNEE_FORWARD, 0);
  },
};
