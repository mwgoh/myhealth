"use client";

import { useState } from "react";
import { checkExerciseDelete, defaultKindFor, isSeedExercise } from "@/domain/exercises";
import { CATEGORIES, CATEGORY_LABEL, KIND_LABEL, MEASURE_KINDS, type Category, type Exercise, type MeasureKind } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import { CATEGORY_DOT } from "./CategoryChip";
import { ConfirmDialog } from "./ConfirmDialog";
import { ExerciseGuide, hasGuide } from "./ExerciseGuide";
import { ADD_EXERCISE_ERROR } from "./ExercisePicker";

export function ExerciseManager() {
  const { store, api } = useReadyStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("strength");
  const [kind, setKind] = useState<MeasureKind>("weighted");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  // 영상을 펼친 종목. 한 번에 하나만 펼친다.
  const [previewId, setPreviewId] = useState<string | null>(null);
  // 삭제를 누른 종목과 그 종목을 쓴 기록·타이머 수
  const [deleteTarget, setDeleteTarget] = useState<{ exercise: Exercise; uses: number; timers: number } | null>(null);

  const add = () => {
    const r = api.addExercise({ name, category, kind });
    if (!r.ok) return setMessage({ text: ADD_EXERCISE_ERROR[r.reason], error: true });
    if (r.write === "failed") return setMessage({ text: "저장하지 못했습니다.", error: true });
    setMessage({ text: `${r.exercise.name}을(를) 추가했습니다.`, error: false });
    setName("");
  };
  const toggle = (id: string, archived: boolean) => {
    if (api.setExerciseArchived(id, archived) === "failed") setMessage({ text: "저장하지 못했습니다.", error: true });
  };

  // 삭제: 기록에 쓰이지 않았으면 삭제 확인, 쓰였으면 삭제할 수 없다고 알리고 숨기기를 권한다
  const askDelete = (exercise: Exercise) => {
    const check = checkExerciseDelete(store, exercise.id);
    const inUse = !check.ok && check.reason === "in-use";
    setDeleteTarget({ exercise, uses: inUse ? check.uses : 0, timers: inUse ? check.timers : 0 });
  };
  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { exercise, uses, timers } = deleteTarget;
    setDeleteTarget(null);
    if (uses > 0 || timers > 0) {
      if (!exercise.archived) toggle(exercise.id, true);
      return;
    }
    const r = api.deleteExercise(exercise.id);
    if (!r.ok || r.write === "failed") return setMessage({ text: "삭제하지 못했습니다.", error: true });
    if (previewId === exercise.id) setPreviewId(null);
    setMessage({ text: `${exercise.name}을(를) 삭제했습니다.`, error: false });
  };
  const deleteDialog = deleteTarget && deleteDialogText(deleteTarget.exercise, deleteTarget.uses, deleteTarget.timers);

  return (
    <div>
      <div className="rounded-2xl bg-surface p-4">
        <label className="block text-sm text-muted">
          새 종목 이름
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-line bg-bg px-3 text-base text-ink"
          />
        </label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="text-sm text-muted">
            분류
            <select
              value={category}
              onChange={(e) => {
                const c = e.target.value as Category;
                setCategory(c);
                setKind(defaultKindFor(c));
              }}
              className="mt-1 min-h-11 w-full rounded-lg border border-line bg-bg px-2 text-base text-ink"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            기록 방식
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as MeasureKind)}
              className="mt-1 min-h-11 w-full rounded-lg border border-line bg-bg px-2 text-base text-ink"
            >
              {MEASURE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="button" onClick={add} className="mt-3 min-h-11 w-full rounded-xl bg-ink font-bold text-bg">
          종목 추가
        </button>
        {message && (
          <p role="status" className={`mt-2 text-sm ${message.error ? "text-danger" : "text-muted"}`}>
            {message.text}
          </p>
        )}
      </div>

      <div className="mt-3 divide-y divide-line overflow-hidden rounded-2xl bg-surface">
        {CATEGORIES.map((c) => {
          const list = store.exercises.filter((e) => e.category === c);
          return (
            <details key={c}>
              <summary className="flex min-h-12 cursor-pointer items-center gap-2 px-4 font-semibold">
                <span className={`size-2.5 rounded-full ${CATEGORY_DOT[c]}`} aria-hidden />
                {CATEGORY_LABEL[c]}
                <span className="ml-auto text-sm font-normal text-muted">{list.length}개</span>
              </summary>
              <ul className="pb-2">
                {list.map((e) => {
                  const label = (
                    <span className={e.archived ? "text-muted line-through" : ""}>
                      {e.name}
                      <span className="ml-2 text-sm text-muted no-underline">{KIND_LABEL[e.kind]}</span>
                    </span>
                  );
                  return (
                    <li key={e.id} className="px-4">
                      <div className="flex items-center gap-1">
                        {/* 가이드가 있는 종목은 이름을 누르면 영상과 핵심 포인트를 펼친다 */}
                        {hasGuide(e.id) ? (
                          <button
                            type="button"
                            onClick={() => setPreviewId((id) => (id === e.id ? null : e.id))}
                            aria-expanded={previewId === e.id}
                            aria-label={`${e.name} 영상 ${previewId === e.id ? "닫기" : "보기"}`}
                            className="flex min-h-11 flex-1 items-center gap-2 text-left"
                          >
                            <span className="w-4 shrink-0 text-muted" aria-hidden>
                              {previewId === e.id ? "▾" : "▶"}
                            </span>
                            {label}
                          </button>
                        ) : (
                          <span className="flex min-h-11 flex-1 items-center gap-2">
                            <span className="w-4 shrink-0" aria-hidden />
                            {label}
                          </span>
                        )}
                        {!isSeedExercise(e.id) && (
                          <button
                            type="button"
                            onClick={() => askDelete(e)}
                            aria-label={`${e.name} 삭제`}
                            className="min-h-11 px-2 text-sm font-semibold text-danger"
                          >
                            삭제
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => toggle(e.id, !e.archived)}
                          aria-label={`${e.name} ${e.archived ? "숨김 해제" : "숨기기"}`}
                          className="min-h-11 px-2 text-sm font-semibold text-muted"
                        >
                          {e.archived ? "숨김 해제" : "숨기기"}
                        </button>
                      </div>
                      {previewId === e.id && (
                        <div className="pb-2">
                          <ExerciseGuide exercise={e} />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          );
        })}
      </div>

      <ConfirmDialog
        open={deleteDialog !== null}
        title={deleteDialog?.title ?? ""}
        message={deleteDialog?.message ?? ""}
        confirmLabel={deleteDialog?.confirmLabel ?? ""}
        destructive={deleteTarget?.uses === 0 && deleteTarget.timers === 0}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

function deleteDialogText(exercise: Exercise, uses: number, timers: number): { title: string; message: string; confirmLabel: string } {
  if (uses === 0 && timers === 0) {
    return { title: `${exercise.name}을(를) 삭제할까요?`, message: "삭제한 종목은 되돌릴 수 없습니다.", confirmLabel: "삭제" };
  }
  const where = [uses > 0 ? `기록 ${uses}개` : null, timers > 0 ? `타이머 ${timers}개` : null].filter(Boolean).join(", ");
  const why = `이 종목을 쓴 ${where}가 있어 삭제할 수 없습니다. 지키려면 숨겨 두세요.`;
  return exercise.archived
    ? { title: "삭제할 수 없습니다", message: `${why} 이미 숨긴 종목입니다.`, confirmLabel: "확인" }
    : { title: "삭제할 수 없습니다", message: `${why} 지금 숨길까요?`, confirmLabel: "숨기기" };
}
