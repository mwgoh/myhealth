import { clamp, ease, lerp } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { ARM_DOWN_DEG, hinge } from "./kbpickup";
import { kettlebell } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 바닥에서 머리 위까지 한 번에(1.2초) → 맨 위에서 멈춤(0.6초) → 내려놓기(1.2초). 한쪽(가까운 쪽 팔)만 보여준다.
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 36, pauseFrames: 18, returnFrames: 36 };

/** 다리와 엉덩이가 먼저 펴지고(진행의 60%까지), 팔은 조금 늦게 따라 올라간다 */
function phases(frame: number): { body: number; arm: number } {
  const t = repPhase(timing, frame);
  return { body: ease(clamp(t / 0.6, 0, 1)), arm: ease(clamp((t - 0.15) / 0.85, 0, 1)) };
}

export const kbSnatch: ExerciseVideoDef = {
  id: "seed-kb-snatch",
  timing,
  // 머리 위로 뻗은 팔이 제목과 겹치지 않게 줄인다
  scale: 0.8,
  keyFrames: [0, 16, 36],
  pose(frame) {
    const { body, arm } = phases(frame);
    return hinge(body, {
      // 위팔은 뒤로 돌아 올라가고(팔꿈치를 높이 당긴다) 아래팔은 앞으로 돌아 올라가서, 손은 몸 가까이를 곧게 오른다.
      // 뒤쪽으로 돌게 하려고 위(90°) 대신 같은 방향의 -270°를 쓴다.
      nearUpperArm: lerp(ARM_DOWN_DEG, -270, arm),
      nearForearm: lerp(ARM_DOWN_DEG, 90, arm),
    });
  },
  // 벨 몸통은 늘어져 있다가(아래) 팔을 뻗어 올릴 때 손 위를 넘어가 손목 뒤(팔뚝 바깥)에 얹힌다
  props(frame, pose) {
    const { arm } = phases(frame);
    return kettlebell(pose.near.hand, lerp(-90, 180, clamp((arm - 0.5) / 0.5, 0, 1)), true);
  },
};

/** 테스트용 */
export const KB_SNATCH = { TOP_FRAME: timing.goFrames };
