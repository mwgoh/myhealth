import { armIK, legIK, lerp, poseFromAngles, type Angles, type Pose } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, pt } from "./helpers";
import { barbell, block, type Shape } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 벤치 윗면. 누운 몸통(선 두께 18px)의 아래끝이 윗면에 닿도록 관절 중심을 9px 위에 둔다.
const BENCH_TOP = G - 80;
const HIP = pt(190, BENCH_TOP - 9);
const NEAR_ANKLE = pt(98, G);
const FAR_ANKLE = pt(92, G);
const KNEE_UP = pt(0.3, -1);
const ELBOW_DOWN = pt(0, 1);

// 벤치에 누워 머리는 오른쪽, 무릎을 굽혀 두 발을 바닥에 둔다. 팔·다리는 IK로 다시 계산한다.
const LYING: Angles = {
  torso: 0,
  head: 18,
  nearUpperArm: 90,
  nearForearm: 90,
  farUpperArm: 90,
  farForearm: 90,
  nearThigh: 150,
  nearShin: -120,
  nearFoot: 180,
  farThigh: 150,
  farShin: -120,
  farFoot: 180,
};

// 바는 가슴 가운데 위에서 수직으로 오르내린다. 시작은 팔을 편 위쪽이다.
const SHOULDER = poseFromAngles(HIP, LYING).shoulder;
const BAR_X = SHOULDER.x - 20;
const BAR_TOP = SHOULDER.y - 124;
const BAR_BOTTOM = SHOULDER.y - 20;
const barAt = (frame: number) => pt(BAR_X, lerp(BAR_TOP, BAR_BOTTOM, repPhase(timing, frame)));

const LEG_H = G + 7 - BENCH_TOP - 16;

/** 벤치에 누워 두 발을 바닥에 둔 자세(팔은 호출하는 쪽이 IK로 붙인다). 덤벨 벤치프레스도 쓴다. */
export function lyingOnBench(): Pose {
  let p = poseFromAngles(HIP, LYING);
  p = legIK(p, "near", NEAR_ANKLE, KNEE_UP, 180);
  return legIK(p, "far", FAR_ANKLE, KNEE_UP, 180);
}

/** 벤치 판과 다리 */
export const benchShapes = (): Shape[] => [
  block(150, BENCH_TOP, 245, 16),
  block(168, BENCH_TOP + 16, 12, LEG_H, "equipDark"),
  block(365, BENCH_TOP + 16, 12, LEG_H, "equipDark"),
];

/** 테스트용 */
export const BENCH = { HIP, NEAR_ANKLE, FAR_ANKLE };

export const benchPress: ExerciseVideoDef = {
  id: "seed-bench-press",
  timing,
  pose(frame) {
    const bar = barAt(frame);
    const p = armIK(lyingOnBench(), "far", bar, ELBOW_DOWN);
    return armIK(p, "near", bar, ELBOW_DOWN);
  },
  props: (frame) => [...benchShapes(), ...barbell(barAt(frame))],
};
