import { lerp, poseFromAngles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { HEAD_REST_DEG, onGround } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 천천히 내리기(2초) → 올리기(1초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 누워서 편 다리를 수직에서 바닥 위 15°까지 내린다. 허리가 뜨지 않도록 엉덩이와 어깨는 바닥에 둔다.
const HIP = onGround(290);
const UP = 90;
const LOW = 165;

export const legRaise: ExerciseVideoDef = {
  id: "seed-leg-raise",
  timing,
  pose(frame) {
    const leg = lerp(UP, LOW, repPhase(timing, frame));
    return poseFromAngles(HIP, {
      torso: 0,
      head: HEAD_REST_DEG,
      // 팔은 몸 옆 바닥에
      nearUpperArm: 180,
      nearForearm: 180,
      farUpperArm: 180,
      farForearm: 180,
      // 발목을 당겨 발끝이 다리와 수직이 되게 한다
      nearThigh: leg,
      nearShin: leg,
      nearFoot: leg - 90,
      farThigh: leg + 2,
      farShin: leg + 2,
      farFoot: leg - 88,
    });
  },
};

/** 테스트용 */
export const LEG_RAISE_HIP = HIP;
