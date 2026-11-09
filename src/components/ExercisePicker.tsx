"use client";

import { useEffect, useState } from "react";
import { defaultKindFor, pickerList } from "@/domain/exercises";
import { getGuide } from "@/domain/seed";
import { CATEGORIES, CATEGORY_LABEL, KIND_LABEL, MEASURE_KINDS, type Category, type Exercise, type MeasureKind } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import type { AddExerciseResult } from "@/storage/store";
import { CATEGORY_DOT } from "./CategoryChip";

export const ADD_EXERCISE_ERROR: Record<Exclude<AddExerciseResult, { ok: true }>["reason"], string> = {
  empty: "종목 이름을 입력하세요.",
  duplicate: "이미 있는 종목입니다.",
  "duplicate-archived": "숨긴 종목에 같은 이름이 있습니다. 설정에서 숨김을 해제하세요.",
};

type Props = { open: boolean; onPick(ex: Exercise): void; onClose(): void };

export function ExercisePicker({ open, onPick, onClose }: Props) {
  const { store, api } = useReadyStore();
  const [category, setCategory] = useState<Category | "all">("all");
  const [query, setQuery] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("strength");
  const [newKind, setNewKind] = useState<MeasureKind>("weighted");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const list = pickerList(store, { category, query });
  const chooseCategory = (c: Category | "all") => {
    setCategory(c);
    // 새 종목 추가의 기본 분류는 선택 중인 필터를 따른다. 전체일 때는 근력운동.
    const base = c === "all" ? "strength" : c;
    setNewCategory(base);
    setNewKind(defaultKindFor(base));
  };
  const add = () => {
    const r = api.addExercise({ name: query, category: newCategory, kind: newKind });
    if (!r.ok) return setError(ADD_EXERCISE_ERROR[r.reason]);
    setError(null);
    setQuery("");
    onPick(r.exercise);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="종목 선택"
        className="flex max-h-[85dvh] w-full max-w-md flex-col rounded-t-3xl bg-surface pb-[env(safe-area-inset-bottom)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-4 pt-4">
          <h2 className="text-xl font-extrabold">종목 선택</h2>
          <button type="button" onClick={onClose} className="min-h-11 px-3 font-semibold text-muted">
            닫기
          </button>
        </div>

        <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none]" role="group" aria-label="분류">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => chooseCategory(c)}
              aria-pressed={category === c}
              className={`flex min-h-9 shrink-0 items-center gap-1 rounded-full border px-3 text-sm ${
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
          {list.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onPick(ex)}
                className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left active:bg-bg"
              >
                <span className={`size-2.5 shrink-0 rounded-full ${CATEGORY_DOT[ex.category]}`} aria-hidden />
                <span className="flex-1">
                  <span className="block font-semibold">{ex.name}</span>
                  {getGuide(ex.id) && <span className="block text-sm text-muted">{getGuide(ex.id)!.target}</span>}
                </span>
                <span className="text-sm text-muted">{KIND_LABEL[ex.kind]}</span>
              </button>
            </li>
          ))}

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
                추가하고 기록하기
              </button>
            </li>
          )}

          {list.length === 0 && query.trim() === "" && <li className="p-3 text-muted">이 분류에 보이는 종목이 없습니다.</li>}
        </ul>
      </div>
    </div>
  );
}
