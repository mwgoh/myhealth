"use client";

import { useSyncExternalStore } from "react";
import { getSession, subscribeSession, type Session } from "@/timer/session";

const none = () => null;

/** 진행 중인 타이머(없으면 null). 서버 렌더링에서는 항상 null */
export function useTimerSession(): Session | null {
  return useSyncExternalStore(subscribeSession, getSession, none);
}
