import { add, armIK, lerpVec, poseFromAngles, type Angles } from "../figure/geometry";
import { repIndex, repPhase, type RepsTiming } from "../scenes/counter";
import { onGround, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 한쪽으로 비틀기(1.5초) → 가운데로(1.5초). 좌우를 번갈아 10회(좌우 합계).
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 45, returnFrames: 45 };

// 엉덩이로 앉아 상체를 뒤로 기울이고 발을 든다. 모은 두 손을 가슴 앞에서 엉덩이 옆 바닥까지 옮긴다.
const HIP = onGround(280);
const SEATED: Angles = {
  torso: 125,
  head: 105,
  nearUpperArm: -60,
  nearForearm: 0,
  farUpperArm: -60,
  farForearm: 0,
  nearThigh: 40,
  nearShin: -15,
  nearFoot: -30,
  farThigh: 42,
  farShin: -13,
  farFoot: -28,
};
const CENTER = add(HIP, pt(25, -70));
const SIDE = add(HIP, pt(-5, -8));
const ELBOW_DOWN = pt(0.2, 1);

export const russianTwist: ExerciseVideoDef = {
  id: "seed-russian-twist",
  timing,
  keyFrames: [0, 45, 135],
  pose(frame) {
    const hands = lerpVec(CENTER, SIDE, repPhase(timing, frame));
    const p = poseFromAngles(HIP, SEATED);
    return armIK(armIK(p, "far", hands, ELBOW_DOWN), "near", hands, ELBOW_DOWN);
  },
  // 옆에서 보면 먼 쪽으로 비틀 때 두 팔이 몸 뒤로 넘어간다
  armsBehind: (frame) => repIndex(timing, frame) % 2 === 1 && repPhase(timing, frame) > 0.15,
};

/** 테스트용 */
export const RUSSIAN_TWIST_HIP = HIP;
