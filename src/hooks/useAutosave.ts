"use client";

import { useCallback, useEffect, useRef } from "react";
import { createDebouncedSaver } from "./debounced-saver";

export type SaveContext = { unmounting: boolean };

type Saver<T> = ReturnType<typeof createDebouncedSaver<T>>;

/**
 * 값이 바뀌면 delayMs 뒤에 저장한다. 화면이 숨겨지거나(visibilitychange, pagehide)
 * 컴포넌트가 사라질 때는 기다리던 저장을 즉시 실행한다. 처음 받은 값은 저장하지 않는다.
 */
export function useAutosave<T>(value: T, save: (v: T, ctx: SaveContext) => void, delayMs = 500) {
  const saveRef = useRef(save);
  const saverRef = useRef<Saver<T> | null>(null);
  const unmountingRef = useRef(false);
  const lastValueRef = useRef(value);

  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  // 저장기는 effect 안에서 만든다. 선언 순서상 아래 값 감시 effect보다 먼저 실행된다.
  useEffect(() => {
    unmountingRef.current = false;
    const saver = createDebouncedSaver<T>((v) => saveRef.current(v, { unmounting: unmountingRef.current }), delayMs);
    saverRef.current = saver;
    const onVisibility = () => {
      if (document.visibilityState === "hidden") saver.flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", saver.flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", saver.flush);
      unmountingRef.current = true;
      saver.flush();
      saverRef.current = null;
    };
  }, [delayMs]);

  useEffect(() => {
    // 개발 모드의 effect 재실행에서 같은 값을 다시 예약하지 않도록 직전 값과 비교한다
    if (Object.is(lastValueRef.current, value)) return;
    lastValueRef.current = value;
    saverRef.current?.schedule(value);
  }, [value]);

  const flush = useCallback(() => saverRef.current?.flush(), []);
  const cancel = useCallback(() => saverRef.current?.cancel(), []);
  return { flush, cancel };
}
