import { anchorAt, armIK, deg, lerp, poseFromAngles, rad, SEG, type Angles, type Vec } from "../figure/geometry";
import { GROUND_Y } from "../layout";
import { repPhase, type RepsTiming } from "../scenes/counter";
import type { ExerciseVideoDef } from "./types";

const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 기준점: 가까운 쪽 발끝. 발은 발목에서 아래(약간 뒤)로 세운다.
const TOE: Vec = { x: 100, y: GROUND_Y };
const FOOT_DEG = 250;
const ANKLE_HEIGHT = SEG.foot * Math.sin(rad(FOOT_DEG - 180));
const BODY = SEG.shin + SEG.thigh + SEG.torso;

/** 어깨가 바닥에서 h(px) 높이에 오는 몸 기울기(도) */
const bodyAngleFor = (h: number) => deg(Math.asin((h - ANKLE_HEIGHT) / BODY));
const TOP = bodyAngleFor(120);
const BOTTOM = bodyAngleFor(48);

// 손은 맨 위 자세의 어깨보다 조금 뒤(가슴 아래) 바닥에 고정한다.
// 그래야 가장 낮은 지점에서 아래팔이 서고 팔꿈치가 몸통 위로 올라온다.
const SHOULDER_X_TOP = TOE.x - SEG.foot * Math.cos(rad(FOOT_DEG)) + BODY * Math.cos(rad(TOP));
const NEAR_HAND: Vec = { x: SHOULDER_X_TOP - 35, y: GROUND_Y };
const FAR_HAND: Vec = { x: SHOULDER_X_TOP - 41, y: GROUND_Y };
const ELBOW_BACK: Vec = { x: -1, y: -0.6 };

/** 머리부터 발끝까지 일직선인 몸. theta는 발목→머리 방향 각도 */
function straightBody(theta: number): Angles {
  return {
    torso: theta,
    head: theta,
    nearUpperArm: -90,
    nearForearm: -90,
    farUpperArm: -90,
    farForearm: -90,
    nearThigh: theta + 180,
    nearShin: theta + 180,
    nearFoot: FOOT_DEG,
    farThigh: theta + 180,
    farShin: theta + 180,
    farFoot: FOOT_DEG,
  };
}

export const pushup: ExerciseVideoDef = {
  id: "seed-push-up",
  timing,
  pose(frame) {
    const theta = lerp(TOP, BOTTOM, repPhase(timing, frame));
    let p = anchorAt(poseFromAngles({ x: 0, y: 0 }, straightBody(theta)), (q) => q.near.toe, TOE);
    p = armIK(p, "far", FAR_HAND, ELBOW_BACK);
    return armIK(p, "near", NEAR_HAND, ELBOW_BACK);
  },
};
