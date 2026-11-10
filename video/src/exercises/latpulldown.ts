import { add, armIK, lerpVec, poseFromAngles, type Angles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, pt } from "./helpers";
import { beam, block, grip } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 당기기(1초) → 올려 보내기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 의자에 앉아 넓적다리는 수평, 정강이는 수직으로 발을 바닥에 둔다. 상체는 살짝 뒤로 젖힌다.
const HIP = pt(220, G - 90);
const SEATED: Angles = {
  torso: 98,
  head: 90,
  nearUpperArm: 90,
  nearForearm: 90,
  farUpperArm: 90,
  farForearm: 90,
  nearThigh: 0,
  nearShin: -90,
  nearFoot: 0,
  farThigh: 0,
  farShin: -90,
  farFoot: 0,
};
const BASE = poseFromAngles(HIP, SEATED);
// 바는 머리 위(팔을 편 길이)에서 쇄골 앞까지 내린다
const TOP = add(BASE.shoulder, pt(14, -126));
const BOTTOM = add(BASE.shoulder, pt(18, -8));
const PULLEY = pt(TOP.x, G - 380);
const ELBOW_DOWN_BACK = pt(-0.5, 1);

const handleAt = (frame: number) => lerpVec(TOP, BOTTOM, repPhase(timing, frame));

export const latPulldown: ExerciseVideoDef = {
  id: "seed-lat-pulldown",
  timing,
  pose(frame) {
    const h = handleAt(frame);
    return armIK(armIK(BASE, "far", h, ELBOW_DOWN_BACK), "near", h, ELBOW_DOWN_BACK);
  },
  props(frame) {
    const h = handleAt(frame);
    return [
      // 기둥과 위쪽 도르래
      block(124, PULLEY.y - 8, 14, G + 7 - (PULLEY.y - 8), "equipDark"),
      beam(pt(131, PULLEY.y), PULLEY, 8, "equipDark"),
      { kind: "circle", c: PULLEY, r: 11, fill: "equip" },
      { kind: "line", a: PULLEY, b: h, stroke: "equipDark", width: 3 },
      // 의자와 넓적다리 고정 패드
      block(172, G - 81, 96, 14),
      block(212, G - 67, 14, 74, "equipDark"),
      block(286, G - 122, 56, 16),
      grip(h),
    ];
  },
};
