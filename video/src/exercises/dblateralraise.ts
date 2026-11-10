import { lerp } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { onGround, place } from "./helpers";
import { dumbbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 들기(1초) → 내리기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 앞에서 본 그림. 두 팔을 옆으로 어깨 높이까지 든다(팔꿈치를 살짝 굽힘).
// 가까운 쪽(화면 왼쪽) 팔은 아래(-96°)에서 왼쪽 수평(-178°)으로, 먼 쪽 팔은 오른쪽 수평(-2°)으로 돈다.
const ANKLE = onGround(250);

export const dbLateralRaise: ExerciseVideoDef = {
  id: "seed-db-lateral-raise",
  timing,
  view: "front",
  pose(frame) {
    const t = repPhase(timing, frame);
    return place(
      {
        torso: 90,
        head: 90,
        nearUpperArm: lerp(-96, -178, t),
        nearForearm: lerp(-92, -175, t),
        farUpperArm: lerp(-84, -2, t),
        farForearm: lerp(-88, -5, t),
        nearThigh: -96,
        nearShin: -90,
        nearFoot: 180,
        farThigh: -84,
        farShin: -90,
        farFoot: 0,
      },
      (q) => q.near.ankle,
      ANKLE,
    );
  },
  props: (_frame, pose) => [...dumbbell(pose.far.hand, true), ...dumbbell(pose.near.hand, true)],
};
