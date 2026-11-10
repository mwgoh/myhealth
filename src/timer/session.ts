// 진행 중인 타이머 하나(모듈 상태). 실행 화면을 벗어나도 남아 있어 목록의 '이어하기'로 이어간다.
// 새로고침하면 사라진다. 화면은 useSyncExternalStore로 구독한다.
import { buildSegments, cuesBetween, positionAt, totalSec, type Segment, type TimerPlan } from "@/domain/timer";
import { skipNext, skipPrev, type RunState } from "@/domain/timer-run";
import { beep, unlockAudio } from "./beep";
import { speak, speechAvailable, stopSpeaking, subscribeVoices } from "./speech";
import { releaseWakeLock, requestWakeLock, wakeLockSupported } from "./wake-lock";

export type WakeState = "on" | "unsupported" | "denied" | "off";

export type Session = {
  plan: TimerPlan;
  segments: Segment[];
  nameOf: (exerciseId: string) => string;
  run: RunState;
  /** 안내를 마지막으로 확인한 흐른 시간. 이보다 뒤의 안내만 낸다 */
  lastCueMs: number;
  voiceAvailable: boolean;
  voice: boolean;
  beep: boolean;
  wake: WakeState;
};

let session: Session | null = null;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;
let lastNow = 0;

const TICK_MS = 200;

function set(next: Session | null) {
  session = next;
  listeners.forEach((l) => l());
}

export const getSession = (): Session | null => session;

export function subscribeSession(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const sessionDone = (s: Session): boolean => s.run.elapsedMs >= totalSec(s.segments) * 1000;

/** lastCueMs 이후 지금까지의 안내를 낸다 */
function fireCues() {
  const s = session;
  if (!s) return;
  for (const c of cuesBetween(s.segments, s.nameOf, s.lastCueMs, s.run.elapsedMs)) {
    if (c.speech && s.voice) speak(c.speech);
    if (c.beep && s.beep) beep(c.beep);
  }
  set({ ...s, lastCueMs: s.run.elapsedMs });
}

async function holdScreen() {
  if (!wakeLockSupported()) return set(session && { ...session, wake: "unsupported" });
  const ok = await requestWakeLock();
  if (session) set({ ...session, wake: ok ? "on" : "denied" });
}

function stopLoop() {
  if (timer !== null) clearInterval(timer);
  timer = null;
}

function startLoop() {
  stopLoop();
  lastNow = performance.now();
  timer = setInterval(() => tick(performance.now()), TICK_MS);
}

/** 흐른 시간을 실제 시간 차이로 더한다. 화면이 멈췄다 돌아오면 그만큼 한 번에 더해진다. */
export function tick(now: number): void {
  const s = session;
  if (!s || !s.run.running) return;
  const elapsedMs = Math.min(totalSec(s.segments) * 1000, s.run.elapsedMs + (now - lastNow));
  lastNow = now;
  const done = elapsedMs >= totalSec(s.segments) * 1000;
  set({ ...s, run: { elapsedMs, running: !done } });
  fireCues();
  if (done) {
    stopLoop();
    releaseWakeLock();
  }
}

/** '시작' 버튼에서 부른다. 첫 안내를 바로 내야 아이폰이 이후 음성을 허용한다. */
export function startSession(plan: TimerPlan, nameOf: (exerciseId: string) => string): void {
  unlockAudio();
  const voiceAvailable = speechAvailable();
  set({
    plan,
    segments: buildSegments(plan),
    nameOf,
    run: { elapsedMs: 0, running: true },
    lastCueMs: -1,
    voiceAvailable,
    voice: voiceAvailable,
    beep: true,
    wake: "off",
  });
  fireCues();
  startLoop();
  void holdScreen();
}

export function pauseSession(): void {
  const s = session;
  if (!s || !s.run.running) return;
  tick(performance.now());
  stopLoop();
  releaseWakeLock();
  if (session) set({ ...session, run: { ...session.run, running: false }, wake: "off" });
}

export function resumeSession(): void {
  const s = session;
  if (!s || s.run.running || sessionDone(s)) return;
  unlockAudio();
  set({ ...s, run: { ...s.run, running: true }, lastCueMs: s.run.elapsedMs });
  startLoop();
  void holdScreen();
}

/** 구간을 건너뛰면 그 구간의 시작 안내만 낸다 */
export function skip(direction: "next" | "prev"): void {
  const s = session;
  if (!s) return;
  if (s.run.running) tick(performance.now());
  const cur = session!;
  const run = direction === "next" ? skipNext(cur.segments, cur.run) : skipPrev(cur.segments, cur.run);
  const done = run.elapsedMs >= totalSec(cur.segments) * 1000;
  set({ ...cur, run: { ...run, running: run.running && !done }, lastCueMs: run.elapsedMs - 1 });
  lastNow = performance.now();
  fireCues();
  if (done) {
    stopLoop();
    releaseWakeLock();
  }
}

export function stopSession(): void {
  stopLoop();
  releaseWakeLock();
  stopSpeaking();
  set(null);
}

export function setSound(change: { voice?: boolean; beep?: boolean }): void {
  if (!session) return;
  if (change.voice === false) stopSpeaking();
  set({ ...session, voice: session.voiceAvailable ? (change.voice ?? session.voice) : false, beep: change.beep ?? session.beep });
}

/** 지금 구간 정보 */
export function sessionPosition(s: Session) {
  return positionAt(s.segments, s.run.elapsedMs);
}

// 브라우저에서만: 음성 목록이 늦게 오면 음성을 켜고, 화면이 다시 보이면 화면 꺼짐 방지를 다시 요청한다
if (typeof window !== "undefined") {
  subscribeVoices(() => {
    if (session && !session.voiceAvailable && speechAvailable()) set({ ...session, voiceAvailable: true, voice: true });
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && session?.run.running) void holdScreen();
  });
}
