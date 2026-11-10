import { armIK, deg, legIK, rad, SEG, translate, type Angles, type Pose } from "../figure/geometry";
import type { RepsTiming } from "../scenes/counter";
import { keepAboveFloor, keyOf, KNEE_FORWARD, onGround, place, pt, sampleKeys, STAND, standOn } from "./helpers";
import type { ExerciseVideoDef } from "./types";

// 한 번에 5초: 쪼그려 손 짚기 → 다리 뒤로 → 가슴 바닥 → 밀어 올리기 → 다리 앞으로 → 일어나기 → 점프. 6회.
const REP = 150;
const timing: RepsTiming = { kind: "reps", reps: 6, goFrames: REP, returnFrames: 0 };

const ANKLE_X = 230;
const FAR_ANKLE_X = 224;
// 손을 짚는 자리: 발 앞 75px
const HANDS = onGround(ANKLE_X + 75);
const ELBOW_BACK = pt(-1, -0.6);

const ARMS = { nearUpperArm: -90, nearForearm: -90, farUpperArm: -90, farForearm: -90 };

const handsDown = (p: Pose): Pose => armIK(armIK(p, "far", HANDS, ELBOW_BACK), "near", HANDS, ELBOW_BACK);
const feetDown = (p: Pose): Pose =>
  legIK(legIK(p, "near", onGround(ANKLE_X), KNEE_FORWARD, 0), "far", onGround(FAR_ANKLE_X), KNEE_FORWARD, 0);

// 선 자세
const STANDING = standOn(STAND, ANKLE_X, FAR_ANKLE_X);

// 쪼그려 앉아 손을 발 앞 바닥에 짚는다
const CROUCH_ANGLES: Angles = {
  ...ARMS,
  torso: 10,
  head: -15,
  nearThigh: 0,
  nearShin: -115,
  nearFoot: 0,
  farThigh: 0,
  farShin: -115,
  farFoot: 0,
};
const CROUCH = handsDown(feetDown(place(CROUCH_ANGLES, (q) => q.near.ankle, onGround(ANKLE_X))));

// 팔을 편 플랭크(푸시업 위 자세)와 가슴을 내린 자세. 발끝은 바닥, 손은 HANDS에 둔다.
const FOOT_DEG = 250;
const ANKLE_HEIGHT = SEG.foot * Math.sin(rad(FOOT_DEG - 180));
const BODY = SEG.shin + SEG.thigh + SEG.torso;
const bodyAngleFor = (shoulderHeight: number) => deg(Math.asin((shoulderHeight - ANKLE_HEIGHT) / BODY));
const straight = (theta: number): Angles => ({
  ...ARMS,
  torso: theta,
  head: theta,
  nearThigh: theta + 180,
  nearShin: theta + 180,
  nearFoot: FOOT_DEG,
  farThigh: theta + 180,
  farShin: theta + 180,
  farFoot: FOOT_DEG,
});
const PLANK_THETA = bodyAngleFor(120);
// 손이 어깨보다 35px 뒤에 오도록 발끝 위치를 정한다(푸시업과 같은 손 위치)
const TOE_X = HANDS.x + 35 - (-SEG.foot * Math.cos(rad(FOOT_DEG)) + BODY * Math.cos(rad(PLANK_THETA)));
const PLANK = handsDown(place(straight(PLANK_THETA), (q) => q.near.toe, onGround(TOE_X)));
const CHEST_DOWN = handsDown(place(straight(bodyAngleFor(48)), (q) => q.near.toe, onGround(TOE_X)));

// 점프: 팔을 머리 위로 뻗고 발끝을 내린 채 28px 뜬다
const JUMP = translate(
  standOn({ ...STAND, nearUpperArm: 95, nearForearm: 100, farUpperArm: 92, farForearm: 97, nearFoot: -50, farFoot: -45 }, ANKLE_X, FAR_ANKLE_X),
  pt(0, -28),
);

const KEYS = [
  { at: 0, key: keyOf(STANDING) },
  { at: 18, key: keyOf(CROUCH) },
  { at: 36, key: keyOf(PLANK) },
  { at: 54, key: keyOf(CHEST_DOWN) },
  { at: 72, key: keyOf(PLANK) },
  { at: 90, key: keyOf(CROUCH) },
  { at: 108, key: keyOf(STANDING) },
  { at: 124, key: keyOf(JUMP) },
  { at: 140, key: keyOf(STANDING) },
  { at: REP, key: keyOf(STANDING) },
];
// 구간마다 바닥에 붙여 둘 부위: 발(일어서고 앉는 동안), 손(손을 짚은 동안), 없음(뛰는 동안)
const SEGMENT_FIX: ("feet" | "hands" | null)[] = ["feet", "hands", "hands", "hands", "hands", "feet", null, null, null];

export const burpee: ExerciseVideoDef = {
  id: "seed-burpee",
  timing,
  keyFrames: [18, 54, 124],
  // 점프할 때 머리 위로 뻗은 손이 제목과 겹치지 않게 줄인다
  scale: 0.85,
  pose(frame) {
    const { pose, segment } = sampleKeys(KEYS, frame % REP);
    const fix = SEGMENT_FIX[segment];
    const fixed = fix === "hands" ? handsDown(pose) : fix === "feet" ? feetDown(pose) : pose;
    return keepAboveFloor(fixed);
  },
};

/** 테스트용 */
export const BURPEE_HANDS = HANDS;
