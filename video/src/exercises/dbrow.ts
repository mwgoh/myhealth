import { add, armIK, legIK, lerpVec, poseFromAngles, SEG, step } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, KNEE_FORWARD, onGround, pt } from "./helpers";
import { block, dumbbell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 당기기(1초) → 내리기(2초). 한쪽(가까운 쪽 팔)만 보여준다.
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 30, returnFrames: 60 };

// 먼 쪽 무릎과 손을 벤치에 대고, 가까운 쪽 발은 바닥에 둔다. 상체는 거의 수평(8°).
const BENCH_TOP = G - 70;
const ON_BENCH = BENCH_TOP - 9;
const KNEE = pt(230, ON_BENCH);
const HIP = pt(KNEE.x, KNEE.y - SEG.thigh);
const TORSO = 8;
const SHOULDER = step(HIP, TORSO, SEG.torso);
const HAND = pt(SHOULDER.x, ON_BENCH);
const ANKLE = onGround(KNEE.x - 20);
// 덤벨은 어깨 아래로 늘어뜨린 곳에서 엉덩이 옆까지 당긴다
const HANG = add(SHOULDER, pt(2, 126));
const PULL = add(HIP, pt(24, 10));
const ELBOW_UP_BACK = pt(-1, -1);

const handAt = (frame: number) => lerpVec(HANG, PULL, repPhase(timing, frame));

const BENCH_LEFT = KNEE.x - 130;
const BENCH_RIGHT = SHOULDER.x + 30;
const LEG_H = G + 7 - BENCH_TOP - 14;

export const dbRow: ExerciseVideoDef = {
  id: "seed-db-row",
  timing,
  pose(frame) {
    let p = poseFromAngles(HIP, {
      torso: TORSO,
      head: TORSO - 8,
      nearUpperArm: -90,
      nearForearm: -90,
      farUpperArm: -90,
      farForearm: -90,
      nearThigh: -90,
      nearShin: -90,
      nearFoot: 0,
      // 먼 쪽 무릎은 벤치에, 정강이와 발등은 벤치 위로 눕힌다
      farThigh: -90,
      farShin: 180,
      farFoot: 180,
    });
    p = legIK(p, "near", ANKLE, KNEE_FORWARD, 0);
    p = armIK(p, "far", HAND, pt(-1, 0));
    return armIK(p, "near", handAt(frame), ELBOW_UP_BACK);
  },
  props: (frame) => [
    block(BENCH_LEFT, BENCH_TOP, BENCH_RIGHT - BENCH_LEFT, 14),
    block(BENCH_LEFT + 14, BENCH_TOP + 14, 12, LEG_H, "equipDark"),
    block(BENCH_RIGHT - 26, BENCH_TOP + 14, 12, LEG_H, "equipDark"),
    ...dumbbell(handAt(frame), true),
  ],
};

/** 테스트용 */
export const DB_ROW = { HAND, KNEE, ANKLE };
