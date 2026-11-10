"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createId } from "@/domain/id";
import {
  buildSegments,
  checkTimerPlan,
  formatClock,
  isPresetId,
  newTimerPlan,
  TIMER_LIMITS,
  TIMER_PRESETS,
  totalSec,
  type TimerField,
  type TimerPlan,
} from "@/domain/timer";
import type { Exercise } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExercisePicker } from "./ExercisePicker";

type NumberKey = "prepSec" | "workSec" | "restSec" | "rounds" | "roundRestSec";

/** 편집 초안. 숫자 칸은 입력한 문자열 그대로 둔다 */
type Draft = Omit<TimerPlan, NumberKey> & Record<NumberKey, string> & { existing: boolean };

const toDraft = (p: TimerPlan, existing: boolean): Draft => ({
  ...p,
  prepSec: String(p.prepSec),
  workSec: String(p.workSec),
  restSec: String(p.restSec),
  rounds: String(p.rounds),
  roundRestSec: String(p.roundRestSec),
  existing,
});

const num = (s: string) => (/^\d+$/.test(s.trim()) ? Number(s.trim()) : Number.NaN);

const toPlan = (d: Draft): TimerPlan => {
  // 기본 인터벌(종목 없음)에서는 라운드 휴식 칸을 숨기므로, 숨긴 칸의 잘못된 값이 저장을 막지 않게 기본값으로 둔다
  const roundRest = num(d.roundRestSec);
  const { min, max } = TIMER_LIMITS.roundRestSec;
  const hiddenBad = d.exerciseIds.length === 0 && !(roundRest >= min && roundRest <= max);
  return {
    id: d.id,
    name: d.name.trim(),
    prepSec: num(d.prepSec),
    workSec: num(d.workSec),
    restSec: num(d.restSec),
    rounds: num(d.rounds),
    roundRestSec: hiddenBad ? newTimerPlan("").roundRestSec : roundRest,
    exerciseIds: d.exerciseIds,
  };
};

/**
 * 편집할 초안. new면 새 타이머(from이 있으면 그 타이머·프리셋의 복사본), 아니면 내 타이머. 없으면 null.
 * 프리셋은 고칠 수 없으므로 프리셋 ID로 편집을 열면 복사본을 만든다.
 */
function initialDraft(editId: string, fromId: string | null, timers: readonly TimerPlan[]): Draft | null {
  const all = [...TIMER_PRESETS, ...timers];
  if (isPresetId(editId)) return initialDraft("new", editId, timers);
  if (editId === "new") {
    const src = fromId ? all.find((p) => p.id === fromId) : undefined;
    if (fromId && !src) return null;
    const base = src ? { ...src, name: `${src.name} 복사`.slice(0, TIMER_LIMITS.nameMax) } : newTimerPlan("");
    return toDraft({ ...base, id: createId(), exerciseIds: [...base.exerciseIds] }, false);
  }
  const mine = timers.find((t) => t.id === editId);
  return mine ? toDraft(mine, true) : null;
}

