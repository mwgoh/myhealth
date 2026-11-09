import { describe, expect, it } from "vitest";
import {
  addDays,
  isValidDateStr,
  monthGrid,
  monthRange,
  parseDateStr,
  shiftMonth,
  todayStr,
  toDateStr,
  weekRange,
  weekdayKo,
} from "./date";

describe("date", () => {
  it("테스트 시간대가 Asia/Seoul이다", () => {
    expect(new Date(2026, 0, 1).getTimezoneOffset()).toBe(-540);
  });

  it("toDateStr은 UTC가 아니라 현지 날짜를 쓴다", () => {
    expect(toDateStr(new Date("2026-11-08T15:30:00Z"))).toBe("2026-11-09");
  });

  it("todayStr은 주어진 시각의 현지 날짜다", () => {
    expect(todayStr(new Date(2026, 10, 9, 0, 30))).toBe("2026-11-09");
  });

  it("parseDateStr", () => {
    expect(parseDateStr("2026-11-09")?.getDate()).toBe(9);
    expect(parseDateStr("2026-02-30")).toBeNull();
    expect(parseDateStr("2026-2-3")).toBeNull();
    expect(parseDateStr("")).toBeNull();
  });

  it("isValidDateStr", () => {
    expect(isValidDateStr("2028-02-29")).toBe(true);
    expect(isValidDateStr("2026-02-29")).toBe(false);
  });

  it("addDays는 연도를 넘긴다", () => {
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });

  it("shiftMonth는 말일에서 넘치지 않는다", () => {
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftMonth("2026-01-15", -1)).toBe("2025-12-01");
  });

  it("weekRange는 월요일 시작", () => {
    expect(weekRange("2026-11-09")).toEqual({ start: "2026-11-09", end: "2026-11-15" });
    expect(weekRange("2026-11-15")).toEqual({ start: "2026-11-09", end: "2026-11-15" });
    expect(weekRange("2027-01-01")).toEqual({ start: "2026-12-28", end: "2027-01-03" });
  });

  it("monthRange는 윤년을 처리한다", () => {
    expect(monthRange("2026-02-10")).toEqual({ start: "2026-02-01", end: "2026-02-28" });
    expect(monthRange("2028-02-05").end).toBe("2028-02-29");
  });

  it("monthGrid 2026년 11월", () => {
    const g = monthGrid(2026, 11);
    expect(g).toHaveLength(6);
    expect(g[0]).toEqual([null, null, null, null, null, null, "2026-11-01"]);
    expect(g[1][0]).toBe("2026-11-02");
    expect(g[5]).toEqual(["2026-11-30", null, null, null, null, null, null]);
  });

  it("weekdayKo", () => {
    expect(weekdayKo("2026-11-09")).toBe("월");
    expect(weekdayKo("2026-11-15")).toBe("일");
  });
});
