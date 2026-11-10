import { add, armIK, dir, legIK, lerp, poseFromAngles, scale } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { HEAD_REST_DEG, onGround, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 말아 올리기(1초) → 내리기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 무릎을 세우고 누워, 목이 아니라 복부 힘으로 견갑까지만 든다. 손은 가슴 위에 모은다.
const HIP = onGround(230);
const NEAR_ANKLE = onGround(120);
const FAR_ANKLE = onGround(114);
const CURL_DEG = 32;
const KNEE_UP = pt(0.2, -1);
const ELBOW_UP = pt(0, -1);

export const crunch: ExerciseVideoDef = {
  id: "seed-crunch",
  timing,
  pose(frame) {
    const t = repPhase(timing, frame);
    const torso = lerp(0, CURL_DEG, t);
    let p = poseFromAngles(HIP, {
      torso,
      head: lerp(HEAD_REST_DEG, 47, t),
      nearUpperArm: 0,
      nearForearm: 0,
      farUpperArm: 0,
      farForearm: 0,
      nearThigh: 60,
      nearShin: -60,
      nearFoot: 180,
      farThigh: 60,
      farShin: -60,
      farFoot: 180,
    });
    p = legIK(p, "far", FAR_ANKLE, KNEE_UP, 180);
    p = legIK(p, "near", NEAR_ANKLE, KNEE_UP, 180);
    const chest = add(add(HIP, scale(dir(torso), 80)), scale(dir(torso + 90), 16));
    return armIK(armIK(p, "far", chest, ELBOW_UP), "near", chest, ELBOW_UP);
  },
};

/** 테스트용 */
export const CRUNCH = { HIP, NEAR_ANKLE };
