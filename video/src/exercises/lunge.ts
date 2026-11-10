import { clamp, dir, ease, legIK, lerp, poseFromAngles, scale, SEG, sub, swapSides } from "../figure/geometry";
import { repIndex, repPhase, type RepsTiming } from "../scenes/counter";
import { G, KNEE_FORWARD, pt, STAND } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 앞으로 내딛으며 내려가기(2초) → 밀어서 돌아오기(1초). 좌우를 번갈아 10회(좌우 합계).
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 뒤에 남는 발: 발끝은 바닥에 고정하고, 내려갈수록 뒤꿈치를 든다
const BACK_X = 150;
const BACK_TOE = pt(BACK_X + SEG.foot, G);
const HEEL_UP_DEG = 40;
// 내딛는 발: 뒤 발 옆에서 175px 앞으로, 발을 들어 옮긴다
const FRONT_START = BACK_X - 4;
const FRONT_END = BACK_X + 175;
const STEP_LIFT = 24;
// 엉덩이: 선 자세 → 앞 무릎 90° 근처. 뒤 무릎이 바닥에 닿기 직전(약 5px 위)까지만 내려간다.
const HIP_START = pt(BACK_X + 1, G - 181);
const HIP_END = pt(BACK_X + 83, G - 100);
const BACK_KNEE_DOWN = pt(0.3, 1);

export const lunge: ExerciseVideoDef = {
  id: "seed-lunge",
  timing,
  keyFrames: [0, 60, 150],
  pose(frame) {
    const t = repPhase(timing, frame);
    // 앞발은 진행의 80%에서 땅에 닿고, 엉덩이는 앞으로 먼저(70%) 옮긴 뒤 끝까지 내려간다
    const s = ease(clamp(t / 0.8, 0, 1));
    const front = pt(lerp(FRONT_START, FRONT_END, s), G - STEP_LIFT * Math.sin(Math.PI * s));
    const hip = pt(lerp(HIP_START.x, HIP_END.x, ease(clamp(t / 0.7, 0, 1))), lerp(HIP_START.y, HIP_END.y, t));
    // 뒤꿈치를 들면 발(발목→발끝)이 앞·아래로 기운다: 각도가 음수
    const heel = -HEEL_UP_DEG * t;
    const backAnkle = sub(BACK_TOE, scale(dir(heel), SEG.foot));
    let p = poseFromAngles(hip, STAND);
    p = legIK(p, "near", front, KNEE_FORWARD, 0);
    p = legIK(p, "far", backAnkle, BACK_KNEE_DOWN, heel);
    // 홀수 번째 반복은 다른 다리로 내딛는다
    return repIndex(timing, frame) % 2 === 1 ? swapSides(p) : p;
  },
};

/** 테스트용 */
export const LUNGE = { BACK_TOE, FRONT_END };
