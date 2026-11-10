import { poseFromAngles, translate, type Pose } from "../figure/geometry";
import { G, pt } from "./helpers";
import type { Shape } from "./shapes";

/** 제자리 걸음 모델. 러닝과 걷기가 값만 바꿔 쓴다. */
export type Gait = {
  /** 두 발을 한 번씩 내딛는 주기(프레임) */
  cycle: number;
  /** 넓적다리가 앞뒤로 흔들리는 각도(±도) */
  thighSwing: number;
  /** 다리를 앞으로 옮기는 동안 무릎을 더 굽히는 각도 */
  kneeBend: number;
  /** 늘 굽혀 두는 무릎 각도 */
  kneeBase: number;
  /** 팔이 앞뒤로 흔들리는 각도(±도) */
  armSwing: number;
  /** 아래팔이 위팔보다 앞으로 굽은 각도 */
  elbow: number;
  torso: number;
  /** 두 발이 모두 뜨는 높이(px). 걷기는 0 */
  bounce: number;
  hipX: number;
  /** 바닥 눈금이 뒤로 흘러가는 속도(px/프레임) */
  speed: number;
};

function legAngles(g: Gait, phase: number) {
  const thigh = -90 + g.thighSwing * Math.sin(phase);
  // 다리를 앞으로 옮기는 동안(넓적다리가 앞으로 움직일 때) 무릎을 굽혀 발이 바닥에 끌리지 않게 한다
  const flex = g.kneeBase + g.kneeBend * Math.max(0, Math.cos(phase + Math.PI / 4)) ** 1.5;
  const shin = thigh - flex;
  return { thigh, shin, foot: shin + 90 };
}

export function gaitPose(g: Gait, frame: number): Pose {
  const phase = (2 * Math.PI * (frame % g.cycle)) / g.cycle;
  const near = legAngles(g, phase);
  const far = legAngles(g, phase + Math.PI);
  // 팔은 같은 쪽 다리와 반대로 흔든다
  const nearArm = -90 - g.armSwing * Math.sin(phase);
  const farArm = -90 + g.armSwing * Math.sin(phase);
  const pose = poseFromAngles(pt(g.hipX, 0), {
    torso: g.torso,
    head: g.torso + 4,
    nearUpperArm: nearArm,
    nearForearm: nearArm + g.elbow,
    farUpperArm: farArm,
    farForearm: farArm + g.elbow,
    nearThigh: near.thigh,
    nearShin: near.shin,
    nearFoot: near.foot,
    farThigh: far.thigh,
    farShin: far.shin,
    farFoot: far.foot,
  });
  // 가장 낮은 발 부위가 바닥에 닿게 하고, 두 발이 바뀌는 순간에는 bounce만큼 뜬다
  const lowest = Math.max(pose.near.ankle.y, pose.near.toe.y, pose.far.ankle.y, pose.far.toe.y);
  const lift = g.bounce * Math.max(0, Math.sin(2 * phase - 0.6));
  return translate(pose, pt(0, G - lift - lowest));
}

/** 러닝머신처럼 바닥선 아래 눈금이 뒤로 흘러간다 */
export function groundTicks(g: Gait, frame: number): Shape[] {
  const gap = 70;
  const left = 40;
  const right = 680;
  const offset = (frame * g.speed) % gap;
  const out: Shape[] = [];
  for (let x = left - offset; x < right; x += gap) {
    const a = Math.max(left, x);
    const b = Math.min(right, x + 22);
    if (b > a) out.push({ kind: "line", a: pt(a, G + 20), b: pt(b, G + 20), stroke: "muted", width: 3 });
  }
  return out;
}
