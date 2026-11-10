import { lerpAngles, poseFromAngles, type Angles } from "../figure/geometry";
import { HEAD_REST_DEG, HOLD_30S, holdState, onGround } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 허리(엉덩이)를 바닥에 붙인 채 어깨와 다리를 들어 바나나 모양을 만든다
const HIP = onGround(260);

// 바닥에 반듯이 누워 팔을 머리 위로 뻗은 자세
const FLAT: Angles = {
  torso: 0,
  head: HEAD_REST_DEG,
  nearUpperArm: 0,
  nearForearm: 0,
  farUpperArm: 0,
  farForearm: 0,
  nearThigh: 180,
  nearShin: 180,
  nearFoot: 180,
  farThigh: 180,
  farShin: 180,
  farFoot: 180,
};

const HOLLOW: Angles = {
  torso: 18,
  head: 28,
  nearUpperArm: 25,
  nearForearm: 25,
  farUpperArm: 24,
  farForearm: 24,
  nearThigh: 160,
  nearShin: 160,
  nearFoot: 160,
  farThigh: 161,
  farShin: 161,
  farFoot: 161,
};

export const hollowHold: ExerciseVideoDef = {
  id: "seed-hollow-hold",
  timing,
  pose: (frame) => poseFromAngles(HIP, lerpAngles(FLAT, HOLLOW, holdState(timing, frame).t)),
};

/** 테스트용 */
export const HOLLOW_HIP = HIP;
