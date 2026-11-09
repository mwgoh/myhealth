import { lerpAngles, poseFromAngles, translate, type Angles, type Pose } from "../figure/geometry";
import { GROUND_Y } from "../layout";
import type { Timing } from "../scenes/counter";
import type { ExerciseVideoDef } from "./types";

const timing: Timing = { kind: "timer", frames: 900 };

// 0.5초(15프레임)마다 한 번 뛴다. 주기 앞 30%는 착지, 나머지는 공중이다.
const JUMP_FRAMES = 15;
const CONTACT = 0.3;
const LIFT = 18;
const HIP_X = 300;

// 줄은 몸(발목 x)과 손 높이를 중심으로 한 타원 위를 돈다. 공중 한가운데에서 발아래를 지난다.
const ROPE_RX = 95;
// 손(허리 높이)에서 발아래 바닥까지 닿을 만큼. 바닥 아래로 내려가는 부분은 바닥에 붙인다.
const ROPE_RY = 240;
const ROPE_BOTTOM_AT = 0.65;

// 착지: 무릎 살짝 굽힘, 앞꿈치로 닿는다
const LAND: Angles = {
  torso: 86,
  head: 88,
  nearUpperArm: -100,
  nearForearm: -20,
  farUpperArm: -98,
  farForearm: -22,
  nearThigh: -82,
  nearShin: -100,
  nearFoot: -20,
  farThigh: -86,
  farShin: -98,
  farFoot: -20,
};

// 공중: 다리를 펴고 발끝을 내린다
const AIR: Angles = {
  ...LAND,
  nearThigh: -88,
  nearShin: -92,
  nearFoot: -55,
  farThigh: -90,
  farShin: -94,
  farFoot: -50,
};

const cyclePos = (frame: number) => (frame % JUMP_FRAMES) / JUMP_FRAMES;

/** 0은 바닥, 1은 가장 높은 지점 */
function airness(p: number): number {
  return p < CONTACT ? 0 : Math.sin((Math.PI * (p - CONTACT)) / (1 - CONTACT));
}

function lowestY(pose: Pose): number {
  return Math.max(pose.near.ankle.y, pose.near.toe.y, pose.far.ankle.y, pose.far.toe.y);
}

export const jumpRope: ExerciseVideoDef = {
  id: "seed-jump-rope",
  timing,
  pose(frame) {
    const p = cyclePos(frame);
    const a = airness(p);
    // 손목으로 줄을 돌리는 느낌을 내려고 아래팔을 조금씩 흔든다
    const wrist = 12 * Math.sin(2 * Math.PI * p);
    const angles = lerpAngles(LAND, AIR, a);
    const pose = poseFromAngles({ x: HIP_X, y: 0 }, { ...angles, nearForearm: angles.nearForearm + wrist, farForearm: angles.farForearm + wrist });
    // 가장 낮은 발 부위가 바닥에서 LIFT×airness 높이에 오도록 엉덩이 높이를 정한다
    return translate(pose, { x: 0, y: GROUND_Y - LIFT * a - lowestY(pose) });
  },
  prop(frame, pose) {
    const phi = (270 + 360 * (ROPE_BOTTOM_AT - cyclePos(frame))) * (Math.PI / 180);
    const hand = pose.near.hand;
    const center = { x: pose.near.ankle.x, y: hand.y };
    const at = (angle: number) => ({ x: center.x + ROPE_RX * Math.cos(angle), y: Math.min(GROUND_Y, center.y - ROPE_RY * Math.sin(angle)) });
    const apex = at(phi);
    // 줄이 도는 반대쪽으로 휘어 보이게 조금 뒤처진 점을 조절점으로 쓴다
    const lag = at(phi + (35 * Math.PI) / 180);
    return { kind: "rope", hand, apex, ctrl: { x: center.x + 0.8 * (lag.x - center.x), y: center.y + 0.8 * (lag.y - center.y) } };
  },
};
