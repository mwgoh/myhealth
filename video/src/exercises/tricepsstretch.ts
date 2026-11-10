import { add, armIK, lerp, lerpVec } from "../figure/geometry";
import { HOLD_30S, holdState, pt, STAND, standOn } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 가까운 쪽 팔꿈치를 머리 옆으로 들어 아래팔을 머리 뒤로 접고(손은 등 위쪽),
// 먼 쪽 손을 머리 위로 넘겨 그 팔꿈치를 누른다
const ANKLE_X = 260;
const PRESS_ELBOW = pt(1, -1);
const REST_HAND = standOn(STAND, ANKLE_X).far.hand;

export const tricepsStretch: ExerciseVideoDef = {
  id: "seed-triceps-stretch",
  timing,
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    // 위팔은 앞으로 들어 올려 머리 옆까지(-92° → 105°), 아래팔은 계속 아래를 향해 머리 뒤로 접힌다
    const p = standOn({ ...STAND, torso: 88 + breath, nearUpperArm: lerp(-92, 105, t), nearForearm: lerp(-88, -95, t) }, ANKLE_X);
    const press = lerpVec(REST_HAND, add(p.near.elbow, pt(4, -6)), t);
    return armIK(p, "far", press, PRESS_ELBOW);
  },
};
