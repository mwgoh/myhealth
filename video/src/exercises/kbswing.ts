import { angleOf, legIK, lerp, lerpVec, poseFromAngles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, KNEE_FORWARD, onGround, pt } from "./helpers";
import { kettlebell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 올려 띄우기(1초) → 내려 다리 사이로(1초). 15회.
const timing: RepsTiming = { kind: "reps", reps: 15, goFrames: 30, returnFrames: 30 };

const NEAR_ANKLE = onGround(220);
const FAR_ANKLE = onGround(214);
// 다리 사이로 벨을 넣은 자세: 엉덩이를 뒤로 접고(몸통 38°), 편 팔은 다리 사이 뒤쪽(-112°)
const HIKE = { hip: pt(NEAR_ANKLE.x - 58, G - 140), torso: 38, head: 55, arm: -112 };
// 엉덩이를 밀어 선 자세: 편 팔이 가슴 높이 앞(-6°)
const TOP = { hip: pt(NEAR_ANKLE.x + 1, G - 181.4), torso: 88, head: 88, arm: -6 };

export const kbSwing: ExerciseVideoDef = {
  id: "seed-kb-swing",
  timing,
  pose(frame) {
    const t = repPhase(timing, frame);
    const arm = lerp(HIKE.arm, TOP.arm, t);
    let p = poseFromAngles(lerpVec(HIKE.hip, TOP.hip, t), {
      torso: lerp(HIKE.torso, TOP.torso, t),
      head: lerp(HIKE.head, TOP.head, t),
      // 팔은 편 채로 벨과 함께 흔든다
      nearUpperArm: arm,
      nearForearm: arm,
      farUpperArm: arm - 2,
      farForearm: arm - 2,
      nearThigh: -90,
      nearShin: -90,
      nearFoot: 0,
      farThigh: -90,
      farShin: -90,
      farFoot: 0,
    });
    p = legIK(p, "near", NEAR_ANKLE, KNEE_FORWARD, 0);
    return legIK(p, "far", FAR_ANKLE, KNEE_FORWARD, 0);
  },
  // 벨 몸통은 팔을 따라 뻗는다
  props: (_frame, pose) => kettlebell(pose.near.hand, angleOf(pose.shoulder, pose.near.hand), true),
};
