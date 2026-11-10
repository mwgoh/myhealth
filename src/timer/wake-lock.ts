// 화면 꺼짐 방지(Screen Wake Lock API). navigator.wakeLock은 이 파일에서만 쓴다.

let sentinel: WakeLockSentinel | null = null;

export const wakeLockSupported = (): boolean => typeof navigator !== "undefined" && "wakeLock" in navigator;

/** 화면이 꺼지지 않게 한다. 지원하지 않거나 거부되면 false. 화면이 숨겨지면 브라우저가 풀어 버리므로 다시 보일 때 또 부른다. */
export async function requestWakeLock(): Promise<boolean> {
  if (!wakeLockSupported()) return false;
  try {
    sentinel = await navigator.wakeLock.request("screen");
    return true;
  } catch {
    return false;
  }
}

export function releaseWakeLock(): void {
  void sentinel?.release();
  sentinel = null;
}
