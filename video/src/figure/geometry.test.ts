import { describe, expect, it } from "vitest";
import {
  angleOf,
  dist,
  ease,
  lerpAngles,
  poseFromAngles,
  segments,
  solveTwoBone,
  type Angles,
  type Vec,
} from "./geometry";

const A: Angles = {
  torso: 90,
  head: 90,
  nearUpperArm: -90,
  nearForearm: -90,
  farUpperArm: -100,
  farForearm: -80,
  nearThigh: -90,
  nearShin: -90,
  nearFoot: 0,
  farThigh: -85,
  farShin: -95,
  farFoot: 0,
};

describe("poseFromAngles", () => {
  it("모든 마디가 정의한 길이다", () => {
    const pose = poseFromAngles({ x: 100, y: 300 }, { ...A, torso: 37, nearThigh: -123, farShin: 211 });
    for (const [a, b, len] of segments(pose)) expect(dist(a, b)).toBeCloseTo(len, 2);
  });

  it("각도 90은 화면 위쪽이다", () => {
    const pose = poseFromAngles({ x: 0, y: 0 }, A);
    expect(pose.shoulder.x).toBeCloseTo(0, 6);
    expect(pose.shoulder.y).toBeCloseTo(-120, 6);
    expect(pose.near.ankle.y).toBeCloseTo(182, 6);
  });
});

describe("solveTwoBone", () => {
  const root: Vec = { x: 0, y: 0 };

  it("닿는 거리면 끝점이 목표와 같고 마디 길이를 지킨다", () => {
    const target = { x: 80, y: 60 };
    const r = solveTwoBone(root, target, 70, 62, { x: 0, y: -1 });
    expect(r.reached).toBe(true);
    expect(dist(r.end, target)).toBeLessThan(0.5);
    expect(dist(root, r.mid)).toBeCloseTo(70, 2);
    expect(dist(r.mid, r.end)).toBeCloseTo(62, 2);
  });

  it("닿지 않는 거리면 목표 방향으로 쭉 편다", () => {
    const target = { x: 300, y: 0 };
    const r = solveTwoBone(root, target, 70, 62, { x: 0, y: -1 });
    expect(r.reached).toBe(false);
    expect(r.mid.x).toBeCloseTo(70, 6);
    expect(r.mid.y).toBeCloseTo(0, 6);
    expect(r.end.x).toBeCloseTo(132, 6);
    expect(r.end.y).toBeCloseTo(0, 6);
  });

  it("굽는 방향 지정을 따른다", () => {
    const target = { x: 100, y: 0 };
    const up = solveTwoBone(root, target, 70, 62, { x: 0, y: -1 });
    const down = solveTwoBone(root, target, 70, 62, { x: 0, y: 1 });
    expect(up.mid.y).toBeLessThan(0);
    expect(down.mid.y).toBeGreaterThan(0);
  });
});

describe("보간", () => {
  const B: Angles = { ...A, torso: 30, nearThigh: 0 };

  it("ease는 0과 1에서 끝값이고 그 사이는 단조 증가한다", () => {
    expect(ease(0)).toBe(0);
    expect(ease(1)).toBeCloseTo(1, 12);
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      const v = ease(i / 10);
      expect(v).toBeGreaterThan(prev);
      prev = v;
    }
  });

  it("t=0이면 첫 키프레임, t=1이면 마지막 키프레임, 중간값은 그 사이", () => {
    expect(lerpAngles(A, B, 0)).toEqual(A);
    expect(lerpAngles(A, B, 1)).toEqual(B);
    const mid = lerpAngles(A, B, 0.5);
    expect(mid.torso).toBeGreaterThan(30);
    expect(mid.torso).toBeLessThan(90);
  });
});

describe("angleOf", () => {
  it("위쪽은 90도, 오른쪽은 0도", () => {
    expect(angleOf({ x: 0, y: 0 }, { x: 0, y: -10 })).toBeCloseTo(90, 6);
    expect(angleOf({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0, 6);
  });
});