export function TimerEditor({ editId, fromId }: { editId: string; fromId: string | null }) {
  const router = useRouter();
  const { store, api } = useReadyStore();
  const [draft, setDraft] = useState(() => initialDraft(editId, fromId, store.timers ?? []));
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!draft) {
    return (
      <div>
        <p className="text-lg font-bold">타이머를 찾을 수 없습니다</p>
        <Link href="/timer" className="mt-4 inline-flex min-h-11 items-center font-semibold underline">
          목록으로
        </Link>
      </div>
    );
  }

  const byId = new Map(store.exercises.map((e) => [e.id, e]));
  const plan = toPlan(draft);
  const bad = new Set<TimerField>(checkTimerPlan(plan));
  const circuit = draft.exerciseIds.length > 0;
  const set = (change: Partial<Draft>) => setDraft({ ...draft, ...change });

  const moveExercise = (i: number, d: -1 | 1) => {
    const ids = [...draft.exerciseIds];
    [ids[i], ids[i + d]] = [ids[i + d], ids[i]];
    set({ exerciseIds: ids });
  };
  const addExercises = (exs: Exercise[]) => {
    const ids = [...draft.exerciseIds];
    for (const e of exs) if (!ids.includes(e.id)) ids.push(e.id);
    set({ exerciseIds: ids.slice(0, TIMER_LIMITS.exercisesMax) });
    setPickerOpen(false);
  };
  const save = () => {
    if (bad.size > 0) return;
    if (api.saveTimer(plan) === "failed") return setMessage("저장하지 못했습니다.");
    router.replace("/timer");
  };
  const remove = () => {
    if (api.deleteTimer(draft.id) === "failed") return setMessage("삭제하지 못했습니다.");
    router.replace("/timer");
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm text-muted">
        이름
        <input
          type="text"
          value={draft.name}
          maxLength={TIMER_LIMITS.nameMax}
          aria-invalid={bad.has("name")}
          onChange={(e) => set({ name: e.target.value })}
          className={`mt-1 min-h-11 w-full rounded-xl border bg-surface px-3 text-base font-semibold text-ink ${bad.has("name") ? "border-danger" : "border-line"}`}
        />
        {bad.has("name") && <span className="text-danger">1~{TIMER_LIMITS.nameMax}자</span>}
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Stepper label="준비 (초)" field="prepSec" draft={draft} step={5} bad={bad} onChange={set} />
        <Stepper label="운동 (초)" field="workSec" draft={draft} step={5} bad={bad} onChange={set} />
        <Stepper label="휴식 (초)" field="restSec" draft={draft} step={5} bad={bad} onChange={set} />
        <Stepper label={circuit ? "라운드" : "세트"} field="rounds" draft={draft} step={1} bad={bad} onChange={set} />
        {circuit && <Stepper label="라운드 사이 휴식 (초)" field="roundRestSec" draft={draft} step={5} bad={bad} onChange={set} />}
      </div>

      <section>
        <h2 className="font-bold">종목 {circuit ? `(${draft.exerciseIds.length}개, 서킷)` : "(없으면 기본 인터벌)"}</h2>
        {bad.has("exerciseIds") && <p className="text-sm text-danger">종목은 {TIMER_LIMITS.exercisesMax}개까지, 중복 없이</p>}
        <ol className="mt-2 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
          {draft.exerciseIds.map((id, i) => (
            <li key={id} className="flex items-center gap-1 pl-4">
              <span className="w-6 text-sm text-muted tabular-nums">{i + 1}</span>
              <span className="flex-1 font-semibold">{byId.get(id)?.name ?? "알 수 없는 종목"}</span>
              <button type="button" onClick={() => moveExercise(i, -1)} disabled={i === 0} aria-label="위로" className="min-h-11 min-w-11 disabled:opacity-30">
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveExercise(i, 1)}
                disabled={i === draft.exerciseIds.length - 1}
                aria-label="아래로"
                className="min-h-11 min-w-11 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => set({ exerciseIds: draft.exerciseIds.filter((x) => x !== id) })}
                aria-label={`${byId.get(id)?.name ?? "종목"} 빼기`}
                className="min-h-11 min-w-11 text-danger"
              >
                ✕
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="mt-2 min-h-11 w-full rounded-xl border border-dashed border-line font-semibold"
        >
          + 종목 추가
        </button>
      </section>

      <p className="text-center font-semibold">{bad.size === 0 ? `총 ${formatClock(totalSec(buildSegments(plan)))}` : "칸을 고치면 총 시간이 나옵니다"}</p>
      {message && <p className="text-sm text-danger">{message}</p>}

      <div className="flex gap-2">
        {draft.existing && (
          <button type="button" onClick={() => setConfirmDelete(true)} className="min-h-12 rounded-2xl px-4 font-semibold text-danger">
            삭제
          </button>
        )}
        <button type="button" onClick={() => router.replace("/timer")} className="min-h-12 flex-1 rounded-2xl border border-line font-semibold">
          취소
        </button>
        <button
          type="button"
          onClick={save}
          disabled={bad.size > 0}
          className="min-h-12 flex-1 rounded-2xl bg-ink font-bold text-bg disabled:bg-line disabled:text-muted"
        >
          저장
        </button>
      </div>

      <ExercisePicker open={pickerOpen} addedIds={new Set(draft.exerciseIds)} onPick={addExercises} onClose={() => setPickerOpen(false)} />
      <ConfirmDialog
        open={confirmDelete}
        title={`${draft.name}을(를) 삭제할까요?`}
        message="삭제한 타이머는 되돌릴 수 없습니다."
        confirmLabel="삭제"
        destructive
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

/** −/+ 버튼이 달린 숫자 칸. 누르면 범위 안에서 step만큼 바뀐다 */
function Stepper(props: { label: string; field: NumberKey; draft: Draft; step: number; bad: Set<TimerField>; onChange(c: Partial<Draft>): void }) {
  const { label, field, draft, step, bad, onChange } = props;
  const range = TIMER_LIMITS[field];
  const n = num(draft[field]);
  const bump = (d: number) => {
    const base = Number.isFinite(n) ? n : range.min;
    onChange({ [field]: String(Math.min(range.max, Math.max(range.min, base + d))) });
  };
  const invalid = bad.has(field);
  return (
    <div className="text-sm text-muted">
      {label}
      <div className="mt-1 flex gap-1">
        <button type="button" onClick={() => bump(-step)} aria-label={`${label} 줄이기`} className="min-h-11 min-w-11 rounded-xl border border-line text-lg text-ink">
          −
        </button>
        <input
          type="text"
          inputMode="numeric"
          value={draft[field]}
          aria-label={label}
          aria-invalid={invalid}
          onChange={(e) => onChange({ [field]: e.target.value })}
          className={`min-h-11 w-full min-w-0 rounded-xl border bg-surface px-2 text-center text-base font-semibold text-ink tabular-nums ${invalid ? "border-danger" : "border-line"}`}
        />
        <button type="button" onClick={() => bump(step)} aria-label={`${label} 늘리기`} className="min-h-11 min-w-11 rounded-xl border border-line text-lg text-ink">
          +
        </button>
      </div>
      {invalid && (
        <span className="text-danger">
          {range.min}~{range.max}
        </span>
      )}
    </div>
  );
}
