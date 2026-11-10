"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatDuration } from "@/domain/format";
import { formatClock, TIMER_PRESETS, timerSummary, totalSec, type SegmentKind, type TimerPlan } from "@/domain/timer";
import { guideVideoSrc } from "@/domain/videos";
import { useReadyStore } from "@/hooks/useStore";
import { useTimerSession } from "@/hooks/useTimerSession";
import {
  pauseSession,
  resumeSession,
  sessionDone,
  sessionPosition,
  setSound,
  skip,
  startSession,
  stopSession,
  type Session,
} from "@/timer/session";
import { ConfirmDialog } from "./ConfirmDialog";
import { GuideVideo } from "./ExerciseGuide";
import { useExerciseNames } from "./TimerList";

// 구간 배경색: 준비 = 코어 노랑, 운동 = 근력 빨강, 휴식 = 스트레칭 초록(설계 4절)
const KIND_BG: Record<SegmentKind, string> = {
  prep: "bg-cat-core/20",
  work: "bg-cat-strength/20",
  rest: "bg-cat-stretching/20",
  roundRest: "bg-cat-stretching/20",
};

const KIND_LABEL: Record<SegmentKind, string> = { prep: "준비", work: "운동", rest: "휴식", roundRest: "라운드 휴식" };

// 실행 화면을 떠나면(뒤로 가기·주소 변경) 일시정지한다. 개발 모드의 StrictMode는 effect를 정리했다가
// 곧바로 다시 실행하므로, 일시정지를 한 박자 미뤄 두고 다시 실행되면 취소한다.
let pendingPause: ReturnType<typeof setTimeout> | null = null;

function usePauseOnLeave() {
  useEffect(() => {
    if (pendingPause !== null) clearTimeout(pendingPause);
    pendingPause = null;
    return () => {
      pendingPause = setTimeout(() => {
        pendingPause = null;
        pauseSession();
      }, 0);
    };
  }, []);
}

/** 타이머 실행 화면. 화면 전체를 덮고 아래쪽 탭을 가린다 */
export function TimerRun({ planId }: { planId: string }) {
  const router = useRouter();
  const { store } = useReadyStore();
  const session = useTimerSession();
  const nameOf = useExerciseNames();
  const [confirmStop, setConfirmStop] = useState(false);
  const [closing, setClosing] = useState(false);
  usePauseOnLeave();

  const active = session && session.plan.id === planId ? session : null;
  const plan = active?.plan ?? [...TIMER_PRESETS, ...(store.timers ?? [])].find((p) => p.id === planId);

  // 시작·계속은 클릭 처리기 안에서 부른다(아이폰은 사용자 조작 안에서 첫 소리를 내야 이후 소리를 허용한다)
  const start = (p: TimerPlan) => startSession(p, nameOf);
  const close = () => {
    setClosing(true);
    stopSession();
    router.replace("/timer");
  };

  if (closing) return <div className="fixed inset-0 z-40 bg-bg" />;

  if (!plan) {
    return (
      <main className="mx-auto max-w-md px-4 pt-10">
        <p className="text-lg font-bold">타이머를 찾을 수 없습니다</p>
        <Link href="/timer" className="mt-4 inline-flex min-h-11 items-center font-semibold underline">
          목록으로
        </Link>
      </main>
    );
  }

  if (!active) {
    const other = session && !sessionDone(session) ? session : null;
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
        <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10 text-center">
          <h1 className="text-3xl font-extrabold">{plan.name}</h1>
          <p className="mt-2 text-muted">{timerSummary(plan)}</p>
          {plan.exerciseIds.length > 0 && <p className="mt-2">{plan.exerciseIds.map(nameOf).join(" → ")}</p>}
          {other && <p className="mt-4 text-sm text-danger">진행 중인 &lsquo;{other.plan.name}&rsquo;은(는) 끝납니다.</p>}
          <button type="button" onClick={() => start(plan)} className="mt-8 min-h-14 rounded-2xl bg-ink text-lg font-bold text-bg">
            시작
          </button>
          <Link href="/timer" className="mt-3 inline-flex min-h-11 items-center justify-center font-semibold text-muted">
            목록으로
          </Link>
        </main>
      </div>
    );
  }

  if (sessionDone(active)) {
    const minutes = Math.max(1, Math.round(totalSec(active.segments) / 60));
    return (
      <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
        <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-10 text-center">
          <p className="text-4xl font-extrabold" role="status">
            운동 끝
          </p>
          <p className="mt-2 text-lg text-muted">
            {plan.name} · 총 {formatDuration(minutes)}
          </p>
          <div className="mt-8 flex gap-2">
            <button type="button" onClick={close} className="min-h-14 flex-1 rounded-2xl border border-line font-bold">
              닫기
            </button>
            <button type="button" onClick={() => start(active.plan)} className="min-h-14 flex-1 rounded-2xl bg-ink font-bold text-bg">
              다시 시작
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      <RunningView session={active} nameOf={nameOf} onStop={() => setConfirmStop(true)} />
      <ConfirmDialog
        open={confirmStop}
        title="타이머를 끝낼까요?"
        message="진행 상황은 남지 않습니다."
        confirmLabel="종료"
        destructive
        onConfirm={close}
        onCancel={() => setConfirmStop(false)}
      />
    </>
  );
}

