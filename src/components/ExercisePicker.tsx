"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultKindFor, pickerList } from "@/domain/exercises";
import { getGuide } from "@/domain/seed";
import { CATEGORIES, CATEGORY_LABEL, KIND_LABEL, MEASURE_KINDS, type Category, type Exercise, type MeasureKind } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import type { AddExerciseResult } from "@/storage/store";
import { CATEGORY_DOT } from "./CategoryChip";
import { ExerciseGuide, hasGuide } from "./ExerciseGuide";

export const ADD_EXERCISE_ERROR: Record<Exclude<AddExerciseResult, { ok: true }>["reason"], string> = {
  empty: "종목 이름을 입력하세요.",
  duplicate: "이미 있는 종목입니다.",
  "duplicate-archived": "숨긴 종목에 같은 이름이 있습니다. 설정에서 숨김을 해제하세요.",
};

type Props = {
  open: boolean;
  /** 이 기록에 이미 들어 있는 종목. '추가됨'으로 보여주고 고를 수 없다. */
  addedIds: ReadonlySet<string>;
  /** 고른 순서대로 종목을 받는다 */
  onPick(exercises: Exercise[]): void;
  onClose(): void;
};

export function ExercisePicker({ open, addedIds, onPick, onClose }: Props) {
  const { store, api } = useReadyStore();
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("strength");
  const [newKind, setNewKind] = useState<MeasureKind>("weighted");
  const [error, setError] = useState<string | null>(null);
  // 영상을 펼친 종목. 한 번에 하나만 펼친다.
  const [previewId, setPreviewId] = useState<string | null>(null);
  // 고른 종목 ID(고른 순서). 분류를 바꾸거나 검색해도 유지한다.
  const [selected, setSelected] = useState<string[]>([]);

  // 닫으면 고른 것을 버린다(다음에 열 때 빈 상태로 시작)
  const close = useCallback(() => {
    setSelected([]);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const confirm = () => {
    const byId = new Map(store.exercises.map((e) => [e.id, e]));
    const picked = selected.map((id) => byId.get(id)).filter((e): e is Exercise => e !== undefined);
    setSelected([]);
    onPick(picked);
  };

  const list = pickerList(store, { category, query });
  const chooseCategory = (c: Category | "all") => {
    setCategory(c);
    // 새 종목 추가의 기본 분류는 선택 중인 필터를 따른다. 전체일 때는 근력운동.
    const base = c === "all" ? "strength" : c;
    setNewCategory(base);
    setNewKind(defaultKindFor(base));
  };
  // 새 종목을 만들어 고른 목록에 넣고, 검색어를 지워 다른 종목도 이어서 고를 수 있게 한다
  const add = () => {
    const r = api.addExercise({ name: query, category: newCategory, kind: newKind });
    if (!r.ok) return setError(ADD_EXERCISE_ERROR[r.reason]);
    setError(null);
    setQuery("");
    setSelected((s) => [...s, r.exercise.id]);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="종목 선택"
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-4">
          <h2 className="text-xl font-extrabold">종목 선택</h2>
          <button type="button" onClick={close} className="min-h-11 px-3 font-semibold text-muted">
            닫기
          </button>
        </div>

        {/* 분류 6개(전체 + 5개)를 3열 2줄로 모두 보이게 한다. 가로 스크롤이면 뒤쪽 분류가 화면 밖에 숨는다. */}
        <div className="grid shrink-0 grid-cols-3 gap-2 px-4 py-2" role="group" aria-label="분류">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => chooseCategory(c)}
              aria-pressed={category === c}
              className={`flex min-h-11 items-center justify-center gap-1 rounded-full border px-2 text-sm whitespace-nowrap ${
                category === c ? "border-ink bg-ink font-bold text-bg" : "border-line"
              }`}
            >
              {c !== "all" && <span className={`size-2 rounded-full ${CATEGORY_DOT[c]}`} aria-hidden />}
              {c === "all" ? "전체" : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>

        <div className="shrink-0 px-4 pb-2">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setError(null);
            }}
            placeholder="종목 이름 검색"
            aria-label="종목 검색"
            className="min-h-11 w-full rounded-xl border border-line bg-bg px-3 text-base"
          />
        </div>

        <ul className="flex-1 overflow-y-auto px-2 pb-4">
          {list.map((ex) => {
            const order = selected.indexOf(ex.id) + 1;
            const added = addedIds.has(ex.id);
            return (
            <li key={ex.id}>
              <div className="flex items-center">
                {/* 줄을 누르면 고르기/풀기. 고른 종목은 아래 'N개 추가'로 한꺼번에 넣는다. 영상은 오른쪽 ▶로 따로 본다.
                    이미 기록에 있는 종목은 고를 수 없다. */}
                <button
                  type="button"
                  onClick={() => toggle(ex.id)}
                  disabled={added}
                  aria-pressed={order > 0}
                  className={`flex min-h-12 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left disabled:opacity-50 ${
                    order > 0 ? "bg-bg" : "active:bg-bg"
                  }`}
                >
                  {/* 고른 순서(추가되는 순서)를 보여준다. 이미 기록에 있으면 ✓ */}
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-md border text-sm font-bold ${
                      order > 0 ? "border-ink bg-ink text-bg" : added ? "border-line bg-line" : "border-line"
                    }`}
                    aria-hidden
                  >
                    {order > 0 ? order : added ? "✓" : ""}
                  </span>
                  <span className={`size-2.5 shrink-0 rounded-full ${CATEGORY_DOT[ex.category]}`} aria-hidden />
                  <span className="flex-1">
                    <span className="block font-semibold">{ex.name}</span>
                    {getGuide(ex.id) && <span className="block text-sm text-muted">{getGuide(ex.id)!.target}</span>}
                  </span>
                  <span className="text-sm text-muted">{added ? "추가됨" : KIND_LABEL[ex.kind]}</span>
                </button>
                {hasGuide(ex.id) && (
                  <button
                    type="button"
                    onClick={() => setPreviewId((id) => (id === ex.id ? null : ex.id))}
                    aria-expanded={previewId === ex.id}
                    aria-label={`${ex.name} 영상 ${previewId === ex.id ? "닫기" : "보기"}`}
                    className="min-h-11 min-w-11 text-lg text-muted"
                  >
                    {previewId === ex.id ? "▾" : "▶"}
                  </button>
                )}
              </div>
              {previewId === ex.id && (
                <div className="px-2 pb-2">
                  <ExerciseGuide exercise={ex} />
                </div>
              )}
            </li>
            );
          })}

          {list.length === 0 && query.trim() !== "" && (
            <li className="rounded-xl bg-bg p-3">
              <p className="font-semibold">&lsquo;{query.trim()}&rsquo; 새 종목으로 추가</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-sm text-muted">
                  분류
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const c = e.target.value as Category;
                      setNewCategory(c);
                      setNewKind(defaultKindFor(c));
                    }}
                    className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-2 text-base text-ink"
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
                    value={newKind}
                    onChange={(e) => setNewKind(e.target.value as MeasureKind)}
                    className="mt-1 min-h-11 w-full rounded-lg border border-line bg-surface px-2 text-base text-ink"
                  >
                    {MEASURE_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {error && <p className="mt-2 text-sm text-danger">{error}</p>}
              <button type="button" onClick={add} className="mt-3 min-h-11 w-full rounded-xl bg-ink font-bold text-bg">
                새 종목 만들고 고르기
              </button>
            </li>
          )}

          {list.length === 0 && query.trim() === "" && <li className="p-3 text-muted">이 분류에 보이는 종목이 없습니다.</li>}
        </ul>

        <div className="shrink-0 border-t border-line px-4 py-3">
          <button
            type="button"
            onClick={confirm}
            disabled={selected.length === 0}
            className="min-h-12 w-full rounded-2xl bg-ink text-lg font-bold text-bg disabled:bg-line disabled:text-muted"
          >
            {selected.length > 0 ? `${selected.length}개 종목 추가` : "추가할 종목을 고르세요"}
          </button>
        </div>
      </div>
    </div>
  );
}
