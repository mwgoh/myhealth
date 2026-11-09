import { describe, expect, it } from "vitest";
import { sortNewestFirst } from "./sort";
import type { Workout } from "./types";

const w = (id: string, date: string, createdAt: string): Workout => ({
  id,
  date,
  createdAt,
  entries: [{ id: `${id}-e`, exerciseId: "seed-plank", kind: "timed", sets: [{ seconds: 30 }] }],
});

describe("sortNewestFirst", () => {
  it("날짜 내림차순, 같은 날짜는 createdAt 내림차순이고 원본을 바꾸지 않는다", () => {
    const list = [
      w("a", "2026-11-08", "2026-11-08T01:00:00.000Z"),
      w("b", "2026-11-09", "2026-11-09T01:00:00.000Z"),
      w("c", "2026-11-09", "2026-11-09T09:00:00.000Z"),
    ];
    expect(sortNewestFirst(list).map((x) => x.id)).toEqual(["c", "b", "a"]);
    expect(list.map((x) => x.id)).toEqual(["a", "b", "c"]);
  });
});
