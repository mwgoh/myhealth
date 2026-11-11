import { add, angleOf, armIK, clamp, ease, lerp, lerpVec } from "../figure/geometry";
import type { RepsTiming } from "../scenes/counter";
import { pt } from "./helpers";
import { ARM_DOWN_DEG, hinge } from "./kbpickup";
import { kettlebell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 한 번에 3.7초: 클린(바닥 → 랙) → 랙에서 멈춤 → 프레스 → 맨 위에서 멈춤 → 랙으로 → 바닥으로. 8회.
const CLEAN_END = 22;
const PRESS_START = 36;
const PRESS_END = 58;
const LOWER_START = 70;
const LOWER_END = 88;
const DROP_START = 92;
const REP = 112;
const timing: RepsTiming = { kind: "reps", reps: 8, goFrames: REP, returnFrames: 0 };

// 랙: 벨을 어깨에 얹은 자세. 어깨 기준 손 위치는 케틀벨 프레스와 같다.
const RACK = pt(14, -6);
// 머리 위: 팔을 거의 다 편다(어깨에서 손까지 131px, 팔 길이 132px)
const LOCKOUT = pt(2, -131);
// 프레스하는 동안 팔꿈치는 앞·아래에 있다
const ELBOW_PRESS = pt(0.6, 1);

type ArmAngles = { upper: number; fore: number };

/** 선 자세에서 랙에 벨을 얹은 팔의 각도. 프레스가 시작하는 팔과 같아야 이어진다 */
const RACK_ARM: ArmAngles = (() => {
  const body = hinge(1, { nearUpperArm: ARM_DOWN_DEG, nearForearm: ARM_DOWN_DEG });
  const p = armIK(body, "near", add(body.shoulder, RACK), ELBOW_PRESS);
  return { upper: angleOf(p.shoulder, p.near.elbow), fore: angleOf(p.near.elbow, p.near.hand) };
})();
// 클린 중간: 팔꿈치를 뒤로 당겨 몸통 옆에 붙이고 아래팔을 세워, 벨이 몸 가까이 올라온다
const MID_ARM: ArmAngles = { upper: -115, fore: 40 };
const MID_AT = 0.45;

/** 클린의 팔. t는 0(편 팔로 벨을 잡음) ~ 1(랙) */
function cleanArm(t: number) {
  const [a, b, s] = t < MID_AT ? [{ upper: ARM_DOWN_DEG, fore: ARM_DOWN_DEG }, MID_ARM, t / MID_AT] : [MID_ARM, RACK_ARM, (t - MID_AT) / (1 - MID_AT)];
  return { nearUpperArm: lerp(a.upper, b.upper, s), nearForearm: lerp(a.fore, b.fore, s) };
}

/** clean: 0 바닥 ~ 1 랙(시간에 비례). press: 0 랙 ~ 1 머리 위 */
function phases(frame: number): { clean: number; press: number } {
  const f = frame % REP;
  if (f < CLEAN_END) return { clean: f / CLEAN_END, press: 0 };
  if (f < PRESS_START) return { clean: 1, press: 0 };
  if (f < PRESS_END) return { clean: 1, press: ease((f - PRESS_START) / (PRESS_END - PRESS_START)) };
  if (f < LOWER_START) return { clean: 1, press: 1 };
  if (f < LOWER_END) return { clean: 1, press: 1 - ease((f - LOWER_START) / (LOWER_END - LOWER_START)) };
  if (f < DROP_START) return { clean: 1, press: 0 };
  return { clean: 1 - (f - DROP_START) / (REP - DROP_START), press: 0 };
}

/** 다리와 엉덩이가 먼저 펴지고(클린의 70%까지), 팔은 조금 늦게(20%부터) 벨을 끌어올린다 */
const bodyOf = (clean: number) => ease(clamp(clean / 0.7, 0, 1));
const pullOf = (clean: number) => ease(clamp((clean - 0.2) / 0.8, 0, 1));

export const kbCleanPress: ExerciseVideoDef = {
  id: "seed-kb-clean-press",
  timing,
  // 머리 위로 뻗은 팔이 제목과 겹치지 않게 줄인다
  scale: 0.8,
  keyFrames: [12, 28, 64],
  pose(frame) {
    const { clean, press } = phases(frame);
    const body = hinge(bodyOf(clean), cleanArm(pullOf(clean)));
    if (press === 0) return body;
    return armIK(body, "near", lerpVec(add(body.shoulder, RACK), add(body.shoulder, LOCKOUT), press), ELBOW_PRESS);
  },
  // 벨 몸통은 늘어져 있다가(아래) 클린하면서 손목 뒤(팔뚝 바깥)로 돌아 얹힌다
  props(frame, pose) {
    const { clean } = phases(frame);
    return kettlebell(pose.near.hand, lerp(-90, -180, pullOf(clean)), true);
  },
};

/** 테스트용 */
export const KB_CLEAN_PRESS = { RACK_FRAME: 28, LOCKOUT_FRAME: 64 };
