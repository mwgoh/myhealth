import { describe, expect, it } from "vitest";
import { createInitialStore, getGuide, SEED_EXERCISES, syncSeedExercises } from "./seed";
import { parseStore, type Category, type Store } from "./types";

const find = (id: string) => SEED_EXERCISES.find((e) => e.id === id);
const ofCategory = (c: Category) => SEED_EXERCISES.filter((e) => e.category === c);

describe("기본 종목", () => {
  it("52개이고 ID가 중복되지 않는다", () => {
    expect(SEED_EXERCISES).toHaveLength(52);
    expect(new Set(SEED_EXERCISES.map((e) => e.id)).size).toBe(52);
  });

  it("분류별 개수", () => {
    expect(ofCategory("strength")).toHaveLength(7);
    expect(ofCategory("kettlebell")).toHaveLength(5);
    expect(ofCategory("dumbbell")).toHaveLength(6);
    expect(ofCategory("bodyweight")).toHaveLength(9);
    expect(ofCategory("core")).toHaveLength(9);
    expect(ofCategory("stretching")).toHaveLength(10);
    expect(ofCategory("cardio")).toHaveLength(6);
  });

  it("측정 방식", () => {
    expect(find("seed-wall-sit")).toMatchObject({ kind: "timed", category: "bodyweight" });
    expect(find("seed-plank")).toMatchObject({ kind: "timed", category: "core" });
    expect(find("seed-crunch")).toMatchObject({ kind: "reps", category: "core" });
    expect(find("seed-push-up")).toMatchObject({ kind: "reps", category: "bodyweight" });
    expect(ofCategory("stretching").every((e) => e.kind === "timed")).toBe(true);
    expect(ofCategory("strength").every((e) => e.kind === "weighted")).toBe(true);
    expect(ofCategory("kettlebell").every((e) => e.kind === "weighted")).toBe(true);
    expect(ofCategory("dumbbell").every((e) => e.kind === "weighted")).toBe(true);
    // 덤벨컬은 #근력운동에서 #덤벨로 옮겼다(2026-11-10)
    expect(find("seed-dumbbell-curl")).toMatchObject({ kind: "weighted", category: "dumbbell" });
    expect(ofCategory("cardio").every((e) => e.kind === "cardio")).toBe(true);
  });

  it("모든 기본 종목에 가이드가 있다", () => {
    expect(SEED_EXERCISES.every((e) => getGuide(e.id)?.tip)).toBe(true);
  });

  it("가이드 문구는 설계 문서와 같다", () => {
    expect(getGuide("seed-swimming")).toEqual({ target: "심폐·전신", tip: "거리는 km로 적는다 (1500m → 1.5)" });
    expect(getGuide("seed-plank")).toEqual({
      target: "복부 전체",
      tip: "엉덩이가 처지거나 솟지 않게 일직선을 유지한다",
    });
  });

  it("직접 추가한 종목에는 가이드가 없다", () => {
    expect(getGuide("custom-id")).toBeUndefined();
  });

  it("초기 Store는 스키마를 통과하고 매번 새 객체다", () => {
    expect(parseStore(createInitialStore()).ok).toBe(true);
    const a = createInitialStore();
    a.exercises[0].archived = true;
    expect(createInitialStore().exercises[0].archived).toBe(false);
    expect(SEED_EXERCISES[0].archived).toBe(false);
  });
});

describe("#케틀벨·#덤벨 종목 (2026-11-10)", () => {
  it("설계 6절 표의 순서·이름·가이드", () => {
    expect(ofCategory("kettlebell").map((e) => e.id)).toEqual([
      "seed-kb-swing",
      "seed-kb-goblet-squat",
      "seed-kb-deadlift",
      "seed-kb-row",
      "seed-kb-press",
    ]);
    expect(ofCategory("dumbbell").map((e) => e.id)).toEqual([
      "seed-dumbbell-curl",
      "seed-db-shoulder-press",
      "seed-db-bench-press",
      "seed-db-row",
      "seed-db-lateral-raise",
      "seed-db-kickback",
    ]);
    expect(find("seed-kb-swing")?.name).toBe("케틀벨 스윙");
    expect(getGuide("seed-kb-swing")).toEqual({ target: "둔근·햄스트링", tip: "엉덩이를 뒤로 접었다가 힘차게 밀어 벨을 가슴 높이까지 띄운다" });
    expect(getGuide("seed-db-kickback")).toEqual({ target: "삼두", tip: "상체를 숙이고 위팔을 몸통에 붙인 채 팔꿈치를 펴 뒤로 민다" });
  });
});

describe("syncSeedExercises", () => {
  /** 2026-11-09 이전 데이터: 기본 종목 42개, 덤벨컬은 #근력운동 */
  function oldStore(): Store {
    const old = createInitialStore();
    const newIds = new Set(SEED_EXERCISES.filter((e) => e.category === "kettlebell" || (e.category === "dumbbell" && e.id !== "seed-dumbbell-curl")).map((e) => e.id));
    return {
      ...old,
      exercises: old.exercises
        .filter((e) => !newIds.has(e.id))
        .map((e) => (e.id === "seed-dumbbell-curl" ? { ...e, category: "strength" as const } : e)),
    };
  }

  it("빠진 기본 종목을 끝에 더하고, 기존 기본 종목은 분류만 코드에 맞춘다", () => {
    const before = oldStore();
    expect(before.exercises).toHaveLength(42);
    const after = syncSeedExercises(before);
    expect(after.exercises).toHaveLength(52);
    expect(after.exercises.slice(0, 42).map((e) => e.id)).toEqual(before.exercises.map((e) => e.id));
    expect(after.exercises.find((e) => e.id === "seed-dumbbell-curl")?.category).toBe("dumbbell");
  });

  it("이름·측정 방식·숨김은 바꾸지 않는다", () => {
    const before = oldStore();
    before.exercises = before.exercises.map((e) => (e.id === "seed-dumbbell-curl" ? { ...e, name: "내 덤벨컬", archived: true } : e));
    const curl = syncSeedExercises(before).exercises.find((e) => e.id === "seed-dumbbell-curl");
    expect(curl).toMatchObject({ name: "내 덤벨컬", kind: "weighted", archived: true, category: "dumbbell" });
  });

  it("같은 이름(공백·대소문자 무시)의 직접 만든 종목이 있으면 그 기본 종목은 더하지 않는다", () => {
    const before = oldStore();
    before.exercises.push({ id: "mine", name: " 케틀벨 스윙 ", kind: "reps", category: "bodyweight", archived: false });
    const after = syncSeedExercises(before);
    expect(after.exercises.some((e) => e.id === "seed-kb-swing")).toBe(false);
    expect(after.exercises.some((e) => e.id === "seed-kb-press")).toBe(true);
  });

  it("바뀐 것이 없으면 같은 객체를 돌려준다", () => {
    const s = createInitialStore();
    expect(syncSeedExercises(s)).toBe(s);
  });
});
