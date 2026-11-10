import { add, armIK, lerp, lerpVec, type Angles } from "../figure/geometry";
import { HOLD_30S, holdState, onGround, place, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 앞에서 본 그림. 가까운 쪽(화면 왼쪽) 팔을 가슴 앞으로 가로질러 뻗고,
// 먼 쪽 팔의 아래팔로 그 팔꿈치 근처를 걸어 몸 쪽으로 당긴다.
const ANKLE = onGround(240);
const HOOK_ELBOW = pt(1, 1);

// 앞에서 본 선 자세: 두 다리를 조금 벌리고 발끝은 바깥을 향한다
const FRONT_STAND: Angles = {
  torso: 90,
  head: 90,
  nearUpperArm: -96,
  nearForearm: -92,
  farUpperArm: -84,
  farForearm: -88,
  nearThigh: -96,
  nearShin: -90,
  nearFoot: 180,
  farThigh: -84,
  farShin: -90,
  farFoot: 0,
};
const REST_HAND = place(FRONT_STAND, (q) => q.near.ankle, ANKLE).far.hand;

export const shoulderStretch: ExerciseVideoDef = {
  id: "seed-shoulder-stretch",
  timing,
  view: "front",
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    const p = place(
      { ...FRONT_STAND, torso: 90 + breath, nearUpperArm: lerp(-96, 0, t), nearForearm: lerp(-92, 0, t) },
      (q) => q.near.ankle,
      ANKLE,
    );
    const hook = lerpVec(REST_HAND, add(p.near.elbow, pt(-6, 10)), t);
    return armIK(p, "far", hook, HOOK_ELBOW);
  },
};

/** 테스트용 */
export const SHOULDER_STRETCH_ANKLE = ANKLE;
