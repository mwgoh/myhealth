"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TIMER_PRESETS, timerSummary, type TimerPlan } from "@/domain/timer";
import { useReadyStore } from "@/hooks/useStore";
import { useTimerSession } from "@/hooks/useTimerSession";
import { sessionDone, startSession } from "@/timer/session";
import { ConfirmDialog } from "./ConfirmDialog";

/** 종목 ID → 이름. 음성 안내("스쿼트 시작")에 쓴다 */
export function useExerciseNames(): (id: string) => string {
  const { store } = useReadyStore();
  const names = new Map(store.exercises.map((e) => [e.id, e.name]));
  return (id: string) => names.get(id) ?? "알 수 없는 종목";
}

/** 타이머 목록: 이어하기, 새 타이머, 내 타이머, 기본 프리셋 */
export function TimerList() {
  const router = useRouter();
  const { store, api } = useReadyStore();
  const session = useTimerSession();
  const nameOf = useExerciseNames();
  const [openId, setOpenId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TimerPlan | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // 시작은 이 클릭 처리기 안에서 한다. 아이폰은 사용자 조작 안에서 첫 소리를 내야 이후 소리를 허용한다.
  const start = (plan: TimerPlan) => {
    startSession(plan, nameOf);
    router.push(`/timer?run=${encodeURIComponent(plan.id)}`);
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (api.deleteTimer(deleteTarget.id) === "failed") setMessage("삭제하지 못했습니다.");
    setDeleteTarget(null);
  };

  const row = (plan: TimerPlan, preset: boolean) => {
    const open = openId === plan.id;
    return (
      <li key={plan.id}>
        <button
          type="button"
          onClick={() => setOpenId(open ? null : plan.id)}
          aria-expanded={open}
          className="flex min-h-14 w-full flex-col justify-center px-4 py-2 text-left"
        >
          <span className="font-semibold">{plan.name}</span>
          <span className="text-sm text-muted">{timerSummary(plan)}</span>
        </button>
        {open && (
          <div className="flex flex-wrap gap-2 px-4 pb-3">
            <button type="button" onClick={() => start(plan)} className="min-h-11 flex-1 rounded-xl bg-ink px-4 font-bold text-bg">
              시작
            </button>
            {!preset && (
              <button
                type="button"
                onClick={() => router.push(`/timer?edit=${encodeURIComponent(plan.id)}`)}
                className="min-h-11 rounded-xl border border-line px-4 font-semibold"
              >
                편집
              </button>
            )}
            <button
              type="button"
              onClick={() => router.push(`/timer?edit=new&from=${encodeURIComponent(plan.id)}`)}
              className="min-h-11 rounded-xl border border-line px-4 font-semibold"
            >
              {preset ? "복사해서 내 타이머로" : "복사"}
            </button>
            {!preset && (
              <button type="button" onClick={() => setDeleteTarget(plan)} className="min-h-11 rounded-xl px-3 font-semibold text-danger">
                삭제
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  const myTimers = store.timers ?? [];
  return (
    <div className="space-y-5">
      {session && !sessionDone(session) && (
        <button
          type="button"
          onClick={() => router.push(`/timer?run=${encodeURIComponent(session.plan.id)}`)}
          className="flex min-h-14 w-full items-center justify-between rounded-2xl bg-ink px-4 text-left font-bold text-bg"
        >
          <span>이어하기: {session.plan.name}</span>
          <span className="text-sm font-semibold">{session.run.running ? "진행 중" : "일시정지됨"}</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => router.push("/timer?edit=new")}
        className="min-h-12 w-full rounded-2xl border border-dashed border-line font-bold"
      >
        + 새 타이머
      </button>
      {message && <p className="text-sm text-danger">{message}</p>}

      <section>
        <h2 className="mb-2 font-bold">내 타이머</h2>
        {myTimers.length === 0 ? (
          <p className="text-muted">아직 없습니다. 새 타이머를 만들거나 프리셋을 복사하세요.</p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">{myTimers.map((p) => row(p, false))}</ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 font-bold">기본 프리셋</h2>
        <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-surface">{TIMER_PRESETS.map((p) => row(p, true))}</ul>
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title={`${deleteTarget?.name ?? ""}을(를) 삭제할까요?`}
        message="삭제한 타이머는 되돌릴 수 없습니다."
        confirmLabel="삭제"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
