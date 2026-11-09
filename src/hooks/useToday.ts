"use client";

import { useSyncExternalStore } from "react";
import type { DateStr } from "@/domain/date";
import { createTodayClock } from "./today-clock";

const clock = createTodayClock();

// 탭을 밤새 열어 두었다가 돌아와도 오늘이 바뀌도록, 화면이 다시 보일 때와 1분마다 확인한다
function subscribe(listener: () => void) {
  const off = clock.subscribe(listener);
  const onVisible = () => {
    if (document.visibilityState === "visible") clock.refresh();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("pageshow", clock.refresh);
  window.addEventListener("focus", clock.refresh);
  const timer = setInterval(clock.refresh, 60_000);
  clock.refresh();
  return () => {
    off();
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("pageshow", clock.refresh);
    window.removeEventListener("focus", clock.refresh);
    clearInterval(timer);
  };
}

/** 오늘 날짜("YYYY-MM-DD"). 날짜가 바뀌면 다시 그린다. */
export function useToday(): DateStr {
  return useSyncExternalStore(subscribe, clock.get, clock.get);
}
