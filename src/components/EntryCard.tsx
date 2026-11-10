"use client";

import { useEffect, useRef, useState } from "react";
import { LIMITS, type Exercise } from "@/domain/types";
import { addSet, readField, type EntryDraft } from "@/domain/workout";
import { CategoryChip } from "./CategoryChip";
import { ExerciseGuide, hasGuide } from "./ExerciseGuide";
import { limitText, NumberField, RepsRow, TimedRow, WeightedRow } from "./SetRow";

type Props = {
  entry: EntryDraft;
  exercise: Exercise | undefined;
  onChange(e: EntryDraft): void;
  onRemove(): void;
  /** 종목 선택 창에서 방금 고른 종목이면 가이드(영상)를 펼친 채 시작하고 카드가 보이게 스크롤한다 */
  justAdded?: boolean;
};

// 세트 배열의 i번째를 바꾸거나 지운 새 종목 초안을 만든다
function replaceSet<E extends { sets: S[] }, S>(entry: E, i: number, next: S): E {
  return { ...entry, sets: entry.sets.map((x, j) => (j === i ? next : x)) };
}
function removeSet<E extends { sets: unknown[] }>(entry: E, i: number): E {
  return { ...entry, sets: entry.sets.filter((_, j) => j !== i) };
}

export function EntryCard({ entry, exercise, onChange, onRemove, justAdded = false }: Props) {
  const guide = exercise !== undefined && hasGuide(exercise.id);
  // 처음 그릴 때의 값만 쓴다. 다시 그려져도 사용자가 닫은 가이드를 다시 열지 않는다.
  const [guideOpen, setGuideOpen] = useState(justAdded && guide);
  const ref = useRef<HTMLElement>(null);

  // 새 카드는 목록 맨 아래에 생겨 종목 선택 창이 닫힌 뒤 화면 밖에 있을 수 있어 카드 위쪽이 보이게 스크롤한다.
  // 다른 종목을 더 추가하면 justAdded가 false가 되어 다시 스크롤하지 않는다.
  useEffect(() => {
    if (!justAdded) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    ref.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  }, [justAdded]);

  return (
    <section ref={ref} className="scroll-mt-16 rounded-2xl bg-surface p-4">
      <header className="flex flex-wrap items-center gap-x-2">
        <h2 className="text-lg font-bold">{exercise?.name ?? "알 수 없는 종목"}</h2>
        {exercise && <CategoryChip category={exercise.category} />}
        {guide && (
          <button
            type="button"
            onClick={() => setGuideOpen((v) => !v)}
            aria-expanded={guideOpen}
            aria-label={`${exercise?.name} 가이드 ${guideOpen ? "닫기" : "보기"}`}
            className="min-h-11 min-w-11 text-lg text-muted"
          >
            ⓘ
          </button>
        )}
        <button type="button" onClick={onRemove} className="ml-auto min-h-11 px-2 text-sm text-danger">
          종목 삭제
        </button>
      </header>

      {guideOpen && exercise && (
        <div className="mt-1">
          <ExerciseGuide exercise={exercise} />
        </div>
      )}

      {entry.kind === "cardio" ? (
        <CardioFields entry={entry} onChange={onChange} />
      ) : (
        <>
          <ol className="mt-2">
            {entry.kind === "weighted" &&
              entry.sets.map((s, i) => (
                <WeightedRow key={i} index={i} set={s} onChange={(n) => onChange(replaceSet(entry, i, n))} onRemove={() => onChange(removeSet(entry, i))} />
              ))}
            {entry.kind === "reps" &&
              entry.sets.map((s, i) => (
                <RepsRow key={i} index={i} set={s} onChange={(n) => onChange(replaceSet(entry, i, n))} onRemove={() => onChange(removeSet(entry, i))} />
              ))}
            {entry.kind === "timed" &&
              entry.sets.map((s, i) => (
                <TimedRow key={i} index={i} set={s} onChange={(n) => onChange(replaceSet(entry, i, n))} onRemove={() => onChange(removeSet(entry, i))} />
              ))}
          </ol>
          <button
            type="button"
            onClick={() => onChange(addSet(entry))}
            className="mt-2 min-h-11 w-full rounded-xl border border-dashed border-line font-semibold"
          >
            + 세트 추가
          </button>
        </>
      )}
    </section>
  );
}


function CardioFields({ entry, onChange }: { entry: Extract<EntryDraft, { kind: "cardio" }>; onChange(e: EntryDraft): void }) {
  const durationBad = readField(entry.durationMin, LIMITS.cardioDurationMin).kind === "invalid";
  const distanceBad = readField(entry.distanceKm, LIMITS.distanceKm).kind === "invalid";
  return (
    <div className="mt-2">
      <div className="flex flex-wrap items-center gap-3">
        <NumberField label="시간(분)" unit="분" value={entry.durationMin} limit={LIMITS.cardioDurationMin} onChange={(durationMin) => onChange({ ...entry, durationMin })} />
        <NumberField label="거리(km)" unit="km" value={entry.distanceKm} limit={LIMITS.distanceKm} onChange={(distanceKm) => onChange({ ...entry, distanceKm })} />
      </div>
      {durationBad && <p className="text-sm text-danger">시간: {limitText(LIMITS.cardioDurationMin)}</p>}
      {distanceBad && <p className="text-sm text-danger">거리: {limitText(LIMITS.distanceKm)}</p>}
    </div>
  );
}
