"use client";

import { useSyncExternalStore } from "react";
import type { Store } from "@/domain/types";
import { getBrowserStore } from "@/storage/browser-store";
import type { StoreState, WorkoutStore } from "@/storage/store";

const LOADING: StoreState = { status: "loading" };
const noSubscribe = () => () => {};
const loadingSnapshot = () => LOADING;

export function useStoreState(): StoreState {
  const store = typeof window === "undefined" ? null : getBrowserStore();
  return useSyncExternalStore(
    store ? store.subscribe : noSubscribe,
    store ? store.getState : loadingSnapshot,
    loadingSnapshot,
  );
}

/** StoreGate 안에서만 쓴다 */
export function useReadyStore(): { store: Store; api: WorkoutStore } {
  const state = useStoreState();
  if (state.status !== "ready") throw new Error("저장소가 준비되기 전에 useReadyStore를 불렀습니다");
  return { store: state.store, api: getBrowserStore() };
}
