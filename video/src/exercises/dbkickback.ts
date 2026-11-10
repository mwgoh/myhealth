import { lerp } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { ARMS_DOWN, standOn } from "./helpers";
import { dumbbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 펴기(1초) → 돌아오기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 상체를 25° 숙이고 위팔은 몸통을 따라 뒤로 붙인다(몸통 방향 + 180°, 고정).
// 아래팔만 아래(-90°)에서 위팔과 일직선(-155°)까지 뒤로 편다.
const TORSO = 25;
const UPPER = TORSO + 180 - 360;

export const dbKickback: ExerciseVideoDef = {
  id: "seed-db-kickback",
  timing,
  pose(frame) {
    const fore = lerp(-90, UPPER, repPhase(timing, frame));
    return standOn(
      {
        ...ARMS_DOWN,
        torso: TORSO,
        head: TORSO + 20,
        nearUpperArm: UPPER,
        nearForearm: fore,
        farUpperArm: UPPER + 2,
        farForearm: fore + 2,
        nearThigh: -70,
        nearShin: -100,
        nearFoot: 0,
        farThigh: -70,
        farShin: -100,
        farFoot: 0,
      },
      200,
    );
  },
  props: (_frame, pose) => [...dumbbell(pose.far.hand), ...dumbbell(pose.near.hand, true)],
};
