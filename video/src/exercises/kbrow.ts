import { add, armIK, legIK, lerpVec, poseFromAngles, type Pose } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, KNEE_FORWARD, onGround, pt } from "./helpers";
import { kettlebell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 당기기(1초) → 내리기(2초). 한쪽(가까운 쪽 팔)만 보여준다.
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 먼 쪽 다리를 앞에 두고 무릎을 굽힌 엇갈린 자세. 먼 쪽 손은 앞 무릎을 짚는다.
// 상체를 45°까지만 숙이면 손이 무릎에 닿지 않아(약 179px > 팔 132px) 32°로 숙인다.
const X = 200;
const HIP = pt(X, G - 150);
const FRONT_ANKLE = onGround(X + 60);
const BACK_ANKLE = onGround(X - 40);
const TORSO = 32;
const ELBOW_UP_BACK = pt(-1, -1);

function base(): Pose {
  let p = poseFromAngles(HIP, {
    torso: TORSO,
    head: TORSO + 15,
    nearUpperArm: -90,
    nearForearm: -90,
    farUpperArm: -90,
    farForearm: -90,
    nearThigh: -100,
    nearShin: -100,
    nearFoot: 0,
    farThigh: -60,
    farShin: -90,
    farFoot: 0,
  });
  p = legIK(p, "far", FRONT_ANKLE, KNEE_FORWARD, 0);
  p = legIK(p, "near", BACK_ANKLE, KNEE_FORWARD, 0);
  return armIK(p, "far", add(p.far.knee, pt(-4, -8)), pt(-0.3, 1));
}
const BASE = base();
// 벨은 어깨 아래로 늘어뜨린 곳에서 엉덩이 옆까지 당긴다
const HANG = add(BASE.shoulder, pt(4, 128));
const PULL = add(BASE.hip, pt(28, -12));

const handAt = (frame: number) => lerpVec(HANG, PULL, repPhase(timing, frame));

export const kbRow: ExerciseVideoDef = {
  id: "seed-kb-row",
  timing,
  pose: (frame) => armIK(BASE, "near", handAt(frame), ELBOW_UP_BACK),
  props: (frame) => kettlebell(handAt(frame), -90, true),
};
