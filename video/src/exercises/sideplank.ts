import { clamp, deg, lerp, SEG } from "../figure/geometry";
import { HOLD_30S, holdState, onGround, place } from "./helpers";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 앞에서 본 사이드 플랭크. 아래쪽 팔꿈치(near)를 바닥에 고정하고 위팔은 세운다.
// 옆으로 누워 골반이 바닥에 닿은 자세에서 골반을 들어 어깨·골반·발목을 일직선으로 만든다.
const ELBOW = onGround(380);
const SHOULDER_H = SEG.upperArm;
const LEG = SEG.thigh + SEG.shin;
// 골반이 바닥에 닿은 자세의 몸통 각도, 일직선 자세의 몸 각도
const DOWN_DEG = deg(Math.asin(SHOULDER_H / SEG.torso));
const HOLD_DEG = deg(Math.asin(SHOULDER_H / (SEG.torso + LEG)));

export const sidePlank: ExerciseVideoDef = {
  id: "seed-side-plank",
  timing,
  view: "front",
  pose(frame) {
    const { t } = holdState(timing, frame);
    const torso = lerp(DOWN_DEG, HOLD_DEG, t);
    // 발이 바닥에 붙도록 골반 높이에 맞춰 다리를 기울인다
    const hipH = SHOULDER_H - SEG.torso * Math.sin((torso * Math.PI) / 180);
    const leg = 180 + deg(Math.asin(clamp(hipH / LEG, 0, 1)));
    return place(
      {
        torso,
        head: torso,
        nearUpperArm: -90,
        nearForearm: 0,
        // 위쪽 팔(far)은 옆구리에 얹었다가 하늘로 뻗는다
        farUpperArm: lerp(200, 90, t),
        farForearm: lerp(190, 90, t),
        nearThigh: leg,
        nearShin: leg,
        nearFoot: 180,
        farThigh: leg,
        farShin: leg,
        farFoot: 180,
      },
      (q) => q.near.elbow,
      ELBOW,
    );
  },
};

/** 테스트용 */
export const SIDE_PLANK_ELBOW = ELBOW;
