import { add, anchorAt, armIK, legIK, lerpAngles, poseFromAngles, type Angles, type Pose, type Vec } from "../figure/geometry";
import { GROUND_Y } from "../layout";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { barbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 기준점: 가까운 쪽 발목. 먼 쪽 발목은 8px 뒤에 IK로 붙인다.
const ANKLE: Vec = { x: 250, y: GROUND_Y };
const FAR_ANKLE: Vec = { x: 242, y: GROUND_Y };

const KNEE_FORWARD: Vec = { x: 1, y: -0.2 };
const ELBOW_DOWN: Vec = { x: 0, y: 1 };

// 팔 각도는 IK로 다시 계산하므로 아무 값이나 둔다
const ARMS = { nearUpperArm: -90, nearForearm: -90, farUpperArm: -90, farForearm: -90 };

// 무릎을 살짝 굽힌 선 자세. 먼 쪽 발목까지 닿으려면 다리가 완전히 펴지면 안 된다.
// 맨몸 스쿼트도 같은 다리 자세를 쓴다.
export const SQUAT_STAND: Angles = {
  ...ARMS,
  torso: 88,
  head: 88,
  nearThigh: -84,
  nearShin: -96,
  nearFoot: 0,
  farThigh: -84,
  farShin: -96,
  farFoot: 0,
};

// 넓적다리가 바닥과 평행, 몸통은 약 45° 숙임, 시선은 앞
export const SQUAT_BOTTOM: Angles = {
  ...ARMS,
  torso: 45,
  head: 65,
  nearThigh: 0,
  nearShin: -115,
  nearFoot: 0,
  farThigh: 0,
  farShin: -115,
  farFoot: 0,
};

/**
 * 바벨은 어깨 뒤 등 위에 얹는다. 어깨와 거의 같은 높이에 두어야 손을 바에 댄 팔이
 * 팔꿈치를 아래로 접는다(바가 어깨 바로 위면 팔이 뒤로 뻗은 막대처럼 보인다).
 */
function barCenter(p: Pose): Vec {
  return add(p.shoulder, { x: -16, y: -6 });
}

export const squat: ExerciseVideoDef = {
  id: "seed-squat",
  timing,
  pose(frame) {
    const a = lerpAngles(SQUAT_STAND, SQUAT_BOTTOM, repPhase(timing, frame));
    let p = anchorAt(poseFromAngles({ x: 0, y: 0 }, a), (q) => q.near.ankle, ANKLE);
    p = legIK(p, "far", FAR_ANKLE, KNEE_FORWARD, 0);
    const bar = barCenter(p);
    p = armIK(p, "near", bar, ELBOW_DOWN);
    return armIK(p, "far", bar, ELBOW_DOWN);
  },
  props: (_frame, pose) => barbell(barCenter(pose)),
};
