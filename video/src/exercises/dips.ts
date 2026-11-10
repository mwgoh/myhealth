import { add, armIK, lerp, lerpVec } from "../figure/geometry";
import { repPhase, type RepsTiming } from "../scenes/counter";
import { G, place, pt } from "./helpers";
import { beam } from "./shapes";
import type { ExerciseVideoDef } from "./types";

// 내려가기(2초) → 밀어 오르기(1초)
const timing: RepsTiming = { kind: "reps", reps: 10, goFrames: 60, returnFrames: 30 };

// 평행봉은 몸이 향한 방향과 나란해 옆에서 보면 가로 막대로 보인다. 두 손은 막대 위에 고정한다.
const HANDS = pt(300, G - 250);
// 팔을 편 위 자세 → 어깨가 팔꿈치 높이까지 내려온 아래 자세(가슴 하부를 쓰도록 상체를 앞으로 숙인다)
const TOP = add(HANDS, pt(2, -128));
const BOTTOM = add(HANDS, pt(30, -62));
const ELBOW_BACK = pt(-1, -0.2);

export const dips: ExerciseVideoDef = {
  id: "seed-dips",
  timing,
  scale: 0.85,
  pose(frame) {
    const t = repPhase(timing, frame);
    const p = place(
      {
        torso: lerp(80, 66, t),
        head: lerp(84, 75, t),
        nearUpperArm: -90,
        nearForearm: -90,
        farUpperArm: -90,
        farForearm: -90,
        // 무릎을 굽혀 발을 뒤로 둔다
        nearThigh: -100,
        nearShin: -150,
        nearFoot: -150,
        farThigh: -104,
        farShin: -146,
        farFoot: -146,
      },
      (q) => q.shoulder,
      lerpVec(TOP, BOTTOM, t),
    );
    return armIK(armIK(p, "far", HANDS, ELBOW_BACK), "near", HANDS, ELBOW_BACK);
  },
  props: () => [
    beam(pt(HANDS.x - 80, HANDS.y + 10), pt(HANDS.x - 80, G + 7), 10),
    beam(pt(HANDS.x + 80, HANDS.y + 10), pt(HANDS.x + 80, G + 7), 10),
    beam(pt(HANDS.x - 92, HANDS.y + 10), pt(HANDS.x + 92, HANDS.y + 10), 10, "equipDark"),
  ],
};

/** 테스트용 */
export const DIP_HANDS = HANDS;
