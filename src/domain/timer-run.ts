import { positionAt, totalSec, type Segment } from "./timer";

/** 실행 상태: 시작 후 흐른 시간(일시정지 중에는 늘지 않는다)과 실행 여부 */
export type RunState = { elapsedMs: number; running: boolean };

/** 지금 구간 끝(다음 구간 시작)으로 건너뛴다. 마지막 구간이면 끝으로. */
export function skipNext(segments: readonly Segment[], s: RunState): RunState {
  const pos = positionAt(segments, s.elapsedMs);
  if (pos.done) return { ...s, elapsedMs: totalSec(segments) * 1000 };
  const seg = segments[pos.segmentIndex];
  return { ...s, elapsedMs: (seg.startSec + seg.sec) * 1000 };
}

/** 구간 시작 후 2초 안이면 앞 구간 시작으로, 아니면 지금 구간 시작으로. 끝난 뒤면 마지막 구간 시작으로. */
export function skipPrev(segments: readonly Segment[], s: RunState): RunState {
  const pos = positionAt(segments, s.elapsedMs);
  const start = segments[pos.segmentIndex].startSec * 1000;
  if (!pos.done && s.elapsedMs - start < 2000 && pos.segmentIndex > 0) {
    return { ...s, elapsedMs: segments[pos.segmentIndex - 1].startSec * 1000 };
  }
  return { ...s, elapsedMs: start };
}
