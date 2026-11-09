"use client";

import { useEffect, useRef, useState } from "react";
import { GUIDE_NOTE, getGuide, STRETCH_NOTE } from "@/domain/seed";
import { LIMITS, type Exercise } from "@/domain/types";
import { guideVideoSrc } from "@/domain/videos";
import { addSet, readField, type EntryDraft } from "@/domain/workout";
import { CategoryChip } from "./CategoryChip";
import { limitText, NumberField, RepsRow, TimedRow, WeightedRow } from "./SetRow";

type Props = {
  entry: EntryDraft;
  exercise: Exercise | undefined;
  onChange(e: EntryDraft): void;
  onRemove(): void;
};

// 세트 배열의 i번째를 바꾸거나 지운 새 종목 초안을 만든다
function replaceSet<E extends { sets: S[] }, S>(entry: E, i: number, next: S): E {
  return { ...entry, sets: entry.sets.map((x, j) => (j === i ? next : x)) };
}
function removeSet<E extends { sets: unknown[] }>(entry: E, i: number): E {
  return { ...entry, sets: entry.sets.filter((_, j) => j !== i) };
}

export function EntryCard({ entry, exercise, onChange, onRemove }: Props) {
  const [guideOpen, setGuideOpen] = useState(false);
  const guide = exercise ? getGuide(exercise.id) : undefined;
  const videoSrc = exercise ? guideVideoSrc(exercise.id) : undefined;

  return (
    <section className="rounded-2xl bg-surface p-4">
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

      {guideOpen && guide && (
        <div className="mt-1 rounded-xl bg-bg p-3 text-sm leading-relaxed">
          {videoSrc && <GuideVideo src={videoSrc} />}
          <p>
            <b>{guide.target}</b>. {guide.tip}
          </p>
          {exercise?.category === "stretching" && <p className="mt-1 text-muted">{STRETCH_NOTE}</p>}
          <p className="mt-1 text-muted">{GUIDE_NOTE}</p>
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

/**
 * 따라하기 영상. 패널이 열릴 때 생기며 소리 없이 반복 재생되고, 패널이 닫히면 요소가 사라져 멈춘다.
 * autoPlay 속성 대신 effect에서 재생해 '동작 줄이기' 설정이면 재생하지 않는다.
 */
function GuideVideo({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    // React는 muted를 HTML 속성이 아니라 프로퍼티로만 둔다. iOS 자동재생 조건(무음)을 확실히 하려고 직접 켠다.
    video.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // 저전력 모드 등으로 자동재생이 막히면 컨트롤로 재생하면 되므로 거절은 무시한다
    video.play().catch(() => {});
  }, []);
  return (
    <video
      ref={ref}
      src={src}
      muted
      loop
      playsInline
      controls
      preload="metadata"
      className="mb-2 aspect-square w-full rounded-lg bg-surface"
    />
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
