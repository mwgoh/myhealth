import { dir, legIK, lerp, poseFromAngles, scale, SEG, sub } from "../figure/geometry";
import { G, HOLD_30S, holdState, KNEE_FORWARD, onGround, pt } from "./helpers";
import { block } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing = HOLD_30S;

// 문틀(기둥)에 가까운 쪽 팔을 걸친다: 팔꿈치는 어깨 높이, 아래팔은 기둥을 따라 세운다.
// 몸을 앞으로 기울이면 팔꿈치가 어깨보다 위·뒤에 남아 가슴 앞이 늘어난다.
const POST_X = 160;
const ELBOW = pt(POST_X, G - 296);
const NEAR_ANKLE = onGround(POST_X + 40);
const FAR_ANKLE = onGround(POST_X + 100);

export const chestStretch: ExerciseVideoDef = {
  id: "seed-chest-stretch",
  timing,
  pose(frame) {
    const { t, breath } = holdState(timing, frame);
    // 위팔(어깨→팔꿈치) 방향과 몸통 기울기로 어깨·엉덩이 위치를 거꾸로 구한다. 팔꿈치는 기둥에 고정된다.
    const upper = lerp(180, 165, t);
    const torso = lerp(90, 78, t) + breath;
    const shoulder = sub(ELBOW, scale(dir(upper), SEG.upperArm));
    const hip = sub(shoulder, scale(dir(torso), SEG.torso));
    let p = poseFromAngles(hip, {
      torso,
      head: torso,
      nearUpperArm: upper,
      nearForearm: 90,
      farUpperArm: -95,
      farForearm: -90,
      nearThigh: -90,
      nearShin: -90,
      nearFoot: 0,
      farThigh: -90,
      farShin: -90,
      farFoot: 0,
    });
    p = legIK(p, "near", NEAR_ANKLE, KNEE_FORWARD, 0);
    return legIK(p, "far", FAR_ANKLE, KNEE_FORWARD, 0);
  },
  props: () => [block(POST_X - 26, 150, 16, G + 7 - 150)],
};

/** 테스트용 */
export const CHEST = { ELBOW, NEAR_ANKLE, FAR_ANKLE };
