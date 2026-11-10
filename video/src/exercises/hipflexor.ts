import { add, armIK, dir, legIK, lerp, poseFromAngles, scale, SEG, sub } from "../figure/geometry";
import { HOLD_30S, holdState, KNEE_FORWARD, onGround, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 뒤쪽(먼 쪽) 무릎을 바닥에 대고 앞쪽(가까운 쪽) 발을 앞에 둔 런지 자세.
// 엉덩이를 조이며 골반을 앞으로 민다: 뒤 넓적다리가 수직(-90°)에서 -105°로 기울며 엉덩이가 앞으로 나간다.
const BACK_KNEE = onGround(200);
const FRONT_ANKLE = onGround(320);
const ELBOW_BACK = pt(-1, 0);

export const hipFlexorStretch: ExerciseVideoDef = {
  id: "seed-hip-flexor-stretch",
  timing,
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    const backThigh = lerp(-90, -105, t);
    const hip = sub(BACK_KNEE, scale(dir(backThigh), SEG.thigh));
    let p = poseFromAngles(hip, {
      torso: 92 + breath,
      head: 90,
      nearUpperArm: -90,
      nearForearm: -90,
      farUpperArm: -90,
      farForearm: -90,
      nearThigh: -60,
      nearShin: -90,
      nearFoot: 0,
      farThigh: backThigh,
      farShin: 180,
      farFoot: 180,
    });
    p = legIK(p, "near", FRONT_ANKLE, KNEE_FORWARD, 0);
    // 두 손은 허리에 얹는다
    const waist = add(p.hip, pt(6, -14));
    return armIK(armIK(p, "far", waist, ELBOW_BACK), "near", waist, ELBOW_BACK);
  },
};

/** 테스트용 */
export const HIP_FLEXOR = { BACK_KNEE, FRONT_ANKLE };
