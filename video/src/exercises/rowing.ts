import { add, armIK, clamp, ease, legIK, lerp, poseFromAngles, type Vec } from "../figure/geometry";
import type { Timing } from "../scenes/counter";
import { G, pt } from "./helpers";
import { beam, block, grip } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing: Timing = { kind: "timer", frames: 900 };

// 로잉머신. 3초에 한 번: 당기기 1초(다리 → 허리 → 팔 순서), 돌아가기 2초(팔 → 허리 → 다리 순서).
// 발은 발판에, 엉덩이는 레일 위 의자에 두고 손잡이는 같은 높이에서 수평으로 움직인다.
const STROKE_FRAMES = 90;
const DRIVE_FRAMES = 30;
const ANKLE = pt(420, G - 34);
const FOOT_DEG = 75;
const SEAT_Y = G - 30;
// 앞(무릎을 접은 자세)과 뒤(다리를 편 자세)의 엉덩이 x
const CATCH_HIP_X = ANKLE.x - 95;
const FINISH_HIP_X = ANKLE.x - 176;
const HANDLE_Y = G - 95;
const KNEE_UP = pt(0, -1);
const ELBOW_BACK = pt(-1, 0.5);

const part = (s: number, from: number, len: number) => ease(clamp((s - from) / len, 0, 1));

/** 다리(legs)·허리(back)·팔(arms)이 각각 얼마나 당겼는지(0~1) */
function strokeState(frame: number): { legs: number; back: number; arms: number } {
  const f = frame % STROKE_FRAMES;
  if (f < DRIVE_FRAMES) {
    const s = f / DRIVE_FRAMES;
    return { legs: part(s, 0, 0.55), back: part(s, 0.3, 0.4), arms: part(s, 0.6, 0.4) };
  }
  const r = (f - DRIVE_FRAMES) / (STROKE_FRAMES - DRIVE_FRAMES);
  return { arms: 1 - part(r, 0, 0.35), back: 1 - part(r, 0.2, 0.4), legs: 1 - part(r, 0.45, 0.55) };
}

/** 팔을 편 손잡이 위치와 가슴 앞 위치 사이 */
function handleFor(shoulder: Vec, arms: number): Vec {
  const dy = HANDLE_Y - shoulder.y;
  const reach = Math.sqrt(128 ** 2 - dy * dy);
  return pt(shoulder.x + lerp(reach, 22, arms), HANDLE_Y);
}

export const rowing: ExerciseVideoDef = {
  id: "seed-rowing",
  timing,
  keyFrames: [0, 20, 30],
  pose(frame) {
    const { legs, back, arms } = strokeState(frame);
    const torso = lerp(62, 112, back);
    let p = poseFromAngles(pt(lerp(CATCH_HIP_X, FINISH_HIP_X, legs), SEAT_Y), {
      torso,
      head: lerp(75, 100, back),
      nearUpperArm: 0,
      nearForearm: 0,
      farUpperArm: 0,
      farForearm: 0,
      nearThigh: 30,
      nearShin: -60,
      nearFoot: FOOT_DEG,
      farThigh: 30,
      farShin: -60,
      farFoot: FOOT_DEG,
    });
    p = legIK(p, "far", add(ANKLE, pt(-4, 2)), KNEE_UP, FOOT_DEG);
    p = legIK(p, "near", ANKLE, KNEE_UP, FOOT_DEG);
    const handle = handleFor(p.shoulder, arms);
    return armIK(armIK(p, "far", handle, ELBOW_BACK), "near", handle, ELBOW_BACK);
  },
  props(_frame, pose) {
    const flywheel = pt(ANKLE.x + 85, G - 55);
    return [
      // 레일과 받침
      beam(pt(150, G - 6), pt(ANKLE.x + 10, G - 6), 8, "equipDark"),
      beam(pt(160, G - 6), pt(160, G + 7), 8, "equipDark"),
      // 의자(엉덩이 아래)
      block(pose.hip.x - 26, SEAT_Y + 9, 52, 10, "equipDark"),
      // 발판
      beam(add(ANKLE, pt(14, 14)), add(ANKLE, pt(-4, -40)), 10),
      // 플라이휠과 체인
      { kind: "circle", c: flywheel, r: 42, fill: "equip" },
      { kind: "line", a: add(flywheel, pt(-30, -32)), b: pose.near.hand, stroke: "equipDark", width: 3 },
      grip(pose.near.hand, 7),
    ];
  },
};

/** 테스트용 */
export const ROWING = { ANKLE, SEAT_Y, HANDLE_Y };
