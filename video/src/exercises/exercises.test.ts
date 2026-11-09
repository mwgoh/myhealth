import { describe, expect, it } from "vitest";
import { SEED_EXERCISES } from "../app-data";
import { dist, lowPoints, segments, type Pose, type Vec } from "../figure/geometry";
import { GROUND_Y } from "../layout";
import { mainFrames } from "../scenes/counter";
import { VIDEO_EXERCISES } from "./index";
import type { ExerciseVideoDef } from "./types";

const EPS = 0.01;

function byId(id: string): ExerciseVideoDef {
  const def = VIDEO_EXERCISES.find((d) => d.id === id);
  if (!def) throw new Error(id);
  return def;
}

/** 본 동작의 모든 프레임 자세 */
const allPoses = (def: ExerciseVideoDef): Pose[] => Array.from({ length: mainFrames(def.timing) }, (_, f) => def.pose(f));

function expectSame(points: Vec[]) {
  for (const p of points) expect(dist(p, points[0])).toBeLessThan(EPS);
}

/** 점 p가 a-b 직선에서 벗어난 거리 */
function offLine(p: Vec, a: Vec, b: Vec): number {
  const cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
  return Math.abs(cross) / dist(a, b);
}

describe("종목 정의와 앱 seed", () => {
  it("VIDEO_EXERCISES의 ID는 모두 seed ID이고 중복이 없다", () => {
    const seedIds = new Set(SEED_EXERCISES.map((e) => e.id));
    for (const d of VIDEO_EXERCISES) expect(seedIds.has(d.id)).toBe(true);
    expect(new Set(VIDEO_EXERCISES.map((d) => d.id)).size).toBe(VIDEO_EXERCISES.length);
  });
});

describe.each(VIDEO_EXERCISES.map((d) => [d.id, d] as const))("%s: 모든 프레임", (_id, def) => {
  const poses = allPoses(def);

  it("모든 마디가 정의한 길이다", () => {
    for (const pose of poses) {
      for (const [a, b, len] of segments(pose)) expect(Math.abs(dist(a, b) - len)).toBeLessThan(EPS);
    }
  });

  it("어떤 관절도 바닥 아래로 내려가지 않는다", () => {
    for (const pose of poses) {
      for (const p of lowPoints(pose)) expect(p.y).toBeLessThanOrEqual(GROUND_Y + EPS);
    }
  });
});

describe("종목 제약", () => {
  it("스쿼트: 두 발목과 두 발끝이 바닥에 붙어 있다", () => {
    for (const pose of allPoses(byId("seed-squat"))) {
      for (const p of [pose.near.ankle, pose.far.ankle, pose.near.toe, pose.far.toe]) {
        expect(Math.abs(p.y - GROUND_Y)).toBeLessThan(EPS);
      }
    }
  });

  it("푸시업: 두 손 좌표가 프레임마다 같고, 발끝이 고정된다", () => {
    const poses = allPoses(byId("seed-push-up"));
    expectSame(poses.map((p) => p.near.hand));
    expectSame(poses.map((p) => p.far.hand));
    expectSame(poses.map((p) => p.near.toe));
    for (const p of poses) expect(Math.abs(p.near.hand.y - GROUND_Y)).toBeLessThan(EPS);
  });

  it("플랭크: 팔꿈치와 아래팔이 바닥에 고정되고 발끝이 바닥에 닿는다", () => {
    const poses = allPoses(byId("seed-plank"));
    expectSame(poses.map((p) => p.near.elbow));
    expectSame(poses.map((p) => p.near.hand));
    for (const p of poses) {
      expect(Math.abs(p.near.elbow.y - GROUND_Y)).toBeLessThan(EPS);
      expect(Math.abs(p.near.hand.y - GROUND_Y)).toBeLessThan(EPS);
      expect(Math.abs(p.near.toe.y - GROUND_Y)).toBeLessThan(EPS);
    }
  });

  it("플랭크: 버티는 동안 어깨·엉덩이·발목이 일직선이다(엉덩이 이탈 4px 이하)", () => {
    const def = byId("seed-plank");
    const setup = def.timing.kind === "hold" ? def.timing.setupFrames : 0;
    for (const p of allPoses(def).slice(setup)) {
      expect(offLine(p.hip, p.shoulder, p.near.ankle)).toBeLessThanOrEqual(4);
    }
  });

  it("햄스트링 스트레칭: 앞 발뒤꿈치와 뒤 발목이 바닥에 고정된다", () => {
    const poses = allPoses(byId("seed-hamstring-stretch"));
    expectSame(poses.map((p) => p.near.ankle));
    expectSame(poses.map((p) => p.far.ankle));
    for (const p of poses) {
      expect(Math.abs(p.near.ankle.y - GROUND_Y)).toBeLessThan(EPS);
      expect(Math.abs(p.far.ankle.y - GROUND_Y)).toBeLessThan(EPS);
    }
  });

  it("줄넘기: 착지 때 발이 바닥에 닿고, 공중 꼭대기에서 약 18px 뜬다", () => {
    const poses = allPoses(byId("seed-jump-rope"));
    const lowest = (p: Pose) => Math.max(p.near.toe.y, p.far.toe.y, p.near.ankle.y, p.far.ankle.y);
    const gaps = poses.map((p) => GROUND_Y - lowest(p));
    expect(Math.min(...gaps)).toBeCloseTo(0, 6);
    expect(Math.max(...gaps)).toBeGreaterThan(17);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(18 + EPS);
  });
});
