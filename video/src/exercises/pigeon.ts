import { armIK, deg, lerp, lerpVec, poseFromAngles, SEG } from "../figure/geometry";
import { G, HOLD_30S, holdState, onGround, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 앞 정강이를 몸 앞에 가로로 접어 두고 뒷다리는 뒤로 뻗은 채, 상체를 앞 다리 위로 천천히 숙인다.
// 옆에서 보면 가로로 둔 앞 정강이가 엉덩이 아래로 접혀 보이고, 엉덩이는 그만큼(22px) 떠 있다.
const HIP_HEIGHT = 22;
const HIP = pt(230, G - HIP_HEIGHT);
// 두 무릎이 바닥에 닿는 넓적다리 기울기
const KNEE_DOWN = deg(Math.asin(HIP_HEIGHT / SEG.thigh));
// 팔: 처음엔 늘어뜨리고, 숙이면서 앞쪽 바닥을 짚는다
const HANG = pt(HIP.x + 10, G - 14);
const FLOOR = onGround(HIP.x + 205);
const ELBOW_DOWN = pt(0, 1);

export const pigeonPose: ExerciseVideoDef = {
  id: "seed-pigeon-pose",
  timing,
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    const p = poseFromAngles(HIP, {
      torso: lerp(90, 25, t) + breath,
      head: lerp(90, 15, t),
      nearUpperArm: -90,
      nearForearm: -90,
      farUpperArm: -90,
      farForearm: -90,
      nearThigh: -KNEE_DOWN,
      nearShin: 180,
      nearFoot: 180,
      farThigh: 180 + KNEE_DOWN,
      farShin: 180,
      farFoot: 180,
    });
    const hands = lerpVec(HANG, FLOOR, t);
    return armIK(armIK(p, "far", hands, ELBOW_DOWN), "near", hands, ELBOW_DOWN);
  },
};

/** 테스트용 */
export const PIGEON = { HIP, FLOOR };
