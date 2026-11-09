import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDebouncedSaver } from "./debounced-saver";

describe("createDebouncedSaver", () => {
  const save = vi.fn();
  beforeEach(() => {
    vi.useFakeTimers();
    save.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it("500ms 안에 3번 예약하면 마지막 값으로 1번 저장", () => {
    const s = createDebouncedSaver(save, 500);
    s.schedule(1);
    s.schedule(2);
    s.schedule(3);
    vi.advanceTimersByTime(499);
    expect(save).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(3);
  });

  it("flush는 즉시 저장하고 타이머는 다시 저장하지 않는다", () => {
    const s = createDebouncedSaver(save, 500);
    s.schedule(1);
    s.flush();
    expect(save).toHaveBeenCalledWith(1);
    vi.advanceTimersByTime(1000);
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("예약이 없으면 flush는 아무것도 하지 않는다", () => {
    const s = createDebouncedSaver(save, 500);
    s.flush();
    expect(save).not.toHaveBeenCalled();
  });

  it("cancel 후 flush는 저장하지 않는다", () => {
    const s = createDebouncedSaver(save, 500);
    s.schedule(1);
    s.cancel();
    s.flush();
    vi.advanceTimersByTime(1000);
    expect(save).not.toHaveBeenCalled();
  });
});
