import { add, armIK, dir, legIK, lerp, lerpVec, poseFromAngles, scale, SEG, sub, swapSides } from "../figure/geometry";
import { repIndex, repPhase, type RepsTiming } from "../scenes/counter";
import { G, onGround, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 무릎 당기기(0.67초) → 뒤로 뻗기(0.83초). 좌우를 번갈아 20회(좌우 합계).
const timing: RepsTiming = { kind: "reps", reps: 20, goFrames: 20, returnFrames: 25 };

// 팔을 편 플랭크. 손은 어깨 바로 아래 바닥, 몸은 어깨에서 발목까지 일직선.
const HANDS = onGround(400);
const SHOULDER = pt(HANDS.x, G - (SEG.upperArm + SEG.forearm - 4));
const TORSO_DEG = 20;
const HIP = sub(SHOULDER, scale(dir(TORSO_DEG), SEG.torso));
// 받치는 다리: 몸과 같은 기울기로 뻗고 발끝을 세운다(다리 길이보다 4px 짧게 둬 무릎을 잠그지 않는다)
const FOOT_DEG = 245;
const BACK_ANKLE = add(HIP, scale(dir(180 + TORSO_DEG), 178));
// 당긴 다리: 발이 엉덩이 아래 앞쪽으로 오고 무릎은 가슴 쪽으로
const DRIVE_ANKLE = add(HIP, pt(30, 62));
const DRIVE_FOOT_DEG = 215;
const SWING_LIFT = 25;
// 무릎은 앞·위쪽으로 접는다. 아래로 접으면 다리를 옮기는 초반에 무릎이 바닥에 닿는다.
const KNEE_FORWARD = pt(1, -1);
const ARM_HINT = pt(-1, 0);

export const mountainClimber: ExerciseVideoDef = {
  id: "seed-mountain-climber",
  timing,
  keyFrames: [0, 20, 65],
  pose(frame) {
    const t = repPhase(timing, frame);
    // 발은 바닥에 끌리지 않게 살짝 들어 옮긴다
    const ankle = add(lerpVec(BACK_ANKLE, DRIVE_ANKLE, t), pt(0, -SWING_LIFT * Math.sin(Math.PI * t)));
    let p = poseFromAngles(HIP, {
      torso: TORSO_DEG,
      head: TORSO_DEG - 5,
      nearUpperArm: -90,
      nearForearm: -90,
      farUpperArm: -90,
      farForearm: -90,
      nearThigh: 180 + TORSO_DEG,
      nearShin: 180 + TORSO_DEG,
      nearFoot: FOOT_DEG,
      farThigh: 180 + TORSO_DEG,
      farShin: 180 + TORSO_DEG,
      farFoot: FOOT_DEG,
    });
    p = armIK(armIK(p, "far", HANDS, ARM_HINT), "near", HANDS, ARM_HINT);
    p = legIK(p, "far", BACK_ANKLE, KNEE_FORWARD, FOOT_DEG);
    p = legIK(p, "near", ankle, KNEE_FORWARD, lerp(FOOT_DEG, DRIVE_FOOT_DEG, t));
    return repIndex(timing, frame) % 2 === 1 ? swapSides(p) : p;
  },
};

/** 테스트용 */
export const MOUNTAIN_CLIMBER = { HANDS, BACK_ANKLE };
