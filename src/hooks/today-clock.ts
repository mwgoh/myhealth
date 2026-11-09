import { todayStr, type DateStr } from "@/domain/date";

/** 오늘 날짜를 들고 있다가, refresh 때 날짜가 바뀌었으면 구독자에게 알린다 */
export function createTodayClock(now: () => Date = () => new Date()) {
  let value: DateStr = todayStr(now());
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    refresh() {
      const next = todayStr(now());
      if (next === value) return;
      value = next;
      listeners.forEach((l) => l());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
