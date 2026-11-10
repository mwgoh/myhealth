// 기기 음성 합성(Web Speech API). window.speechSynthesis는 이 파일에서만 쓴다.

const synth = (): SpeechSynthesis | null => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : null);

function koreanVoice(): SpeechSynthesisVoice | null {
  return synth()?.getVoices().find((v) => v.lang.toLowerCase().startsWith("ko")) ?? null;
}

/** 한국어 음성이 있는가. 크롬은 음성 목록을 늦게 불러오므로 subscribeVoices로 바뀜을 받는다. */
export const speechAvailable = (): boolean => koreanVoice() !== null;

/** 음성 목록이 바뀌면 알린다 */
export function subscribeVoices(listener: () => void): () => void {
  const s = synth();
  if (!s) return () => {};
  s.addEventListener("voiceschanged", listener);
  return () => s.removeEventListener("voiceschanged", listener);
}

/** 앞 말을 끊고 바로 말한다(밀려서 늦게 나오지 않게) */
export function speak(text: string): void {
  const s = synth();
  const voice = koreanVoice();
  if (!s || !voice) return;
  s.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "ko-KR";
  u.voice = voice;
  u.rate = 1.05;
  s.speak(u);
}

export function stopSpeaking(): void {
  synth()?.cancel();
}
