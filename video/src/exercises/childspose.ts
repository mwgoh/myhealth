import { armIK, dir, lerp, lerpVec, poseFromAngles, scale, SEG, sub } from "../figure/geometry";
import { G, HOLD_30S, holdState, onGround, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 무릎을 꿇고 선 자세에서 엉덩이를 뒤꿈치 쪽으로 내리며 상체를 숙이고, 팔을 앞 바닥으로 뻗는다.
// 두 무릎과 정강이·발등은 바닥에 고정한다. 넓적다리(엉덩이→무릎)가 -90°(수직)에서 -16°로 눕는다.
const KNEE = onGround(250);
const HANG = pt(KNEE.x + 5, G - 84);
const FLOOR = onGround(KNEE.x + 150);
const ELBOW_UP = pt(0, -1);

export const childsPose: ExerciseVideoDef = {
  id: "seed-childs-pose",
  timing,
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    const thigh = lerp(-90, -16, t);
    const p = poseFromAngles(sub(KNEE, scale(dir(thigh), SEG.thigh)), {
      torso: lerp(90, 8, t) + breath,
      head: lerp(90, -10, t),
      nearUpperArm: -90,
      nearForearm: -90,
      farUpperArm: -90,
      farForearm: -90,
      nearThigh: thigh,
      nearShin: 180,
      nearFoot: 180,
      farThigh: thigh,
      farShin: 180,
      farFoot: 180,
    });
    const hands = lerpVec(HANG, FLOOR, t);
    return armIK(armIK(p, "far", hands, ELBOW_UP), "near", hands, ELBOW_UP);
  },
};

/** 테스트용 */
export const CHILDS_POSE = { KNEE, FLOOR };
