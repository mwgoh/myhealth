"use client";

import { useState } from "react";
import { defaultKindFor } from "@/domain/exercises";
import { CATEGORIES, CATEGORY_LABEL, KIND_LABEL, MEASURE_KINDS, type Category, type MeasureKind } from "@/domain/types";
import { useReadyStore } from "@/hooks/useStore";
import { CATEGORY_DOT } from "./CategoryChip";
import { ADD_EXERCISE_ERROR } from "./ExercisePicker";

export function ExerciseManager() {
  const { store, api } = useReadyStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("strength");
  const [kind, setKind] = useState<MeasureKind>("weighted");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

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
                {list.map((e) => (
                  <li key={e.id} className="flex items-center gap-2 px-4">
                    <span className={`flex-1 ${e.archived ? "text-muted line-through" : ""}`}>
                      {e.name}
                      <span className="ml-2 text-sm text-muted no-underline">{KIND_LABEL[e.kind]}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggle(e.id, !e.archived)}
                      aria-label={`${e.name} ${e.archived ? "숨김 해제" : "숨기기"}`}
                      className="min-h-11 px-2 text-sm font-semibold text-muted"
                    >
                      {e.archived ? "숨김 해제" : "숨기기"}
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </div>
  );
}
