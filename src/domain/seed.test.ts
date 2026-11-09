import { describe, expect, it } from "vitest";
import { createInitialStore, getGuide, SEED_EXERCISES } from "./seed";
import { parseStore, type Category } from "./types";

const find = (id: string) => SEED_EXERCISES.find((e) => e.id === id);
const ofCategory = (c: Category) => SEED_EXERCISES.filter((e) => e.category === c);

describe("기본 종목", () => {
  it("42개이고 ID가 중복되지 않는다", () => {
    expect(SEED_EXERCISES).toHaveLength(42);
    expect(new Set(SEED_EXERCISES.map((e) => e.id)).size).toBe(42);
  });

  it("분류별 개수", () => {
    expect(ofCategory("strength")).toHaveLength(8);
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
