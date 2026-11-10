import { armIK, legIK, lerp } from "../figure/geometry";
import { G, HOLD_30S, holdState, KNEE_FORWARD, onGround, place, pt } from "./helpers";
import { block } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 벽을 밀며 몸을 앞으로 기울인다. 뒤쪽(가까운 쪽) 다리는 편 채 발뒤꿈치를 바닥에 붙이고,
// 발목에서 머리까지 일직선으로 기운다. 앞쪽(먼 쪽) 무릎은 굽힌다.
const BACK_ANKLE = onGround(120);
const FRONT_ANKLE = onGround(190);
const WALL_X = 349;
const HANDS = pt(WALL_X - 7, G - 265);
const ELBOW_DOWN = pt(0, 1);

export const calfStretch: ExerciseVideoDef = {
  id: "seed-calf-stretch",
  timing,
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    const lean = lerp(78, 64, t);
    let p = place(
      {
        torso: lean + breath,
        head: lean + 5,
        nearUpperArm: 0,
        nearForearm: 0,
        farUpperArm: 0,
        farForearm: 0,
        nearThigh: lean + 180,
        nearShin: lean + 180,
        nearFoot: 0,
        farThigh: lean + 180,
        farShin: lean + 180,
        farFoot: 0,
      },
      (q) => q.near.ankle,
      BACK_ANKLE,
    );
    p = legIK(p, "far", FRONT_ANKLE, KNEE_FORWARD, 0);
    // 자세를 잡는 동안 손이 벽에 닿지 않으면 벽 쪽으로 뻗는다
    return armIK(armIK(p, "far", HANDS, ELBOW_DOWN), "near", HANDS, ELBOW_DOWN);
  },
  props: () => [block(WALL_X, 140, 50, G + 7 - 140)],
};

/** 테스트용 */
export const CALF = { BACK_ANKLE, FRONT_ANKLE, HANDS };
