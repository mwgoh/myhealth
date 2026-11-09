import { ease, legIK, lerp, lerpVec, poseFromAngles, type Vec } from "../figure/geometry";
import { GROUND_Y } from "../layout";
import type { Timing } from "../scenes/counter";
import type { ExerciseVideoDef } from "./types";

const timing = { kind: "hold", setupFrames: 60, holdFrames: 900 } as const satisfies Timing;

// 기준점: 먼 쪽(뒤) 발목. 가까운 쪽(앞) 다리는 앞으로 뻗어 발뒤꿈치를 바닥에 붙이고 발끝을 든다.
const BACK_ANKLE: Vec = { x: 190, y: GROUND_Y };
const FRONT_ANKLE: Vec = { x: 310, y: GROUND_Y };
const FRONT_FOOT_DEG = 70;

// 숙이면서 엉덩이를 뒤로 뺀다. 두 위치 모두 앞 발목까지 약 181px로, 다리 길이(182px)보다 조금 짧아
// 앞다리가 거의 펴진다. 그 사이 직선 위의 점도 닿는 거리 안에 있다.
const HIP_START: Vec = { x: BACK_ANKLE.x + 45, y: GROUND_Y - 165 };
const HIP_END: Vec = { x: BACK_ANKLE.x + 25, y: GROUND_Y - 154 };
const TORSO_START = 88;
const TORSO_END = 38;

const BACK_KNEE: Vec = { x: 1, y: 0 };
const FRONT_KNEE: Vec = { x: 0.2, y: -1 };

// 숨쉬기: 몸통 각도 ±0.6°, 4초 주기
const BREATH_DEG = 0.6;
const BREATH_FRAMES = 120;

export const hamstring: ExerciseVideoDef = {
  id: "seed-hamstring-stretch",
  timing,
  pose(frame) {
    const setup = timing.setupFrames;
    const t = frame < setup ? ease(frame / setup) : 1;
    const breath = frame < setup ? 0 : BREATH_DEG * Math.sin((2 * Math.PI * (frame - setup)) / BREATH_FRAMES);
    const torso = lerp(TORSO_START, TORSO_END, t) + breath;
    // 다리 각도는 IK로 다시 계산하므로 아무 값이나 둔다. 팔은 아래로 늘어뜨린다.
    let p = poseFromAngles(lerpVec(HIP_START, HIP_END, t), {
      torso,
      head: torso + 8,
      nearUpperArm: -92,
      nearForearm: -88,
      farUpperArm: -96,
      farForearm: -90,
      nearThigh: -90,
      nearShin: -90,
      nearFoot: 0,
      farThigh: -90,
      farShin: -90,
      farFoot: 0,
    });
    p = legIK(p, "far", BACK_ANKLE, BACK_KNEE, 0);
    return legIK(p, "near", FRONT_ANKLE, FRONT_KNEE, FRONT_FOOT_DEG);
  },
};
