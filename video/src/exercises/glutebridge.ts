import { legIK, lerp } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { HEAD_REST_DEG, onGround, place, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 들어 올리기(1초) → 맨 위에서 조이기(1초) → 내리기(1초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, pauseFrames: 30, returnFrames: 30 };

// 등을 대고 누워 무릎을 세운다. 어깨와 발은 바닥에 고정하고 엉덩이만 든다.
const SHOULDER = onGround(360);
const NEAR_ANKLE = onGround(130);
const FAR_ANKLE = onGround(124);
const KNEE_UP = pt(0.2, -1);
// 맨 위: 어깨→엉덩이 몸통이 25° 기울어 어깨·엉덩이·무릎이 거의 일직선
const UP_DEG = -25;

export const gluteBridge: ExerciseVideoDef = {
  id: "seed-glute-bridge",
  timing,
  pose(frame) {
    const torso = lerp(0, UP_DEG, repPhase(timing, frame));
    // 팔은 몸 옆 바닥에 둔다
    let p = place(
      {
        torso,
        head: HEAD_REST_DEG,
        nearUpperArm: 180,
        nearForearm: 180,
        farUpperArm: 180,
        farForearm: 180,
        nearThigh: 150,
        nearShin: -120,
        nearFoot: 180,
        farThigh: 150,
        farShin: -120,
        farFoot: 180,
      },
      (q) => q.shoulder,
      SHOULDER,
    );
    p = legIK(p, "far", FAR_ANKLE, KNEE_UP, 180);
    return legIK(p, "near", NEAR_ANKLE, KNEE_UP, 180);
  },
};

/** 테스트용 */
export const GLUTE_BRIDGE = { SHOULDER, NEAR_ANKLE };
