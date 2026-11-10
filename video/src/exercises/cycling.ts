import { add, armIK, dir, legIK, poseFromAngles, scale, type Vec } from "../figure/geometry";
import type { Timing } from "../scenes/counter";
import { G, pt } from "./helpers";
import { beam, grip, type Shape } from "./shapes";
import type { ExerciseVideoDef } from "./types";

const timing: Timing = { kind: "timer", frames: 900 };

// 실내 자전거. 엉덩이는 안장에, 손은 핸들에 고정하고 발은 페달을 따라 원을 그린다.
// 안장 높이는 페달이 가장 아래일 때 무릎이 살짝 굽는 정도(엉덩이~발목 165px, 다리 길이 182px)다.
const CRANK = pt(270, G - 80);
const CRANK_R = 34;
const HIP = pt(205, G - 215);
const BAR = pt(355, G - 245);
// 한 바퀴 24프레임(분당 75회). 오른쪽을 보고 앉았으므로 화면에서 시계 방향으로 돈다.
const REV = 24;
// 발 앞쪽(볼)이 페달 위에 오도록 발목은 페달보다 뒤·위에 둔다
const ANKLE_FROM_PEDAL = pt(-16, -12);
const FOOT_DEG = -10;
const KNEE_FORWARD = pt(1, -0.6);
const ELBOW_DOWN = pt(0, 1);

const pedal = (deg: number): Vec => add(CRANK, scale(dir(deg), CRANK_R));
const crankDeg = (frame: number) => 90 - (360 * (frame % REV)) / REV;

export const cycling: ExerciseVideoDef = {
  id: "seed-cycling",
  timing,
  keyFrames: [0, 6, 12],
  pose(frame) {
    const a = crankDeg(frame);
    let p = poseFromAngles(HIP, {
      torso: 52,
      head: 70,
      nearUpperArm: 0,
      nearForearm: 0,
      farUpperArm: 0,
      farForearm: 0,
      nearThigh: -60,
      nearShin: -90,
      nearFoot: FOOT_DEG,
      farThigh: -60,
      farShin: -90,
      farFoot: FOOT_DEG,
    });
    p = legIK(p, "far", add(pedal(a + 180), ANKLE_FROM_PEDAL), KNEE_FORWARD, FOOT_DEG);
    p = legIK(p, "near", add(pedal(a), ANKLE_FROM_PEDAL), KNEE_FORWARD, FOOT_DEG);
    return armIK(armIK(p, "far", BAR, ELBOW_DOWN), "near", BAR, ELBOW_DOWN);
  },
  props(frame) {
    const a = crankDeg(frame);
    const flywheel = pt(CRANK.x + 95, CRANK.y + 10);
    const stemBase = pt(BAR.x - 20, BAR.y + 60);
    const pedalBar = (c: Vec): Shape => beam(add(c, pt(-9, 0)), add(c, pt(9, 0)), 6, "equipDark");
    return [
      // 받침과 프레임
      beam(pt(CRANK.x - 110, G + 2), pt(CRANK.x + 150, G + 2), 10, "equipDark"),
      beam(CRANK, pt(CRANK.x - 90, G + 2), 9),
      beam(flywheel, pt(CRANK.x + 130, G + 2), 9),
      { kind: "circle", c: flywheel, r: 38, stroke: "equip", width: 8 },
      beam(add(HIP, pt(2, 14)), CRANK, 9),
      beam(CRANK, stemBase, 9),
      beam(stemBase, BAR, 8),
      beam(add(HIP, pt(-24, 12)), add(HIP, pt(22, 12)), 9, "equipDark"),
      // 크랭크와 페달
      beam(CRANK, pedal(a + 180), 6, "equipDark"),
      pedalBar(pedal(a + 180)),
      beam(CRANK, pedal(a), 6, "equipDark"),
      pedalBar(pedal(a)),
      grip(BAR, 7),
    ];
  },
};

/** 테스트용 */
export const CYCLING = { CRANK, CRANK_R, HIP, BAR, ANKLE_FROM_PEDAL };
