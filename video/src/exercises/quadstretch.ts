import { add, armIK, clamp, ease, lerp } from "../figure/geometry";
import { HOLD_30S, holdState, onGround, place, pt, STAND } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 먼 쪽 다리로 서서, 가까운 쪽 무릎을 아래로 향하게 굽히고 같은 쪽 손으로 발목을 잡아 엉덩이 쪽으로 당긴다
const SUPPORT_ANKLE = onGround(240);
const ELBOW_DOWN_BACK = pt(-0.3, 1);

export const quadStretch: ExerciseVideoDef = {
  id: "seed-quad-stretch",
  timing,
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    const p = place(
      {
        ...STAND,
        torso: 88 + breath,
        // 먼 쪽 팔은 앞으로 뻗어 균형을 잡는다
        farUpperArm: lerp(-95, 5, t),
        farForearm: lerp(-90, 5, t),
        // 정강이는 뒤로 접어 올린다(-94° → -265°, 뒤쪽으로 돈다)
        nearThigh: lerp(-86, -92, t),
        nearShin: lerp(-94, -265, t),
        // 발목이 바닥에서 뜬 뒤(진행 20% 이후)에 발을 돌린다. 먼저 돌리면 발끝이 바닥을 뚫는다.
        nearFoot: -185 * ease(clamp((t - 0.2) / 0.8, 0, 1)),
        farThigh: -88,
        farShin: -92,
      },
      (q) => q.far.ankle,
      SUPPORT_ANKLE,
    );
    return armIK(p, "near", add(p.near.ankle, pt(-4, 0)), ELBOW_DOWN_BACK);
  },
};

/** 테스트용 */
export const QUAD_SUPPORT_ANKLE = SUPPORT_ANKLE;
