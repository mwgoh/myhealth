import { lerp } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { STAND, standOn } from "./helpers";
import { dumbbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 들어 올리기(1초) → 내리기(2초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

export const dumbbellCurl: ExerciseVideoDef = {
  id: "seed-dumbbell-curl",
  timing,
  pose(frame) {
    const t = repPhase(timing, frame);
    // 위팔은 몸통 옆에 고정하고 아래팔만 앞으로 돌려 올린다
    return standOn(
      {
        ...STAND,
        nearUpperArm: -92,
        nearForearm: lerp(-88, 65, t),
        farUpperArm: -95,
        farForearm: lerp(-90, 62, t),
      },
      240,
    );
  },
  // 먼 쪽 덤벨은 몸 뒤에, 가까운 쪽 덤벨은 손 위에 그린다
  props: (_frame, pose) => [...dumbbell(pose.far.hand), ...dumbbell(pose.near.hand, true)],
};
