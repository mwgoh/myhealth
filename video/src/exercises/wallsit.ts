import { add, armIK, legIK, lerpVec, poseFromAngles } from "../figure/geometry";
import { G, HOLD_30S, holdState, onGround, pt } from "./helpers";
import { block } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 벽에 등을 붙이고 미끄러져 내려가 무릎 90°로 버틴다
const WALL_X = 150;
// 몸통 선 두께(18px)의 절반만큼 벽에서 떨어진 곳이 등의 중심선이다
const BACK_X = WALL_X + 9;
const HIP_START = pt(BACK_X, G - 150);
// 넓적다리 수평, 정강이 수직: 엉덩이 높이 = 정강이 길이(90px), 발목은 엉덩이 앞 92px
const HIP_HOLD = pt(BACK_X, G - 90);
const NEAR_ANKLE = onGround(BACK_X + 92);
const FAR_ANKLE = onGround(BACK_X + 86);
const KNEE_UP_FORWARD = pt(1, -1);
const ELBOW_DOWN_BACK = pt(-0.4, 1);

export const wallSit: ExerciseVideoDef = {
  id: "seed-wall-sit",
  timing,
  pose(frame) {
    const { t } = holdState(timing, frame);
    let p = poseFromAngles(lerpVec(HIP_START, HIP_HOLD, t), {
      torso: 90,
      head: 90,
      nearUpperArm: -90,
      nearForearm: -90,
      farUpperArm: -90,
      farForearm: -90,
      nearThigh: 0,
      nearShin: -90,
      nearFoot: 0,
      farThigh: 0,
      farShin: -90,
      farFoot: 0,
    });
    p = legIK(p, "far", FAR_ANKLE, KNEE_UP_FORWARD, 0);
    p = legIK(p, "near", NEAR_ANKLE, KNEE_UP_FORWARD, 0);
    // 두 손은 넓적다리 위에 얹는다
    const onThigh = add(lerpVec(p.hip, p.near.knee, 0.7), pt(0, -12));
    return armIK(armIK(p, "far", onThigh, ELBOW_DOWN_BACK), "near", onThigh, ELBOW_DOWN_BACK);
  },
  props: () => [block(WALL_X - 40, 150, 40, G + 7 - 150)],
};

/** 테스트용 */
export const WALL_SIT = { BACK_X, NEAR_ANKLE };
