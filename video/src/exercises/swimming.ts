import { poseFromAngles, rad } from "../figure/geometry";
import { SIZE } from "../layout";
import type { Timing } from "../scenes/counter";
import { pt } from "./helpers";
import type { Shape } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing: Timing = { kind: "timer", frames: 900 };

// 자유형. 몸은 물 위에 엎드려 수평(머리는 오른쪽)이고, 두 팔은 반 바퀴 차이로 계속 돈다.
// 팔: 앞(0°) → 물속으로 당기기(-90°) → 뒤(-180°) → 물 위로 넘기기(90°) → 앞. 다리는 위아래로 찬다.
const WATER_Y = 383;
const HIP = pt(250, WATER_Y + 12);
const STROKE_FRAMES = 40;

export const swimming: ExerciseVideoDef = {
  id: "seed-swimming",
  timing,
  floor: false,
  keyFrames: [0, 10, 20],
  pose(frame) {
    const s = (frame % STROKE_FRAMES) / STROKE_FRAMES;
    const near = -360 * s;
    const far = near - 180;
    // 팔이 수면 아래(사인이 음수)에서 당길 때 팔꿈치를 최대 20° 굽힌다
    const bend = (arm: number) => arm - 20 * Math.max(0, -Math.sin(rad(arm)));
    const kick = Math.sin(2 * Math.PI * 3 * s);
    return poseFromAngles(HIP, {
      torso: 0,
      head: 0,
      nearUpperArm: near,
      nearForearm: bend(near),
      farUpperArm: far,
      farForearm: bend(far),
      nearThigh: 180 + 8 * kick,
      nearShin: 180 + 14 * kick,
      nearFoot: 180 + 18 * kick,
      farThigh: 180 - 8 * kick,
      farShin: 180 - 14 * kick,
      farFoot: 180 - 18 * kick,
    });
  },
  props(frame): Shape[] {
    // 물: 사람 그림 위에 반투명하게 덮어 물속 부분을 흐리게 한다. 수면은 잔물결.
    let d = `M 0 ${WATER_Y}`;
    for (let x = 0; x <= SIZE; x += 20) d += ` L ${x} ${WATER_Y + 4 * Math.sin(x / 40 + frame / 5)}`;
    return [
      { kind: "rect", x: 0, y: WATER_Y, w: SIZE, h: 560 - WATER_Y, fill: "water", opacity: 0.6, front: true },
      { kind: "path", d, stroke: "accent", width: 3, front: true },
    ];
  },
};

/** 테스트용 */
export const SWIM_HIP = HIP;
