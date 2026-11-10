import { armIK, lerp, type Angles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { onGround, place, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 발끝과 손을 바닥에 두고 엉덩이를 높이 든 ㅅ자 자세.
// 다리는 편 채 발목을 축으로 기울고(엉덩이가 앞으로 내려옴), 몸통은 아래로 숙여 정수리가 손 앞 바닥 가까이 온다.
const TOE = onGround(100);
const FOOT_DEG = 245;
const HANDS = onGround(305);
// 다리 각도: 발목→엉덩이 방향. 몸통 각도: 엉덩이→어깨 방향
const TOP = { legs: 66, torso: -35 };
const BOTTOM = { legs: 48, torso: -50 };
const ELBOW_BACK = pt(-1, -0.3);

function body(legs: number, torso: number): Angles {
  return {
    torso,
    head: torso - 5,
    nearUpperArm: -90,
    nearForearm: -90,
    farUpperArm: -90,
    farForearm: -90,
    nearThigh: legs + 180,
    nearShin: legs + 180,
    nearFoot: FOOT_DEG,
    farThigh: legs + 180,
    farShin: legs + 180,
    farFoot: FOOT_DEG,
  };
}

export const pikePushUp: ExerciseVideoDef = {
  id: "seed-pike-push-up",
  timing,
  pose(frame) {
    const t = repPhase(timing, frame);
    const p = place(body(lerp(TOP.legs, BOTTOM.legs, t), lerp(TOP.torso, BOTTOM.torso, t)), (q) => q.near.toe, TOE);
    return armIK(armIK(p, "far", HANDS, ELBOW_BACK), "near", HANDS, ELBOW_BACK);
  },
};

/** 테스트용 */
export const PIKE = { TOE, HANDS };
