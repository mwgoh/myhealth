import { describe, expect, it, vi } from "vitest";
import { createTodayClock } from "./today-clock";

describe("createTodayClock", () => {
  it("같은 날이면 알리지 않고, 날짜가 바뀌면 새 날짜로 알린다", () => {
    let now = new Date(2026, 10, 9, 23, 59);
    const clock = createTodayClock(() => now);
    const listener = vi.fn();
    clock.subscribe(listener);

    expect(clock.get()).toBe("2026-11-09");
    clock.refresh();
    expect(listener).not.toHaveBeenCalled();

    now = new Date(2026, 10, 10, 0, 1);
    clock.refresh();
    expect(clock.get()).toBe("2026-11-10");
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
