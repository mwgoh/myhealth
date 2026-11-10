import { add, armIK, dir, legIK, lerpAngles, scale, type Angles } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { KNEE_FORWARD, onGround, place, pt } from "./helpers";
import { kettlebell } from "./shapes";
import { SQUAT_BOTTOM, SQUAT_STAND } from "./squat";
import type { ExerciseVideoDef } from "./types";

const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 다리는 바벨 스쿼트와 같고, 두 손으로 벨을 가슴 앞에 붙여 든다
const STAND: Angles = { ...SQUAT_STAND };
const BOTTOM: Angles = { ...SQUAT_BOTTOM, head: 70 };
const ANKLE_X = 230;
const ELBOW_DOWN = pt(0, 1);

export const kbGobletSquat: ExerciseVideoDef = {
  id: "seed-kb-goblet-squat",
  timing,
  pose(frame) {
    const a = lerpAngles(STAND, BOTTOM, repPhase(timing, frame));
    let p = place(a, (q) => q.near.ankle, onGround(ANKLE_X));
    p = legIK(p, "far", onGround(ANKLE_X - 8), KNEE_FORWARD, 0);
    // 가슴 앞: 어깨에서 몸통 앞쪽으로 26px, 몸통을 따라 아래로 30px
    const chest = add(add(p.shoulder, scale(dir(a.torso - 90), 26)), scale(dir(a.torso + 180), 30));
    return armIK(armIK(p, "far", chest, ELBOW_DOWN), "near", chest, ELBOW_DOWN);
  },
  props: (_frame, pose) => kettlebell(pose.near.hand, -90, true),
};
