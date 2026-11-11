import { dir, legIK, lerp, lerpVec, poseFromAngles, scale, SEG, sub, type Pose } from "../figure/geometry";
import { STROKE } from "../layout";
import { G, KNEE_FORWARD, onGround, pt } from "./helpers";

// 바닥의 벨을 한 손으로 잡은 자세에서 선 자세까지. 클린 앤 프레스와 스내치가 함께 쓴다.
const NEAR_ANKLE = onGround(230);
const FAR_ANKLE = onGround(224);
// 손잡이(손)에서 벨 몸통 아래끝까지: 몸통 중심 18px + 반지름 15px
const BELL_DROP = 18 + 15;
const FLOOR_TOP = G + STROKE / 2;
/** 바닥에 놓인 벨의 손잡이. 두 발 사이에 있다 */
const HANDLE = pt(NEAR_ANKLE.x + 4, FLOOR_TOP - BELL_DROP);

/** 벨을 잡은 팔의 각도. 편 팔이 수직보다 3° 뒤로 기울어 어깨가 손잡이보다 조금 앞에 온다 */
export const ARM_DOWN_DEG = -93;
const ARM = SEG.upperArm + SEG.forearm;
// 허리를 편 채(몸통 40°) 엉덩이를 뒤로 접는다
const BOTTOM_TORSO = 40;
const BOTTOM_SHOULDER = sub(HANDLE, scale(dir(ARM_DOWN_DEG), ARM));
const BOTTOM_HIP = sub(BOTTOM_SHOULDER, scale(dir(BOTTOM_TORSO), SEG.torso));
const TOP_HIP = pt(NEAR_ANKLE.x + 1, G - 181.4);

type Arms = { nearUpperArm: number; nearForearm: number };

/**
 * s가 0이면 벨을 잡으려고 엉덩이를 접은 자세, 1이면 선 자세다. 두 발은 바닥에 고정한다.
 * 가까운 쪽 팔은 받은 각도대로 두고, 쉬는 팔(먼 쪽)은 늘어뜨린다.
 */
export function hinge(s: number, arms: Arms): Pose {
  const p = poseFromAngles(lerpVec(BOTTOM_HIP, TOP_HIP, s), {
    ...arms,
    torso: lerp(BOTTOM_TORSO, 88, s),
    head: lerp(50, 88, s),
    farUpperArm: lerp(-90, -95, s),
    farForearm: -90,
    nearThigh: -90,
    nearShin: -90,
    nearFoot: 0,
    farThigh: -90,
    farShin: -90,
    farFoot: 0,
  });
  return legIK(legIK(p, "near", NEAR_ANKLE, KNEE_FORWARD, 0), "far", FAR_ANKLE, KNEE_FORWARD, 0);
}

/** 테스트용 */
export const KB_PICKUP = { HANDLE };
