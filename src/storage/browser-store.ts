import { createWorkoutStore, STORAGE_KEY, type StorageLike, type WorkoutStore } from "./store";

let instance: WorkoutStore | null = null;

/** 브라우저 localStorage에 연결된 저장소 하나. 서버(빌드)에서는 부르지 않는다. */
export function getBrowserStore(): WorkoutStore {
  if (instance) return instance;
  // localStorage 속성 접근 자체가 예외를 던지는 환경이 있어 호출 시점까지 미룬다
  const storage: StorageLike = {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  };
  const store = createWorkoutStore(storage);
  // 다른 탭이 바꾼 내용을 다시 읽는다. key가 null이면 다른 탭에서 전체를 지운 경우다.
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) store.load();
  });
  instance = store;
  return store;
}
