import { add, armIK, lerpVec, type Angles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { place, pt } from "./helpers";
import { beam } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 당겨 오르기(1초) → 내려가기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 옆에서 본 철봉은 점으로 보인다. 두 손은 철봉에 고정한다.
const BAR = pt(340, 120);
// 매달린 자세(팔을 거의 편)에서 턱이 철봉 위로 올라오는 자세까지 어깨가 움직인다
const HANG = add(BAR, pt(-6, 127));
const TOP = add(BAR, pt(-18, 14));
const ELBOW = pt(0.6, 1);

// 몸은 살짝 뒤로 기울이고 무릎을 굽혀 발을 뒤로 둔다
const HANGING: Angles = {
  torso: 98,
  head: 92,
  nearUpperArm: 90,
  nearForearm: 90,
  farUpperArm: 90,
  farForearm: 90,
  nearThigh: -80,
  nearShin: -150,
  nearFoot: -120,
  farThigh: -84,
  farShin: -146,
  farFoot: -116,
};

export const pullUp: ExerciseVideoDef = {
  id: "seed-pull-up",
  timing,
  // 철봉 위로 올라오는 머리가 제목과 겹치지 않게 줄인다
  scale: 0.85,
  pose(frame) {
    const p = place(HANGING, (q) => q.shoulder, lerpVec(HANG, TOP, repPhase(timing, frame)));
    return armIK(armIK(p, "far", BAR, ELBOW), "near", BAR, ELBOW);
  },
  props: () => [beam(pt(BAR.x, BAR.y - 160), BAR, 6, "equipDark"), { kind: "circle", c: BAR, r: 10, fill: "equipDark" }],
};

/** 테스트용 */
export const PULL_UP_BAR = BAR;
