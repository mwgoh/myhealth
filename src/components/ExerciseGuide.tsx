"use client";

import { useEffect, useRef } from "react";
import { GUIDE_NOTE, getGuide, STRETCH_NOTE } from "@/domain/seed";
import type { Exercise } from "@/domain/types";
import { guideVideoSrc } from "@/domain/videos";

/** 가이드(영상·핵심 포인트)가 있는 종목인가. 기본 종목만 있다. */
export const hasGuide = (exerciseId: string): boolean => getGuide(exerciseId) !== undefined;

/**
 * 종목 가이드 패널: 따라하기 영상, 주요 부위와 핵심 포인트, 공통 안내.
 * 편집 화면의 ⓘ, 종목 선택 창의 ▶, 설정의 종목 이름이 함께 쓴다. 가이드가 없는 종목이면 아무것도 그리지 않는다.
 */
export function ExerciseGuide({ exercise }: { exercise: Exercise }) {
  const guide = getGuide(exercise.id);
  if (!guide) return null;
  const videoSrc = guideVideoSrc(exercise.id);
  return (
    <div className="rounded-xl bg-bg p-3 text-sm leading-relaxed">
      {videoSrc && <GuideVideo src={videoSrc} />}
      <p>
        <b>{guide.target}</b>. {guide.tip}
      </p>
      {exercise.category === "stretching" && <p className="mt-1 text-muted">{STRETCH_NOTE}</p>}
      <p className="mt-1 text-muted">{GUIDE_NOTE}</p>
    </div>
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
