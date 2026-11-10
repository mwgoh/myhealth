import { armIK, dir, legIK, lerp, lerpVec, poseFromAngles, scale, SEG, sub, type Angles, type Pose, type Vec } from "../figure/geometry";
import { STROKE } from "../layout";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, KNEE_FORWARD, pt } from "./helpers";
import { barbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 바닥에서 들어 올리기(1초) → 내려놓기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

const NEAR_ANKLE = pt(210, G);
const FAR_ANKLE = pt(204, G);
// 바는 발 가운데 위를 수직으로 오르내린다
const BAR_X = NEAR_ANKLE.x + 12;
// 팔은 거의 편 채(팔 길이 132px) 바를 잡는다
const ARM = 130;
const PLATE_R = 44;
const FLOOR_TOP = G + STROKE / 2;
const ELBOW_BACK = pt(-1, 0);

// 시작: 원판이 바닥에 닿고, 허리를 편 채(몸통 35°) 어깨가 바보다 10px 앞에 오는 엉덩이 위치
const BOTTOM_TORSO = 35;
const BOTTOM_SHOULDER = pt(BAR_X + 10, FLOOR_TOP - PLATE_R - Math.sqrt(ARM ** 2 - 10 ** 2));
const BOTTOM_HIP = sub(BOTTOM_SHOULDER, scale(dir(BOTTOM_TORSO), SEG.torso));
// 끝: 똑바로 선다(먼 쪽 발목까지 닿도록 다리는 182px보다 조금 짧게)
const TOP_TORSO = 88;
const TOP_HIP = pt(NEAR_ANKLE.x + 1, G - 181.4);

/** 팔을 ARM 길이로 늘어뜨렸을 때 바의 위치 */
function barFor(p: Pose): Vec {
  const dx = BAR_X - p.shoulder.x;
  return pt(BAR_X, p.shoulder.y + Math.sqrt(ARM ** 2 - dx * dx));
}

const ANGLES: Angles = {
  torso: BOTTOM_TORSO,
  head: 45,
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
};

export const deadlift: ExerciseVideoDef = {
  id: "seed-deadlift",
  timing,
  pose(frame) {
    const t = repPhase(timing, frame);
    let p = poseFromAngles(lerpVec(BOTTOM_HIP, TOP_HIP, t), {
      ...ANGLES,
      torso: lerp(BOTTOM_TORSO, TOP_TORSO, t),
      head: lerp(45, 88, t),
    });
    p = legIK(p, "near", NEAR_ANKLE, KNEE_FORWARD, 0);
    p = legIK(p, "far", FAR_ANKLE, KNEE_FORWARD, 0);
    const bar = barFor(p);
    p = armIK(p, "far", bar, ELBOW_BACK);
    return armIK(p, "near", bar, ELBOW_BACK);
  },
  props: (_frame, pose) => barbell(barFor(pose)),
};

/** 테스트용: 바의 x와 원판 반지름, 바닥선 위끝 */
export const DEADLIFT = { BAR_X, PLATE_R, FLOOR_TOP };