function RunningView({ session, nameOf, onStop }: { session: Session; nameOf(id: string): string; onStop(): void }) {
  const { plan, segments, run } = session;
  const pos = sessionPosition(session);
  const seg = segments[pos.segmentIndex];
  const elapsedSec = run.elapsedMs / 1000;
  const segProgress = Math.min(1, Math.max(0, (elapsedSec - seg.startSec) / seg.sec));
  const totalLeft = Math.ceil(totalSec(segments) - elapsedSec);
  const circuit = plan.exerciseIds.length > 0;

  const label = seg.kind === "work" && seg.exerciseId ? nameOf(seg.exerciseId) : KIND_LABEL[seg.kind];
  // 서킷: 운동 중에는 그 종목, 준비·휴식 중에는 다음 종목 영상
  const videoId = circuit ? (seg.kind === "work" ? seg.exerciseId : seg.nextExerciseId) : undefined;
  const videoSrc = videoId ? guideVideoSrc(videoId) : undefined;
  const noWake = session.wake === "unsupported" || session.wake === "denied";

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className={`min-h-full ${KIND_BG[seg.kind]}`}>
        <main className="mx-auto flex max-w-md flex-col px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <header className="flex items-center justify-between gap-2">
            <h1 className="truncate font-bold">{plan.name}</h1>
            <button type="button" onClick={onStop} className="min-h-11 shrink-0 rounded-xl px-3 font-semibold text-danger">
              종료
            </button>
          </header>

          <p className="mt-1 text-center font-semibold tabular-nums text-muted">
            {circuit ? `라운드 ${seg.round} / ${plan.rounds} · 종목 ${seg.index + 1} / ${plan.exerciseIds.length}` : `세트 ${seg.round} / ${plan.rounds}`}
          </p>

          <div className="mt-3 text-center" aria-live="polite">
            <p className="text-3xl font-extrabold">{label}</p>
            {seg.kind !== "work" && seg.nextExerciseId && <p className="mt-1 text-lg font-semibold">다음: {nameOf(seg.nextExerciseId)}</p>}
          </div>

          <p className="mt-2 text-center text-[7rem] leading-none font-black tabular-nums" aria-label={`남은 시간 ${pos.remainingSec}초`}>
            {pos.remainingSec >= 60 ? formatClock(pos.remainingSec) : pos.remainingSec}
          </p>
          {!run.running && <p className="text-center font-bold">일시정지됨</p>}

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-ink/10" aria-hidden>
            <div className="h-full rounded-full bg-ink" style={{ width: `${segProgress * 100}%` }} />
          </div>
          <p className="mt-2 text-center text-sm text-muted tabular-nums">전체 남은 시간 {formatClock(totalLeft)}</p>

          {videoSrc && (
            <div className="mx-auto mt-3 w-[min(15rem,30dvh)]">
              <GuideVideo key={videoId} src={videoSrc} />
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2">
            <button type="button" onClick={() => skip("prev")} className="min-h-14 rounded-2xl bg-surface font-bold">
              ◀ 이전
            </button>
            <button
              type="button"
              onClick={() => (run.running ? pauseSession() : resumeSession())}
              className="min-h-14 rounded-2xl bg-ink font-bold text-bg"
            >
              {run.running ? "⏸ 일시정지" : "▶ 계속"}
            </button>
            <button type="button" onClick={() => skip("next")} className="min-h-14 rounded-2xl bg-surface font-bold">
              다음 ▶
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-pressed={session.voice}
              disabled={!session.voiceAvailable}
              onClick={() => setSound({ voice: !session.voice })}
              className="min-h-11 rounded-xl border border-line bg-surface font-semibold disabled:opacity-40"
            >
              음성 {session.voice ? "켜짐" : "꺼짐"}
            </button>
            <button
              type="button"
              aria-pressed={session.beep}
              onClick={() => setSound({ beep: !session.beep })}
              className="min-h-11 rounded-xl border border-line bg-surface font-semibold"
            >
              삐 소리 {session.beep ? "켜짐" : "꺼짐"}
            </button>
          </div>

          {!session.voiceAvailable && <p className="mt-2 text-center text-sm text-muted">음성 안내를 쓸 수 없어 삐 소리만 냅니다</p>}
          {noWake && <p className="mt-2 text-center text-sm text-muted">화면이 꺼지면 타이머가 멈출 수 있습니다</p>}
        </main>
      </div>
    </div>
  );
}
