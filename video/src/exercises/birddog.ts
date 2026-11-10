import { armIK, lerpAngles, poseFromAngles, swapSides, type Angles } from "../figure/geometry";
import { repIndex, repPhase, type RepsTiming } from "../scenes/counter";
import { allFours, pt } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 뻗기(1초) → 2초 버티기 → 돌아오기(1초). 좌우를 번갈아 8회(좌우 합계).
const timing: RepsTiming = { kind: "reps", reps: 8, goFrames: 30, pauseFrames: 60, returnFrames: 30 };

// 네 발 자세에서 반대쪽 팔(앞)과 다리(뒤)를 뻗는다. 받치는 손과 무릎은 바닥에 고정한다.
const BASE = allFours(240);

const REACH: Angles = {
  ...BASE.angles,
  head: BASE.angles.torso,
  nearUpperArm: 16,
  nearForearm: 16,
  // 넓적다리는 아래(-90°)에서 뒤쪽(-182°)으로 돈다. 178°로 두면 앞쪽으로 크게 돌아간다.
  farThigh: -182,
  farShin: 178,
  // 발끝은 뒤로 편 채 둔다. 아래로 돌리면 다리를 들기 시작할 때 발끝이 바닥을 뚫는다.
  farFoot: 180,
};
const SUPPORT_ELBOW = pt(-1, 0);

export const birdDog: ExerciseVideoDef = {
  id: "seed-bird-dog",
  timing,
  keyFrames: [0, 30, 150],
  pose(frame) {
    const p = poseFromAngles(BASE.hip, lerpAngles(BASE.angles, REACH, repPhase(timing, frame)));
    const supported = armIK(p, "far", BASE.hands, SUPPORT_ELBOW);
    return repIndex(timing, frame) % 2 === 1 ? swapSides(supported) : supported;
  },
};

/** 테스트용 */
export const BIRD_DOG = { KNEE: BASE.knee, HANDS: BASE.hands };
