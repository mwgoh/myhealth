// 삐 소리(Web Audio API). AudioContext는 이 파일에서만 쓴다.

let ctx: AudioContext | null = null;

/** 브라우저는 사용자가 누른 순간에만 소리를 허용하므로 '시작' 버튼에서 부른다 */
export function unlockAudio(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
}

/** 짧은 삐(880Hz 0.12초)는 3·2·1, 긴 삐(1320Hz 0.4초)는 운동 시작과 끝 */
export function beep(kind: "short" | "long"): void {
  if (!ctx) return;
  const duration = kind === "long" ? 0.4 : 0.12;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = kind === "long" ? 1320 : 880;
  // 딸깍 소리가 나지 않게 아주 짧게 키웠다가 줄인다
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}
