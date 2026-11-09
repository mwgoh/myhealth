import { anchorAt, clamp, deg, ease, lerp, poseFromAngles, SEG, step, type Limbs, type Pose, type Vec } from "../figure/geometry";
import { GROUND_Y } from "../layout";
import type { Timing } from "../scenes/counter";
import type { ExerciseVideoDef } from "./types";

const timing = { kind: "hold", setupFrames: 60, holdFrames: 900 } as const satisfies Timing;

// 기준점: 가까운 쪽 팔꿈치. 위팔은 세우고 아래팔은 바닥에 앞으로 둔다.
const ELBOW: Vec = { x: 430, y: GROUND_Y };

// 무릎 대고 엎드린 자세: 어깨·엉덩이·무릎이 일직선이고 무릎이 바닥에 닿는 기울기
const KNEEL = deg(Math.asin(SEG.upperArm / (SEG.torso + SEG.thigh)));
// 팔꿈치 플랭크: 어깨·엉덩이·발목이 일직선
const HOLD = 9;

/** 발목 높이에 맞춰 발끝이 바닥에 닿는 발 각도로 바꾼다 */
function toeOnGround(l: Limbs): Limbs {
  const ankleHeight = GROUND_Y - l.ankle.y;
  const footDeg = 180 + deg(Math.asin(clamp(ankleHeight / SEG.foot, 0, 1)));
  return { ...l, toe: step(l.ankle, footDeg, SEG.foot) };
}

function plankPose(t: number): Pose {
  const torso = lerp(KNEEL, HOLD, t);
  const shin = lerp(180, 180 + HOLD, t);
  const legs = { thigh: torso + 180, shin, foot: 180 };
  const p = anchorAt(
    poseFromAngles(
      { x: 0, y: 0 },
      {
        torso,
        head: torso,
        nearUpperArm: -90,
        nearForearm: 0,
        farUpperArm: -90,
        farForearm: 0,
        nearThigh: legs.thigh,
        nearShin: legs.shin,
        nearFoot: legs.foot,
        farThigh: legs.thigh,
        farShin: legs.shin,
        farFoot: legs.foot,
      },
    ),
    (q) => q.near.elbow,
    ELBOW,
  );
  return { ...p, near: toeOnGround(p.near), far: toeOnGround(p.far) };
}

export const plank: ExerciseVideoDef = {
  id: "seed-plank",
  timing,
  // 버티는 동안에는 움직이지 않는다. 팔꿈치·발끝 고정과 일직선을 함께 지키면 몸을 흔들 여지가 없다.
  pose: (frame) => plankPose(frame < timing.setupFrames ? ease(frame / timing.setupFrames) : 1),
};
