import { describe, expect, it } from "vitest";
import { SEED_EXERCISES } from "../app-data";
import { angleOf, dist, lowPoints, SEG, segments, type Pose, type Vec } from "../figure/geometry";
import { GROUND_Y, HEADER_BOTTOM } from "../layout";
import { mainFrames } from "../scenes/counter";
import { BENCH } from "./benchpress";
import { BIRD_DOG } from "./birddog";
import { DB_ROW } from "./dbrow";
import { BURPEE_HANDS } from "./burpee";
import { CALF } from "./calfstretch";
import { CAT_COW } from "./catcow";
import { CHEST } from "./cheststretch";
import { CHILDS_POSE } from "./childspose";
import { CRUNCH } from "./crunch";
import { CYCLING } from "./cycling";
import { DEAD_BUG_HIP } from "./deadbug";
import { DEADLIFT } from "./deadlift";
import { DIP_HANDS } from "./dips";
import { GLUTE_BRIDGE } from "./glutebridge";
import { counterBoxOf, HEAD_INSET, onGround as onGroundAt, pt, toScreen } from "./helpers";
import { HIP_FLEXOR } from "./hipflexor";
import { HOLLOW_HIP } from "./hollowhold";
import { VIDEO_EXERCISES } from "./index";
import { LEG_PRESS } from "./legpress";
import { LEG_RAISE_HIP } from "./legraise";
import { LUNGE } from "./lunge";
import { MOUNTAIN_CLIMBER } from "./mountainclimber";
import { PIGEON } from "./pigeon";
import { PIKE } from "./pikepushup";
import { PULL_UP_BAR } from "./pullup";
import { QUAD_SUPPORT_ANKLE } from "./quadstretch";
import { ROWING } from "./rowing";
import { RUSSIAN_TWIST_HIP } from "./russiantwist";
import { SHOULDER_STRETCH_ANKLE } from "./shoulderstretch";
import { SIDE_PLANK_ELBOW } from "./sideplank";
import { SWIM_HIP } from "./swimming";
import type { ExerciseVideoDef } from "./types";
import { WALL_SIT } from "./wallsit";

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

  it("기본 종목 42개 모두 영상 정의가 있고 순서가 같다", () => {
    expect(VIDEO_EXERCISES.map((d) => d.id)).toEqual(SEED_EXERCISES.map((e) => e.id));
  });

  it("본 동작은 30초 안팎이다(28~33초)", () => {
    for (const d of VIDEO_EXERCISES) {
      const sec = mainFrames(d.timing) / 30;
      expect(sec, d.id).toBeGreaterThanOrEqual(28);
      expect(sec, d.id).toBeLessThanOrEqual(33);
    }
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
      for (const p of lowPoints(pose, HEAD_INSET)) expect(p.y).toBeLessThanOrEqual(GROUND_Y + EPS);
    }
  });

  it("관절과 머리가 카운터·제목 영역에 들어가지 않는다", () => {
    const box = counterBoxOf(def);
    for (const pose of poses) {
      const points = [...lowPoints(pose), { x: pose.head.x, y: pose.head.y - SEG.headR }].map((p) => toScreen(def, p));
      for (const p of points) {
        const inCounter = p.x > box.left && p.x < box.right && p.y > box.top && p.y < box.bottom;
        expect(inCounter, `카운터 영역 (${p.x.toFixed(0)}, ${p.y.toFixed(0)})`).toBe(false);
        expect(p.y, "제목 영역").toBeGreaterThanOrEqual(HEADER_BOTTOM);
      }
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

/** 점이 기대 위치에 붙어 있는지(모든 프레임) */
function expectAt(points: Vec[], at: Vec, label: string) {
  for (const p of points) expect(dist(p, at), label).toBeLessThan(EPS);
}
const onGround = (p: Vec) => Math.abs(p.y - GROUND_Y) < EPS;
const setupOf = (def: ExerciseVideoDef) => (def.timing.kind === "hold" ? def.timing.setupFrames : 0);
/** 버티기 구간의 자세 */
const heldPoses = (id: string) => {
  const def = byId(id);
  return allPoses(def).slice(setupOf(def));
};

describe("종목 제약: #근력운동", () => {
  it("벤치프레스: 엉덩이는 벤치에, 발은 바닥에 고정되고 바는 수직으로 움직인다", () => {
    const poses = allPoses(byId("seed-bench-press"));
    expectSame(poses.map((p) => p.hip));
    for (const p of poses) {
      expect(onGround(p.near.ankle) && onGround(p.far.ankle)).toBe(true);
      expect(dist(p.near.hand, p.far.hand)).toBeLessThan(EPS);
    }
    expectSame(poses.map((p) => pt(p.near.hand.x, 0)));
  });

  it("데드리프트: 바는 발 위를 수직으로 움직이고, 시작할 때 원판이 바닥에 닿는다", () => {
    const poses = allPoses(byId("seed-deadlift"));
    for (const p of poses) {
      expect(Math.abs(p.near.hand.x - DEADLIFT.BAR_X)).toBeLessThan(EPS);
      expect(onGround(p.near.ankle) && onGround(p.far.ankle)).toBe(true);
    }
    expect(Math.abs(poses[0].near.hand.y + DEADLIFT.PLATE_R - DEADLIFT.FLOOR_TOP)).toBeLessThan(0.5);
  });

  it("오버헤드프레스·바벨로우·랫풀다운·덤벨컬: 발이 움직이지 않는다", () => {
    for (const id of ["seed-overhead-press", "seed-barbell-row", "seed-dumbbell-curl", "seed-lat-pulldown"]) {
      const poses = allPoses(byId(id));
      expectSame(poses.map((p) => p.near.ankle));
      expectSame(poses.map((p) => p.far.ankle));
    }
  });

  it("덤벨컬: 팔꿈치를 몸통 옆에 고정한다", () => {
    const poses = allPoses(byId("seed-dumbbell-curl"));
    expectSame(poses.map((p) => p.near.elbow));
    expectSame(poses.map((p) => p.far.elbow));
  });

  it("레그프레스: 엉덩이는 고정되고 발은 레일을 따라 무릎을 다 펴지 않는 범위에서 움직인다", () => {
    const poses = allPoses(byId("seed-leg-press"));
    for (const p of poses) {
      expect(dist(p.hip, LEG_PRESS.HIP)).toBeLessThan(EPS);
      expect(Math.abs(angleOf(LEG_PRESS.HIP, p.near.ankle) - LEG_PRESS.RAIL_DEG)).toBeLessThan(0.01);
      expect(dist(LEG_PRESS.HIP, p.near.ankle)).toBeLessThanOrEqual(LEG_PRESS.EXTENDED + EPS);
    }
  });
});

describe("종목 제약: #맨몸운동", () => {
  it("풀업: 두 손이 철봉에 고정되고, 맨 위에서 턱이 철봉 위로 올라온다", () => {
    const poses = allPoses(byId("seed-pull-up"));
    expectAt(poses.map((p) => p.near.hand), PULL_UP_BAR, "가까운 손");
    expectAt(poses.map((p) => p.far.hand), PULL_UP_BAR, "먼 손");
    const top = poses[30];
    expect(top.head.y + SEG.headR).toBeLessThan(PULL_UP_BAR.y);
  });

  it("딥스: 두 손이 평행봉에 고정되고, 어깨가 팔꿈치보다 아래로 내려가지 않는다", () => {
    const poses = allPoses(byId("seed-dips"));
    expectAt(poses.map((p) => p.near.hand), DIP_HANDS, "가까운 손");
    for (const p of poses) expect(p.shoulder.y).toBeLessThanOrEqual(p.near.elbow.y + EPS);
  });

  it("맨몸 스쿼트: 뒤꿈치를 바닥에 붙인다", () => {
    for (const p of allPoses(byId("seed-air-squat"))) {
      expect(onGround(p.near.ankle) && onGround(p.far.ankle) && onGround(p.near.toe)).toBe(true);
    }
  });

  it("런지: 뒤에 남는 발끝은 바닥에 고정되고, 가장 낮은 지점에서 앞발이 바닥에 닿는다", () => {
    const def = byId("seed-lunge");
    const poses = allPoses(def);
    for (const p of poses) {
      const backToeFixed = dist(p.near.toe, LUNGE.BACK_TOE) < EPS || dist(p.far.toe, LUNGE.BACK_TOE) < EPS;
      expect(backToeFixed).toBe(true);
    }
    // 첫 반복(가까운 쪽 다리)과 둘째 반복(먼 쪽 다리)의 가장 낮은 지점
    expect(dist(poses[60].near.ankle, onGroundAt(LUNGE.FRONT_END))).toBeLessThan(EPS);
    expect(dist(poses[150].far.ankle, onGroundAt(LUNGE.FRONT_END))).toBeLessThan(EPS);
  });

  it("버피: 가슴을 내린 순간 두 손이 바닥의 같은 자리에 있다", () => {
    const p = byId("seed-burpee").pose(54);
    expect(dist(p.near.hand, BURPEE_HANDS)).toBeLessThan(EPS);
    expect(p.shoulder.y).toBeGreaterThan(GROUND_Y - 60);
  });

  it("파이크 푸시업: 발끝과 손이 고정되고, 맨 아래에서 머리가 바닥 가까이 온다", () => {
    const poses = allPoses(byId("seed-pike-push-up"));
    expectAt(poses.map((p) => p.near.toe), PIKE.TOE, "발끝");
    expectAt(poses.map((p) => p.near.hand), PIKE.HANDS, "손");
    expect(GROUND_Y - (poses[60].head.y + SEG.headR)).toBeLessThan(30);
  });

  it("글루트 브릿지: 어깨와 발이 바닥에 고정되고, 맨 위에서 1초 멈춘다", () => {
    const poses = allPoses(byId("seed-glute-bridge"));
    expectAt(poses.map((p) => p.shoulder), GLUTE_BRIDGE.SHOULDER, "어깨");
    expectAt(poses.map((p) => p.near.ankle), GLUTE_BRIDGE.NEAR_ANKLE, "발목");
    expectSame(poses.slice(30, 60).map((p) => p.hip));
    expect(GROUND_Y - poses[30].hip.y).toBeGreaterThan(40);
  });

  it("월싯: 버티는 동안 등이 벽에 붙고 넓적다리가 수평이다", () => {
    for (const p of heldPoses("seed-wall-sit")) {
      expect(Math.abs(p.hip.x - WALL_SIT.BACK_X)).toBeLessThan(EPS);
      expect(Math.abs(p.shoulder.x - WALL_SIT.BACK_X)).toBeLessThan(EPS);
      expect(Math.abs(p.near.knee.y - p.hip.y)).toBeLessThan(0.5);
      expect(dist(p.near.ankle, WALL_SIT.NEAR_ANKLE)).toBeLessThan(EPS);
    }
  });
});

describe("종목 제약: #코어운동", () => {
  it("사이드 플랭크: 팔꿈치가 고정되고, 버티는 동안 일직선이며 위쪽 팔을 하늘로 뻗는다", () => {
    expectAt(allPoses(byId("seed-side-plank")).map((p) => p.near.elbow), SIDE_PLANK_ELBOW, "팔꿈치");
    for (const p of heldPoses("seed-side-plank")) {
      expect(offLine(p.hip, p.shoulder, p.near.ankle)).toBeLessThanOrEqual(4);
      expect(onGround(p.near.ankle)).toBe(true);
      expect(p.far.hand.y).toBeLessThan(p.shoulder.y - 100);
    }
  });

  it("할로우 홀드·레그레이즈·데드버그: 엉덩이(허리)가 바닥에서 뜨지 않는다", () => {
    expectAt(allPoses(byId("seed-hollow-hold")).map((p) => p.hip), HOLLOW_HIP, "할로우 홀드");
    expectAt(allPoses(byId("seed-leg-raise")).map((p) => p.hip), LEG_RAISE_HIP, "레그레이즈");
    expectAt(allPoses(byId("seed-dead-bug")).map((p) => p.hip), DEAD_BUG_HIP, "데드버그");
    for (const id of ["seed-leg-raise", "seed-dead-bug"]) {
      for (const p of allPoses(byId(id))) expect(onGround(p.shoulder), id).toBe(true);
    }
  });

  it("크런치: 엉덩이와 발은 고정되고 어깨만 든다", () => {
    const poses = allPoses(byId("seed-crunch"));
    expectAt(poses.map((p) => p.hip), CRUNCH.HIP, "엉덩이");
    expectAt(poses.map((p) => p.near.ankle), CRUNCH.NEAR_ANKLE, "발목");
    expect(GROUND_Y - poses[30].shoulder.y).toBeGreaterThan(40);
  });

  it("버드독: 받치는 손과 무릎은 바닥에 고정되고 좌우를 번갈아 뻗는다", () => {
    const poses = allPoses(byId("seed-bird-dog"));
    for (const p of poses) {
      const handDown = dist(p.near.hand, BIRD_DOG.HANDS) < EPS || dist(p.far.hand, BIRD_DOG.HANDS) < EPS;
      const kneeDown = dist(p.near.knee, BIRD_DOG.KNEE) < EPS || dist(p.far.knee, BIRD_DOG.KNEE) < EPS;
      expect(handDown && kneeDown).toBe(true);
    }
    // 첫 반복은 가까운 쪽 팔, 둘째 반복은 먼 쪽 팔을 앞으로 뻗는다
    expect(poses[60].near.hand.y).toBeLessThan(GROUND_Y - 100);
    expect(poses[180].far.hand.y).toBeLessThan(GROUND_Y - 100);
  });

  it("러시안 트위스트: 엉덩이로 앉아 발이 바닥에서 떠 있다", () => {
    for (const p of allPoses(byId("seed-russian-twist"))) {
      expect(dist(p.hip, RUSSIAN_TWIST_HIP)).toBeLessThan(EPS);
      expect(p.near.toe.y).toBeLessThan(GROUND_Y - 10);
    }
  });

  it("마운틴 클라이머: 손이 고정되고, 받치는 발은 그대로이며 당긴 무릎이 가슴 쪽으로 온다", () => {
    const poses = allPoses(byId("seed-mountain-climber"));
    for (const p of poses) {
      expect(dist(p.near.hand, MOUNTAIN_CLIMBER.HANDS)).toBeLessThan(EPS);
      const support = dist(p.near.ankle, MOUNTAIN_CLIMBER.BACK_ANKLE) < EPS || dist(p.far.ankle, MOUNTAIN_CLIMBER.BACK_ANKLE) < EPS;
      expect(support).toBe(true);
    }
    expect(poses[20].near.knee.x).toBeGreaterThan(poses[20].hip.x + 60);
  });
});

describe("종목 제약: #스트레칭", () => {
  it("대퇴사두 스트레칭: 받치는 발은 고정되고, 버티는 동안 손이 발목을 잡는다", () => {
    expectAt(allPoses(byId("seed-quad-stretch")).map((p) => p.far.ankle), QUAD_SUPPORT_ANKLE, "받치는 발");
    for (const p of heldPoses("seed-quad-stretch")) expect(dist(p.near.hand, p.near.ankle)).toBeLessThan(5);
  });

  it("고관절 굴곡근 스트레칭: 뒤 무릎과 앞 발이 바닥에 고정된다", () => {
    const poses = allPoses(byId("seed-hip-flexor-stretch"));
    expectAt(poses.map((p) => p.far.knee), HIP_FLEXOR.BACK_KNEE, "뒤 무릎");
    expectAt(poses.map((p) => p.near.ankle), HIP_FLEXOR.FRONT_ANKLE, "앞 발목");
  });

  it("비둘기 자세: 엉덩이와 두 무릎이 고정되고, 버티는 동안 손이 앞 바닥을 짚는다", () => {
    const poses = allPoses(byId("seed-pigeon-pose"));
    expectAt(poses.map((p) => p.hip), PIGEON.HIP, "엉덩이");
    for (const p of poses) expect(onGround(p.near.knee) && onGround(p.far.knee)).toBe(true);
    for (const p of heldPoses("seed-pigeon-pose")) expect(dist(p.near.hand, PIGEON.FLOOR)).toBeLessThan(EPS);
  });

  it("종아리 스트레칭: 뒤 발뒤꿈치가 바닥에 붙고, 버티는 동안 손이 벽에 닿는다", () => {
    const poses = allPoses(byId("seed-calf-stretch"));
    for (const p of poses) expect(onGround(p.near.ankle) && onGround(p.near.toe)).toBe(true);
    expectAt(poses.map((p) => p.far.ankle), CALF.FRONT_ANKLE, "앞 발목");
    for (const p of heldPoses("seed-calf-stretch")) expect(dist(p.near.hand, CALF.HANDS)).toBeLessThan(EPS);
  });

  it("가슴 스트레칭: 팔꿈치와 아래팔이 문틀에 고정된다", () => {
    const poses = allPoses(byId("seed-chest-stretch"));
    expectAt(poses.map((p) => p.near.elbow), CHEST.ELBOW, "팔꿈치");
    expectSame(poses.map((p) => p.near.hand));
    expectAt(poses.map((p) => p.near.ankle), CHEST.NEAR_ANKLE, "뒤 발목");
    expectAt(poses.map((p) => p.far.ankle), CHEST.FAR_ANKLE, "앞 발목");
  });

  it("어깨 스트레칭: 버티는 동안 팔이 가슴 앞을 수평으로 가로지르고 다른 손이 걸어 당긴다", () => {
    expectAt(allPoses(byId("seed-shoulder-stretch")).map((p) => p.near.ankle), SHOULDER_STRETCH_ANKLE, "발목");
    for (const p of heldPoses("seed-shoulder-stretch")) {
      expect(Math.abs(p.near.hand.y - p.shoulder.y)).toBeLessThan(2);
      expect(dist(p.far.hand, p.near.elbow)).toBeLessThan(15);
    }
  });

  it("삼두 스트레칭: 버티는 동안 팔꿈치가 머리 옆 위에 있고 다른 손이 누른다", () => {
    for (const p of heldPoses("seed-triceps-stretch")) {
      expect(p.near.elbow.y).toBeLessThan(p.neck.y);
      expect(dist(p.far.hand, p.near.elbow)).toBeLessThan(10);
    }
  });

  it("고양이-소 자세: 손과 무릎이 고정되고 등이 위아래로 휜다", () => {
    const poses = allPoses(byId("seed-cat-cow"));
    expectAt(poses.map((p) => p.near.hand), CAT_COW.HANDS, "손");
    expectAt(poses.map((p) => p.near.knee), CAT_COW.KNEE, "무릎");
    const bends = poses.map((p) => p.spineBend ?? 0);
    expect(Math.min(...bends)).toBeLessThan(-10);
    expect(Math.max(...bends)).toBeGreaterThan(10);
  });

  it("아이 자세: 무릎이 고정되고, 버티는 동안 엉덩이가 뒤꿈치 쪽으로 내려가고 손이 앞 바닥을 짚는다", () => {
    const poses = allPoses(byId("seed-childs-pose"));
    expectAt(poses.map((p) => p.near.knee), CHILDS_POSE.KNEE, "무릎");
    for (const p of heldPoses("seed-childs-pose")) {
      expect(GROUND_Y - p.hip.y).toBeLessThan(30);
      expect(dist(p.near.hand, CHILDS_POSE.FLOOR)).toBeLessThan(EPS);
    }
  });
});

describe("종목 제약: #유산소", () => {
  it("러닝·걷기: 발이 바닥에 닿고, 러닝만 두 발이 함께 뜨는 순간이 있다", () => {
    const lowest = (p: Pose) => Math.max(p.near.toe.y, p.far.toe.y, p.near.ankle.y, p.far.ankle.y);
    const runGaps = allPoses(byId("seed-running")).map((p) => GROUND_Y - lowest(p));
    const walkGaps = allPoses(byId("seed-walking")).map((p) => GROUND_Y - lowest(p));
    expect(Math.min(...runGaps)).toBeCloseTo(0, 6);
    expect(Math.max(...runGaps)).toBeGreaterThan(4);
    expect(Math.max(...walkGaps)).toBeCloseTo(0, 6);
  });

  it("사이클: 엉덩이는 안장에, 손은 핸들에 고정되고 발은 페달 원을 따라 돈다", () => {
    for (const p of allPoses(byId("seed-cycling"))) {
      expect(dist(p.hip, CYCLING.HIP)).toBeLessThan(EPS);
      expect(dist(p.near.hand, CYCLING.BAR)).toBeLessThan(EPS);
      const pedal = pt(p.near.ankle.x - CYCLING.ANKLE_FROM_PEDAL.x, p.near.ankle.y - CYCLING.ANKLE_FROM_PEDAL.y);
      expect(Math.abs(dist(pedal, CYCLING.CRANK) - CYCLING.CRANK_R)).toBeLessThan(EPS);
    }
  });

  it("로잉: 발은 발판에, 엉덩이는 의자 높이에 있고 손잡이는 수평으로 움직인다", () => {
    for (const p of allPoses(byId("seed-rowing"))) {
      expect(dist(p.near.ankle, ROWING.ANKLE)).toBeLessThan(EPS);
      expect(Math.abs(p.hip.y - ROWING.SEAT_Y)).toBeLessThan(EPS);
      expect(Math.abs(p.near.hand.y - ROWING.HANDLE_Y)).toBeLessThan(EPS);
    }
  });

  it("수영: 몸통은 수평으로 떠 있고 팔이 한 바퀴씩 돈다", () => {
    const poses = allPoses(byId("seed-swimming"));
    expectAt(poses.map((p) => p.hip), SWIM_HIP, "엉덩이");
    const handYs = poses.slice(0, 40).map((p) => p.near.hand.y - p.shoulder.y);
    expect(Math.min(...handYs)).toBeLessThan(-100);
    expect(Math.max(...handYs)).toBeGreaterThan(100);
  });
});

describe("종목 제약: #케틀벨·#덤벨", () => {
  const ankles = (id: string) => {
    const poses = allPoses(byId(id));
    expectSame(poses.map((p) => p.near.ankle));
    expectSame(poses.map((p) => p.far.ankle));
    for (const p of poses) expect(onGround(p.near.ankle) && onGround(p.far.ankle), id).toBe(true);
    return poses;
  };

  it("선 자세 종목은 두 발목이 바닥에 고정된다", () => {
    for (const id of ["seed-kb-swing", "seed-kb-goblet-squat", "seed-kb-deadlift", "seed-kb-row", "seed-kb-press", "seed-db-shoulder-press", "seed-db-lateral-raise", "seed-db-kickback"]) {
      ankles(id);
    }
  });

  it("케틀벨 스윙: 맨 위에서 벨(손)이 가슴 높이까지 온다", () => {
    const top = byId("seed-kb-swing").pose(30);
    expect(Math.abs(top.near.hand.y - top.shoulder.y)).toBeLessThan(30);
    expect(top.near.hand.x).toBeGreaterThan(top.shoulder.x + 100);
  });

  it("고블릿 스쿼트: 벨을 가슴 앞에 붙이고 앉는다", () => {
    for (const p of allPoses(byId("seed-kb-goblet-squat"))) expect(dist(p.near.hand, p.shoulder)).toBeLessThan(70);
  });

  it("케틀벨 데드리프트: 시작할 때 벨 몸통 아래끝이 바닥에 닿는다", () => {
    const p = byId("seed-kb-deadlift").pose(0);
    // 손잡이(손)에서 몸통 중심까지 18px, 몸통 반지름 15px, 바닥선 위끝은 GROUND_Y + 7
    expect(Math.abs(p.near.hand.y + 18 + 15 - (GROUND_Y + 7))).toBeLessThan(0.5);
  });

  it("케틀벨 원암 로우: 받치는 손은 무릎 위에 있다", () => {
    for (const p of ankles("seed-kb-row")) expect(dist(p.far.hand, p.far.knee)).toBeLessThan(20);
  });

  it("덤벨 벤치프레스: 엉덩이와 두 발이 고정된다", () => {
    const poses = allPoses(byId("seed-db-bench-press"));
    expectAt(poses.map((p) => p.hip), BENCH.HIP, "엉덩이");
    expectAt(poses.map((p) => p.near.ankle), BENCH.NEAR_ANKLE, "발목");
  });

  it("원암 덤벨 로우: 받치는 손과 무릎은 벤치에, 선 발은 바닥에 고정된다", () => {
    const poses = allPoses(byId("seed-db-row"));
    expectAt(poses.map((p) => p.far.hand), DB_ROW.HAND, "받치는 손");
    expectAt(poses.map((p) => p.far.knee), DB_ROW.KNEE, "받치는 무릎");
    expectAt(poses.map((p) => p.near.ankle), DB_ROW.ANKLE, "선 발");
  });

  it("덤벨 래터럴 레이즈: 맨 위에서 두 손이 어깨 높이(±10px)", () => {
    const top = byId("seed-db-lateral-raise").pose(30);
    expect(Math.abs(top.near.hand.y - top.shoulder.y)).toBeLessThanOrEqual(10);
    expect(Math.abs(top.far.hand.y - top.shoulder.y)).toBeLessThanOrEqual(10);
  });

  it("덤벨 킥백: 위팔(팔꿈치)이 고정되고 아래팔만 뒤로 편다", () => {
    const poses = allPoses(byId("seed-db-kickback"));
    expectSame(poses.map((p) => p.near.elbow));
    expectSame(poses.map((p) => p.far.elbow));
  });
});
