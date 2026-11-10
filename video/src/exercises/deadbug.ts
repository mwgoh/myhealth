import { lerpAngles, poseFromAngles, swapSides, type Angles } from "../figure/geometry";
import { repIndex, repPhase, type RepsTiming } from "../scenes/counter";
import { HEAD_REST_DEG, onGround } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 뻗기(1.5초) → 돌아오기(1.5초). 좌우를 번갈아 10회(좌우 합계).
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 45, returnFrames: 45 };

// 허리를 바닥에 붙인 채 팔은 천장으로, 무릎은 90°로 든 자세(테이블탑)에서 반대쪽 팔과 다리를 뻗는다
const HIP = onGround(240);

const TABLETOP: Angles = {
  torso: 0,
  head: HEAD_REST_DEG,
  nearUpperArm: 90,
  nearForearm: 90,
  farUpperArm: 92,
  farForearm: 92,
  nearThigh: 90,
  nearShin: 180,
  nearFoot: 90,
  farThigh: 92,
  farShin: 182,
  farFoot: 92,
};

// 가까운 쪽 팔은 머리 위로, 먼 쪽 다리는 바닥 위로 뻗는다(바닥에 닿지 않게)
const REACH: Angles = {
  ...TABLETOP,
  nearUpperArm: 12,
  nearForearm: 12,
  farThigh: 170,
  farShin: 170,
  farFoot: 80,
};

export const deadBug: ExerciseVideoDef = {
  id: "seed-dead-bug",
  timing,
  keyFrames: [0, 45, 135],
  pose(frame) {
    const p = poseFromAngles(HIP, lerpAngles(TABLETOP, REACH, repPhase(timing, frame)));
    return repIndex(timing, frame) % 2 === 1 ? swapSides(p) : p;
  },
};

/** 테스트용 */
export const DEAD_BUG_HIP = HIP;
