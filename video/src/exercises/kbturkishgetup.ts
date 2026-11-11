import { angleOf, armIK, clamp, deg, ease, legIK, lerp, poseFromAngles, SEG, step, type Pose, type Side, type Vec } from "../figure/geometry";
import type { RepsTiming } from "../scenes/counter";
import { G, HEAD_REST_DEG, KNEE_FORWARD, onGround, pt } from "./helpers";
import { kettlebell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 한 번에 15초: 누움 → 팔꿈치 → 손 → 브리지 → 다리 넣기 → 한쪽 무릎 → 서기(6초), 멈춘 뒤 같은 길로 다시 눕는다. 2회.
// 머리는 왼쪽, 발은 오른쪽에 두고 눕는다. 벨을 든 팔과 세운 무릎이 가까운 쪽, 받치는 팔과 접어 넣는 다리가 먼 쪽이다.
const REP = 450;
const timing: RepsTiming = { kind: "reps", reps: 2, goFrames: REP, returnFrames: 0 };

/** 단계 번호 */
const LIE = 0;
const ELBOW = 1;
const HAND = 2;
const BRIDGE = 3;
const SWEEP = 4;
const KNEEL = 5;
const STAND = 6;

/** [프레임, 단계]. 단계 사이는 1초씩 움직이고, 맨 위에서 1.5초 멈춘다 */
const STOPS: [number, number][] = [
  [0, LIE],
  [15, LIE],
  [45, ELBOW],
  [75, HAND],
  [105, BRIDGE],
  [135, SWEEP],
  [165, KNEEL],
  [195, STAND],
  [240, STAND],
  [270, KNEEL],
  [300, SWEEP],
  [330, BRIDGE],
  [360, HAND],
  [390, ELBOW],
  [420, LIE],
  [REP, LIE],
];

function stageAt(frame: number): number {
  const f = frame % REP;
  let i = 0;
  while (i < STOPS.length - 2 && f >= STOPS[i + 1][0]) i++;
  const [f0, s0] = STOPS[i];
  const [f1, s1] = STOPS[i + 1];
  return lerp(s0, s1, ease((f - f0) / (f1 - f0)));
}

/** 세운 무릎 쪽 발. 처음부터 끝까지 이 자리에 붙어 있다 */
const FOOT = onGround(380);
const KNEE_UP = pt(0.2, -1);
const LIE_HIP = pt(FOOT.x - 110, G);
// 한쪽 무릎 자세: 앞 정강이와 뒤 넓적다리가 수직이다. 브리지와 다리 넣기도 이 엉덩이 위치에서 한다.
const KNEEL_HIP = pt(FOOT.x - SEG.thigh, G - SEG.thigh);
const STAND_HIP = pt(FOOT.x + 1, G - 181.4);

// 단계마다 엉덩이 위치와 몸통·머리 각도. 머리는 벨을 보도록 몸통보다 조금 뒤로 젖힌다(누웠을 때는 바닥에 댄다).
// 브리지와 다리 넣기는 엉덩이를 높이 들고 몸통을 받치는 손 쪽으로 눕힌다.
const STAGES = [
  { hip: LIE_HIP, torso: 180, head: 180 - HEAD_REST_DEG },
  { hip: LIE_HIP, torso: 150, head: 152 },
  { hip: LIE_HIP, torso: 118, head: 124 },
  { hip: KNEEL_HIP, torso: 165, head: 165 },
  { hip: KNEEL_HIP, torso: 165, head: 165 },
  { hip: KNEEL_HIP, torso: 90, head: 98 },
  { hip: STAND_HIP, torso: 88, head: 96 },
];

const LEG = SEG.thigh + SEG.shin;
/** 누웠을 때 먼 쪽 다리를 바닥에 편 발목 */
const FAR_LIE_ANKLE = pt(LIE_HIP.x + LEG, G);
/** 브리지의 먼 쪽 다리: 엉덩이 높이(넓적다리 길이)에서 곧게 편 다리의 발뒤꿈치가 바닥에 닿는 각도 */
const BRIDGE_LEG_DEG = -deg(Math.asin((G - KNEEL_HIP.y) / LEG));
const FAR_KNEEL_ANKLE = pt(KNEEL_HIP.x - SEG.shin, G);
const FAR_STAND_ANKLE = onGround(FOOT.x - 6);
// 일어설 때 뒤 발을 앞으로 옮기며 드는 높이. 발끝이 아래를 지나므로 발 길이보다 커야 한다
const STEP_LIFT = SEG.foot + 2;

const ARM_HANG = { upper: -95, fore: -90 };
const ELBOW_UNDER = pt(1, 0.4);

/** 팔꿈치와 아래팔을 바닥에 댄 받치는 팔. 아래팔은 머리 쪽을 향한다 */
function proppedArm(shoulder: Vec): { elbow: Vec; hand: Vec } {
  const h = G - shoulder.y;
  const elbow = pt(shoulder.x + Math.sqrt(SEG.upperArm ** 2 - h * h), G);
  return { elbow, hand: pt(elbow.x - SEG.forearm, G) };
}

/** 팔꿈치 자세에서 짚은 손. 손으로 받치는 동안 그 자리에 둔다 */
const SUPPORT_HAND = proppedArm(step(STAGES[ELBOW].hip, STAGES[ELBOW].torso, SEG.torso)).hand;

function baseAngles(torso: number, head: number) {
  return {
    torso,
    head,
    // 벨을 든 팔은 내내 수직이다
    nearUpperArm: 90,
    nearForearm: 90,
    farUpperArm: ARM_HANG.upper,
    farForearm: ARM_HANG.fore,
    nearThigh: 60,
    nearShin: -60,
    nearFoot: 0,
    // 누웠을 때 먼 쪽 다리는 바닥에 펴고 발끝을 세운다
    farThigh: 0,
    farShin: 0,
    farFoot: 90,
  };
}

/** 그쪽 다리를 각도대로 놓는다 */
function setLeg(p: Pose, side: Side, thigh: number, shin: number, foot: number): Pose {
  const knee = step(p.hip, thigh, SEG.thigh);
  const ankle = step(knee, shin, SEG.shin);
  return { ...p, [side]: { ...p[side], knee, ankle, toe: step(ankle, foot, SEG.foot) } };
}

/** 그쪽 팔을 각도대로 놓는다 */
function setArm(p: Pose, side: Side, upper: number, fore: number): Pose {
  const elbow = step(p.shoulder, upper, SEG.upperArm);
  return { ...p, [side]: { ...p[side], elbow, hand: step(elbow, fore, SEG.forearm) } };
}

/**
 * 다리 넣기: 브리지에서 편 먼 쪽 다리를 엉덩이 아래로 접어 넣어 무릎을 꿇는다. s는 0~1.
 * 앞쪽 절반은 무릎을 끌어올리며 발을 무릎 아래로 당기고, 뒤쪽 절반은 정강이를 뒤로 눕힌 다음 무릎을 바닥에 내린다.
 * 무릎을 먼저 내리면 발이 바닥을 뚫는다.
 */
function sweepLeg(s: number): { thigh: number; shin: number; foot: number } {
  const foot = lerp(90, 180, s);
  if (s < 0.5) {
    const u = s / 0.5;
    return {
      thigh: lerp(BRIDGE_LEG_DEG, 10, ease(clamp(u / 0.7, 0, 1))),
      shin: lerp(BRIDGE_LEG_DEG, -90, ease(clamp((u - 0.2) / 0.8, 0, 1))),
      foot,
    };
  }
  const u = (s - 0.5) / 0.5;
  return {
    thigh: lerp(10, -90, ease(clamp((u - 0.3) / 0.7, 0, 1))),
    shin: lerp(-90, -180, ease(clamp(u / 0.6, 0, 1))),
    foot,
  };
}

/** stage: 0 누움 ~ 6 서기 사이의 실수 */
function poseAt(stage: number): Pose {
  const i = Math.min(STAGES.length - 2, Math.floor(stage));
  const t = stage - i;
  const a = STAGES[i];
  const b = STAGES[i + 1];
  let p = poseFromAngles(
    pt(lerp(a.hip.x, b.hip.x, t), lerp(a.hip.y, b.hip.y, t)),
    baseAngles(lerp(a.torso, b.torso, t), lerp(a.head, b.head, t)),
  );
  p = legIK(p, "near", FOOT, KNEE_UP, 0);

  // 먼 쪽 다리: 펴 둔다 → 엉덩이를 들며 발뒤꿈치를 바닥에 댄 채 편다 → 몸 아래로 접어 넣는다 → 앞으로 옮겨 선다
  if (i === HAND) {
    const h = G - p.hip.y;
    p = legIK(p, "far", pt(p.hip.x + Math.sqrt(Math.max(0, LEG ** 2 - h * h)), G), KNEE_FORWARD, 90);
  } else if (i === BRIDGE) {
    const leg = sweepLeg(t);
    p = setLeg(p, "far", leg.thigh, leg.shin, leg.foot);
  } else if (i === SWEEP) {
    p = setLeg(p, "far", -90, 180, 180);
  } else if (i === KNEEL) {
    const s = clamp(t / 0.85, 0, 1);
    const ankle = pt(lerp(FAR_KNEEL_ANKLE.x, FAR_STAND_ANKLE.x, s), G - STEP_LIFT * Math.sin(Math.PI * s));
    // 발등을 바닥에 댄 발(180°)이 발끝을 아래로 지나 앞을 향한다(360°)
    p = legIK(p, "far", ankle, KNEE_FORWARD, lerp(180, 360, s));
  }

  // 받치는 팔(먼 쪽): 팔꿈치로 받친다 → 손으로 받친다(브리지·다리 넣기 동안 그대로) → 몸통을 세우며 손을 떼어 늘어뜨린다
  if (i === LIE) return { ...p, far: { ...p.far, ...proppedArm(p.shoulder) } };
  if (i === ELBOW || i === HAND || i === BRIDGE) return armIK(p, "far", SUPPORT_HAND, ELBOW_UNDER);
  if (i === SWEEP) {
    // 팔이 닿는 동안은 손을 짚고 있다가, 닿지 않으면 편 팔이 바닥 쪽을 가리킨 채 들리고, 늘어뜨린 팔로 바뀐다
    const ik = armIK(p, "far", SUPPORT_HAND, ELBOW_UNDER);
    const w = ease(clamp((t - 0.25) / 0.6, 0, 1));
    return setArm(
      p,
      "far",
      lerp(angleOf(ik.shoulder, ik.far.elbow), ARM_HANG.upper, w),
      lerp(angleOf(ik.far.elbow, ik.far.hand), ARM_HANG.fore, w),
    );
  }
  return p;
}

/** 단계 자세가 되는 프레임(올라갈 때) */
const STAGE_FRAMES = [0, 45, 75, 105, 135, 165, 195];

export const kbTurkishGetup: ExerciseVideoDef = {
  id: "seed-kb-turkish-getup",
  timing,
  // 섰을 때 머리 위로 뻗은 팔이 제목과 겹치지 않게 줄인다
  scale: 0.8,
  keyFrames: [75, 105, 135],
  pose: (frame) => poseAt(stageAt(frame)),
  // 벨 몸통은 손목 뒤(팔뚝 바깥)에 얹힌다
  props: (_frame, pose) => kettlebell(pose.near.hand, 180),
};

/** 테스트용 */
export const TGU = {
  FOOT,
  SUPPORT_HAND,
  /** 누움·팔꿈치·손·브리지·다리 넣기·한쪽 무릎·서기 자세가 되는 프레임 */
  STAGE_FRAMES,
  /** [올라갈 때, 내려올 때] 같은 자세인 프레임 */
  MIRROR_FRAMES: [
    [45, 390],
    [75, 360],
    [90, 345],
    [105, 330],
    [120, 315],
    [135, 300],
    [150, 285],
    [165, 270],
  ],
};
