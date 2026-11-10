"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import { LIMITS, MEMO_MAX, type Exercise } from "@/domain/types";
import { appendExercises, hasCompletedSets, readField, toPersistable, withDate, type EntryDraft, type WorkoutDraft } from "@/domain/workout";
import { useAutosave, type SaveContext } from "@/hooks/useAutosave";
import { useReadyStore } from "@/hooks/useStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { EntryCard } from "./EntryCard";
import { ExercisePicker } from "./ExercisePicker";
import { SaveStatus, type SaveStatusValue } from "./SaveStatus";
import { limitText } from "./SetRow";

type Props = { initialDraft: WorkoutDraft; isNew: boolean };

export function WorkoutEditor({ initialDraft, isNew }: Props) {
  const router = useRouter();
  const { store, api } = useReadyStore();
  const [draft, setDraft] = useState(initialDraft);
  const [status, setStatus] = useState<SaveStatusValue>("idle");
  const [saved, setSaved] = useState(!isNew); // 저장소에 있는 기록인가 (삭제 버튼 표시용)
  const isNewRef = useRef(isNew);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removeIndex, setRemoveIndex] = useState<number | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const byId = useMemo(() => new Map(store.exercises.map((e) => [e.id, e])), [store.exercises]);
  // 이 기록에 이미 들어 있는 종목. 종목 선택 창에서 다시 고를 수 없게 한다.
  const addedIds = useMemo(() => new Set(draft.entries.map((e) => e.exerciseId)), [draft.entries]);

  const save = useCallback(
    (d: WorkoutDraft, ctx: SaveContext) => {
      const r = toPersistable(d);
      if (!r.ok) {
        setStatus(r.reason);
        return;
      }
      const result = api.upsertWorkout(r.workout);
      setStatus(result === "saved" ? "saved" : "failed");
      if (result !== "blocked") setSaved(true);
      // 새 기록이 처음 저장되면 새로고침해도 중복이 생기지 않게 주소를 ?id=로 바꾼다.
      // 화면을 벗어나는 중의 저장이면 주소를 바꾸지 않는다. 바꾸면 편집 화면으로 끌려온다.
      if (result === "saved" && isNewRef.current) {
        isNewRef.current = false;
        if (!ctx.unmounting) router.replace(`/workout?id=${d.id}`);
      }
    },
    [api, router],
  );
  const autosave = useAutosave(draft, save);

  const update = (next: WorkoutDraft) => {
    setDraft(next);
    setStatus("saving");
  };
  const setEntry = (i: number, e: EntryDraft) => update({ ...draft, entries: draft.entries.map((x, j) => (j === i ? e : x)) });
  const removeEntry = (i: number) => update({ ...draft, entries: draft.entries.filter((_, j) => j !== i) });
  const pick = (exercises: Exercise[]) => {
    // 이미 이 기록에 있는 종목은 다시 넣지 않는다
    const { draft: next, added } = appendExercises(draft, exercises);
    if (next !== draft) update(next);
    // 방금 고른 종목 중 첫 번째 카드만 가이드(따라하기 영상)를 펼치고 그 카드로 스크롤한다.
    // 여러 카드를 모두 펼치면 영상이 동시에 여러 개 재생된다.
    setJustAddedId(added[0]?.id ?? null);
    setPickerOpen(false);
  };

  const goBack = () => {
    if (window.history.length > 1) router.back();
    else router.replace("/");
  };
  const deleteWorkout = () => {
    // 기다리던 자동 저장이 삭제 뒤에 실행되어 기록을 되살리지 않게 먼저 취소한다
    autosave.cancel();
    api.deleteWorkout(draft.id);
    router.replace("/");
  };

  const durationBad = readField(draft.durationMin, LIMITS.workoutDurationMin).kind === "invalid";

  return (
    <div className="mx-auto max-w-md pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-bg/95 px-2 py-1 backdrop-blur">
        <button type="button" onClick={goBack} className="min-h-11 px-2 font-semibold">
          ‹ 뒤로
        </button>
        <div className="flex-1 text-center">
          <SaveStatus status={status} />
        </div>
        {saved ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-11 px-2 text-sm font-semibold text-danger">
            삭제
          </button>
        ) : (
          <span className="w-12" />
        )}
      </header>

      {status === "failed" && (
        <p role="alert" className="mx-4 mt-3 rounded-xl bg-danger px-3 py-2 text-sm font-semibold text-white">
          저장하지 못했습니다. 저장 공간을 확인하거나 설정에서 백업을 내보내세요.
        </p>
      )}

      <div className="space-y-3 px-4 pt-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-muted">
            날짜
            <input
              type="date"
              value={draft.date}
              onChange={(e) => {
                // 날짜 선택기의 지우기 등으로 빈 값이 오면 이전 날짜를 유지한다(비우면 이후 입력이 저장되지 않는다)
                const next = withDate(draft, e.target.value);
                if (next !== draft) update(next);
              }}
              className="mt-1 min-h-11 w-full rounded-xl border border-line bg-surface px-2 text-base font-semibold text-ink"
            />
          </label>
          <label className="text-sm text-muted">
            총 운동 시간 (분, 선택)
            <input
              type="text"
              inputMode="numeric"
              value={draft.durationMin}
              aria-invalid={durationBad}
              onChange={(e) => update({ ...draft, durationMin: e.target.value })}
              className={`mt-1 min-h-11 w-full rounded-xl border bg-surface px-2 text-right text-base font-semibold text-ink tabular-nums ${
                durationBad ? "border-danger" : "border-line"
              }`}
            />
            {durationBad && <span className="text-danger">{limitText(LIMITS.workoutDurationMin)}</span>}
          </label>
        </div>

        {draft.entries.map((e, i) => (
          <EntryCard
            key={e.id}
            entry={e}
            exercise={byId.get(e.exerciseId)}
            onChange={(next) => setEntry(i, next)}
            onRemove={() => (hasCompletedSets(e) ? setRemoveIndex(i) : removeEntry(i))}
            justAdded={e.id === justAddedId}
          />
        ))}

        {draft.entries.length === 0 && <p className="py-6 text-center text-muted">종목을 추가해 첫 세트를 기록하세요.</p>}

        <button type="button" onClick={() => setPickerOpen(true)} className="min-h-12 w-full rounded-2xl bg-ink text-lg font-bold text-bg">
          + 종목 추가
        </button>

        <label className="block text-sm text-muted">
          메모 (선택)
          <textarea
            value={draft.memo}
            maxLength={MEMO_MAX}
            rows={3}
            onChange={(e) => update({ ...draft, memo: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-surface p-2 text-base text-ink"
          />
        </label>
      </div>

      <ExercisePicker
        open={pickerOpen}
        addedIds={addedIds}
        onPick={pick}
        onClose={() => setPickerOpen(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="이 기록을 삭제할까요?"
        message="삭제한 기록은 되돌릴 수 없습니다."
        confirmLabel="삭제"
        destructive
        onConfirm={deleteWorkout}
        onCancel={() => setConfirmDelete(false)}
      />
      <ConfirmDialog
        open={removeIndex !== null}
        title="이 종목과 입력한 세트를 삭제할까요?"
        message={removeIndex !== null ? (byId.get(draft.entries[removeIndex]?.exerciseId)?.name ?? "") : ""}
        confirmLabel="삭제"
        destructive
        onConfirm={() => {
          if (removeIndex !== null) removeEntry(removeIndex);
          setRemoveIndex(null);
        }}
        onCancel={() => setRemoveIndex(null)}
      />
    </div>
  );
}
