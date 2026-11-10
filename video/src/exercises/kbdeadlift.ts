import { armIK, dir, legIK, lerp, lerpVec, poseFromAngles, scale, SEG, sub, type Pose, type Vec } from "../figure/geometry";
import { STROKE } from "../layout";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, KNEE_FORWARD, onGround, pt } from "./helpers";
import { kettlebell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 들어 올리기(1초) → 내려놓기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

const NEAR_ANKLE = onGround(210);
const FAR_ANKLE = onGround(204);
// 벨은 두 발 사이에서 수직으로 오르내린다
const HANDLE_X = NEAR_ANKLE.x + 4;
const ARM = 130;
// 손잡이(손)에서 벨 몸통 아래끝까지: 몸통 중심 18px + 반지름 15px
const BELL_DROP = 18 + 15;
const FLOOR_TOP = G + STROKE / 2;
const ELBOW_BACK = pt(-1, 0);

// 시작: 벨이 바닥에 닿고, 허리를 편 채(몸통 40°) 어깨가 손잡이보다 8px 앞
const BOTTOM_TORSO = 40;
const BOTTOM_SHOULDER = pt(HANDLE_X + 8, FLOOR_TOP - BELL_DROP - Math.sqrt(ARM ** 2 - 8 ** 2));
const BOTTOM_HIP = sub(BOTTOM_SHOULDER, scale(dir(BOTTOM_TORSO), SEG.torso));
const TOP_HIP = pt(NEAR_ANKLE.x + 1, G - 181.4);

/** 팔을 ARM 길이로 늘어뜨렸을 때 손잡이 위치 */
function handleFor(p: Pose): Vec {
  const dx = HANDLE_X - p.shoulder.x;
  return pt(HANDLE_X, p.shoulder.y + Math.sqrt(ARM ** 2 - dx * dx));
}

export const kbDeadlift: ExerciseVideoDef = {
  id: "seed-kb-deadlift",
  timing,
  pose(frame) {
    const t = repPhase(timing, frame);
    let p = poseFromAngles(lerpVec(BOTTOM_HIP, TOP_HIP, t), {
      torso: lerp(BOTTOM_TORSO, 88, t),
      head: lerp(50, 88, t),
      nearUpperArm: -90,
      nearForearm: -90,
      farUpperArm: -90,
      farForearm: -90,
      nearThigh: -90,
      nearShin: -90,
      nearFoot: 0,
      farThigh: -90,
      farShin: -90,
      farFoot: 0,
    });
    p = legIK(p, "near", NEAR_ANKLE, KNEE_FORWARD, 0);
    p = legIK(p, "far", FAR_ANKLE, KNEE_FORWARD, 0);
    const h = handleFor(p);
    return armIK(armIK(p, "far", h, ELBOW_BACK), "near", h, ELBOW_BACK);
  },
  props: (_frame, pose) => kettlebell(handleFor(pose), -90),
};
