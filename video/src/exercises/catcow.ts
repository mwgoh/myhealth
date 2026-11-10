import { poseFromAngles } from "../figure/geometry";
import { allFours, HOLD_30S } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 네 발 자세에서 등을 휜다. 4초에 한 번: 숨을 마시며 등을 내리고 고개를 든다(소) →
// 내쉬며 등을 둥글게 말고 고개를 숙인다(고양이). 손·무릎·엉덩이·어깨는 움직이지 않는다.
const BASE = allFours(230);
const CYCLE = 120;
const COW = { bend: -14, head: 35 };
const CAT = { bend: 18, head: -60 };

export const catCow: ExerciseVideoDef = {
  id: "seed-cat-cow",
  timing,
  keyFrames: [0, timing.setupFrames + CYCLE / 4, timing.setupFrames + (3 * CYCLE) / 4],
  pose(frame) {
    if (frame < timing.setupFrames) return poseFromAngles(BASE.hip, BASE.angles);
    // 앞 반 주기는 소(v > 0), 뒤 반 주기는 고양이(v < 0)
    const v = Math.sin((2 * Math.PI * (frame - timing.setupFrames)) / CYCLE);
    const shape = v > 0 ? COW : CAT;
    const amount = Math.abs(v);
    const p = poseFromAngles(BASE.hip, { ...BASE.angles, head: BASE.angles.torso + shape.head * amount });
    return { ...p, spineBend: shape.bend * amount };
  },
};

/** 테스트용 */
export const CAT_COW = { KNEE: BASE.knee, HANDS: BASE.hands };
