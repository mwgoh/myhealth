import {
  anchorAt,
  anglesOf,
  deg,
  ease,
  legIK,
  lerpAnglesShortest,
  lerpVec,
  lowPoints,
  poseFromAngles,
  SEG,
  step,
  translate,
  type Angles,
  type Pose,
  type Vec,
} from "../figure/geometry";
import { COUNTER_BOX, COUNTER_BOX_SHORT, GROUND_Y, SIZE, STROKE } from "../layout";
import { mainFrames, type Timing } from "../scenes/counter";
import type { ExerciseVideoDef } from "./types";

export const G = GROUND_Y;

/** 바닥 검사에서 머리 아래끝을 올려 잡는 값. 팔다리 선 두께의 절반과 같다. */
export const HEAD_INSET = STROKE / 2;

/** 누운 자세에서 머리가 바닥에 닿도록 목을 드는 각도(도). 몸통이 바닥과 평행할 때 기준이다. */
export const HEAD_REST_DEG = deg(Math.asin((SEG.headR - HEAD_INSET) / (SEG.neck + SEG.headR)));

export const pt = (x: number, y: number): Vec => ({ x, y });
export const onGround = (x: number): Vec => ({ x, y: G });

const ORIGIN: Vec = { x: 0, y: 0 };

/** pick이 고른 관절이 at에 오도록 각도대로 자세를 만든다 */
export const place = (a: Angles, pick: (p: Pose) => Vec, at: Vec): Pose => anchorAt(poseFromAngles(ORIGIN, a), pick, at);

/** 가장 낮은 점이 바닥 아래로 내려가면 그만큼 들어 올린다. 뛰는 동작의 키프레임 사이에 쓴다. */
export function keepAboveFloor(p: Pose): Pose {
  const lowest = Math.max(...lowPoints(p, HEAD_INSET).map((q) => q.y));
  return lowest > G ? translate(p, { x: 0, y: G - lowest }) : p;
}

export const KNEE_FORWARD: Vec = { x: 1, y: -0.2 };

/** 팔을 내린 자세 */
export const ARMS_DOWN = { nearUpperArm: -92, nearForearm: -88, farUpperArm: -95, farForearm: -90 };

/** 똑바로 선 자세. 무릎을 살짝 굽혀 먼 쪽 발목을 IK로 붙일 여유를 둔다. */
export const STAND: Angles = {
  ...ARMS_DOWN,
  torso: 88,
  head: 88,
  nearThigh: -86,
  nearShin: -94,
  nearFoot: 0,
  farThigh: -86,
  farShin: -94,
  farFoot: 0,
};

/** 가까운 쪽 발목을 바닥의 ankleX에 두고, 먼 쪽 발목은 IK로 바닥의 farAnkleX에 붙인다 */
export function standOn(a: Angles, ankleX: number, farAnkleX = ankleX - 6): Pose {
  const p = place(a, (q) => q.near.ankle, onGround(ankleX));
  return legIK(p, "far", onGround(farAnkleX), KNEE_FORWARD, a.farFoot);
}

export type HoldTiming = Extract<Timing, { kind: "hold" }>;

/** 자세 잡기 2초 + 버티기 30초 */
export const HOLD_30S: HoldTiming = { kind: "hold", setupFrames: 60, holdFrames: 900 };

/**
 * 버티기 종목의 상태. t는 자세 잡기 진행도(0~1)이고 버티는 동안 1이다.
 * breath는 숨쉬기 몸통 흔들림(±0.6°, 4초 주기)이고 자세 잡는 동안 0이다. 스트레칭만 쓴다.
 */
export function holdState(t: HoldTiming, frame: number): { t: number; breath: number } {
  if (frame < t.setupFrames) return { t: ease(frame / t.setupFrames), breath: 0 };
  return { t: 1, breath: 0.6 * Math.sin((2 * Math.PI * (frame - t.setupFrames)) / 120) };
}

/**
 * 네 발 자세: 두 무릎이 kneeX의 바닥에, 두 손이 어깨 바로 아래 바닥에 닿고 팔은 수직이다.
 * 팔(132px)이 넓적다리(92px)보다 길어 어깨가 엉덩이보다 40px 높다.
 */
export function allFours(kneeX: number) {
  const hip = pt(kneeX, G - SEG.thigh);
  const torso = deg(Math.asin((SEG.upperArm + SEG.forearm - SEG.thigh) / SEG.torso));
  const shoulder = step(hip, torso, SEG.torso);
  const angles: Angles = {
    torso,
    head: torso - 10,
    nearUpperArm: -90,
    nearForearm: -90,
    farUpperArm: -90,
    farForearm: -90,
    nearThigh: -90,
    nearShin: 180,
    nearFoot: 180,
    farThigh: -90,
    farShin: 180,
    farFoot: 180,
  };
  return { hip, angles, hands: pt(shoulder.x, G), knee: pt(kneeX, G) };
}

/** 키프레임: 엉덩이 위치와 마디 각도 */
export type KeyPose = { hip: Vec; angles: Angles };
export const keyOf = (p: Pose): KeyPose => ({ hip: p.hip, angles: anglesOf(p) });

/**
 * 키프레임 사이를 보간한다. keys는 at(프레임) 순서다. 각도는 짧은 쪽으로 돌고 엉덩이는 직선으로 움직인다.
 * segment는 지금 몇 번째 구간(keys[i] → keys[i+1])인지다. 구간마다 손·발 고정 같은 제약을 따로 걸 때 쓴다.
 */
export function sampleKeys(keys: { at: number; key: KeyPose }[], frame: number): { pose: Pose; segment: number } {
  let i = keys.length - 2;
  for (let k = 0; k < keys.length - 1; k++) {
    if (frame < keys[k + 1].at) {
      i = k;
      break;
    }
  }
  const a = keys[i];
  const b = keys[i + 1];
  const t = ease((frame - a.at) / (b.at - a.at));
  return { pose: poseFromAngles(lerpVec(a.key.hip, b.key.hip, t), lerpAnglesShortest(a.key.angles, b.key.angles, t)), segment: i };
}

/** 화면 배율 중심 x. 바닥선(GROUND_Y)과 이 x를 기준으로 줄인다 */
export const SCALE_CX = SIZE / 2;

/** 이 종목의 카운터 글자 영역. 반복 종목("n / 10")이 시간 종목("0:30")보다 넓다. */
export const counterBoxOf = (def: ExerciseVideoDef) => (def.timing.kind === "reps" ? COUNTER_BOX : COUNTER_BOX_SHORT);

/** 영상 좌표(배율 적용 전)를 화면 좌표로 바꾼다 */
export function toScreen(def: ExerciseVideoDef, p: Vec): Vec {
  const s = def.scale ?? 1;
  return { x: SCALE_CX + s * (p.x - SCALE_CX), y: G + s * (p.y - G) };
}

/** 자세 확인 시트에 그릴 본 동작 프레임 3개 */
export function keyFramesOf(def: ExerciseVideoDef): [number, number, number] {
  if (def.keyFrames) return def.keyFrames;
  const t = def.timing;
  switch (t.kind) {
    case "reps":
      return [0, Math.round(t.goFrames / 2), t.goFrames];
    case "hold":
      return [0, Math.round(t.setupFrames / 2), t.setupFrames + Math.round(t.holdFrames / 3)];
    case "timer":
      return [0, 7, Math.min(mainFrames(t) - 1, 14)];
  }
}
