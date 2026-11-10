import { add, armIK, dir, legIK, lerp, poseFromAngles, scale, step, type Angles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, pt } from "./helpers";
import { beam } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 내리기(2초) → 밀기(1초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 45° 뒤로 기운 등받이에 앉는다. 발판은 엉덩이에서 40° 위쪽 레일을 따라 움직인다.
const HIP = pt(250, G - 80);
const RAIL_DEG = 40;
// 무릎을 끝까지 펴서 잠그지 않도록 다리 길이(182px)보다 짧게 민다
const EXTENDED = 170;
const BENT = 105;
// 발바닥이 발판에 붙도록 발은 레일과 수직, 발끝이 위로
const FOOT_DEG = RAIL_DEG + 90;
const KNEE_TO_CHEST = pt(-0.4, -1);
const ELBOW_DOWN = pt(-0.3, 1);
const HANDLE = add(HIP, pt(0, 6));

const SEATED: Angles = {
  torso: 135,
  head: 115,
  nearUpperArm: -90,
  nearForearm: -90,
  farUpperArm: -90,
  farForearm: -90,
  nearThigh: 0,
  nearShin: 0,
  nearFoot: FOOT_DEG,
  farThigh: 0,
  farShin: 0,
  farFoot: FOOT_DEG,
};

const ankleAt = (frame: number) => step(HIP, RAIL_DEG, lerp(EXTENDED, BENT, repPhase(timing, frame)));

// 등받이는 몸통의 등 쪽(몸통 방향 +90°)에, 레일은 발 경로의 아래쪽에 둔다
const BACK_SIDE = dir(SEATED.torso + 90);
const RAIL_SIDE = scale(dir(RAIL_DEG - 90), 26);
const RAIL_MID = add(step(HIP, RAIL_DEG, 140), RAIL_SIDE);

export const legPress: ExerciseVideoDef = {
  id: "seed-leg-press",
  timing,
  pose(frame) {
    const ankle = ankleAt(frame);
    let p = poseFromAngles(HIP, SEATED);
    p = legIK(p, "far", ankle, KNEE_TO_CHEST, FOOT_DEG);
    p = legIK(p, "near", ankle, KNEE_TO_CHEST, FOOT_DEG);
    return armIK(armIK(p, "far", HANDLE, ELBOW_DOWN), "near", HANDLE, ELBOW_DOWN);
  },
  props(frame) {
    const sole = step(ankleAt(frame), RAIL_DEG, 10);
    const backStart = add(HIP, scale(BACK_SIDE, 14));
    return [
      // 등받이, 좌판, 받침
      beam(backStart, step(backStart, 135, 150), 16),
      beam(add(HIP, pt(-26, 13)), add(HIP, pt(30, 13)), 12),
      beam(add(HIP, pt(0, 20)), pt(HIP.x, G + 7), 10, "equipDark"),
      // 레일과 받침
      beam(add(step(HIP, RAIL_DEG, 80), RAIL_SIDE), add(step(HIP, RAIL_DEG, 200), RAIL_SIDE), 8, "equipDark"),
      beam(RAIL_MID, pt(RAIL_MID.x, G + 7), 8, "equipDark"),
      // 발판: 발바닥 바로 뒤에 레일과 수직으로
      beam(step(sole, FOOT_DEG, -24), step(sole, FOOT_DEG, 48), 12, "equipDark"),
    ];
  },
};

/** 테스트용 */
export const LEG_PRESS = { HIP, RAIL_DEG, EXTENDED, BENT };
