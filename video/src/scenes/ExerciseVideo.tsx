import type { CSSProperties } from "react";
import { AbsoluteFill, interpolate, Sequence, useCurrentFrame, useVideoConfig } from "remotion";
import type { Category } from "../../../src/domain/types";
import { getGuide, SEED_EXERCISES } from "../app-data";
import { VIDEO_EXERCISES } from "../exercises";
import type { ExerciseVideoDef } from "../exercises/types";
import { CATEGORY_COLOR, CATEGORY_LABEL, COLOR, FONT, SIZE } from "../layout";
import { counterAt, DONE_FRAMES, mainFrames, TITLE_FRAMES } from "./counter";
import { StageContent } from "./Stage";

export type ExerciseVideoProps = { id: string };

type Info = { name: string; category: Category; target: string; tip: string };

const MARGIN = 48;

function lookup(id: string): { def: ExerciseVideoDef; info: Info } {
  const def = VIDEO_EXERCISES.find((d) => d.id === id);
  const ex = SEED_EXERCISES.find((e) => e.id === id);
  const guide = getGuide(id);
  if (!def || !ex || !guide) throw new Error(`영상 정의가 없는 종목입니다: ${id}`);
  return { def, info: { name: ex.name, category: ex.category, target: guide.target, tip: guide.tip } };
}

function useFadeIn(frames = 10): number {
  return interpolate(useCurrentFrame(), [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
}

function Chip({ category, size }: { category: Category; size: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: size * 0.4, fontSize: size, fontWeight: 700 }}>
      <span style={{ width: size * 0.6, height: size * 0.6, borderRadius: "50%", background: CATEGORY_COLOR[category] }} />
      {CATEGORY_LABEL[category]}
    </span>
  );
}

const centered: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 };

function TitleScene({ info }: { info: Info }) {
  return (
    <AbsoluteFill style={{ ...centered, opacity: useFadeIn() }}>
      <div style={{ fontSize: 76, fontWeight: 800 }}>{info.name}</div>
      <Chip category={info.category} size={34} />
      <div style={{ fontSize: 34, color: COLOR.muted }}>{info.target}</div>
    </AbsoluteFill>
  );
}

function DoneScene({ info }: { info: Info }) {
  return (
    <AbsoluteFill style={{ ...centered, opacity: useFadeIn() }}>
      <div style={{ fontSize: 96, fontWeight: 800 }}>완료</div>
      <div style={{ fontSize: 40, color: COLOR.muted }}>{info.name}</div>
    </AbsoluteFill>
  );
}

function MainScene({ def, info }: { def: ExerciseVideoDef; info: Info }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const counter = counterAt(def.timing, frame, fps);
  const color = CATEGORY_COLOR[info.category];

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: MARGIN, top: 36, right: MARGIN }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 44, fontWeight: 800 }}>{info.name}</span>
          <Chip category={info.category} size={26} />
        </div>
        <div style={{ fontSize: 26, color: COLOR.muted, marginTop: 4 }}>{info.target}</div>
      </div>

      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ position: "absolute", inset: 0 }}>
        <StageContent def={def} frame={frame} accent={color} />
      </svg>

      <div
        style={{
          position: "absolute",
          right: MARGIN,
          top: 250,
          width: 250,
          textAlign: "right",
          fontSize: 76,
          fontWeight: 800,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {counter.text}
      </div>

      <div style={{ position: "absolute", left: MARGIN, right: MARGIN, top: 574, height: 12, borderRadius: 6, background: COLOR.track }}>
        <div style={{ width: `${counter.progress * 100}%`, height: "100%", borderRadius: 6, background: color }} />
      </div>

      <div
        style={{
          position: "absolute",
          left: MARGIN,
          right: MARGIN,
          top: 606,
          fontSize: 28,
          lineHeight: 1.4,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {info.tip}
      </div>
    </AbsoluteFill>
  );
}

/** 제목 → 본 동작 → 완료 */
export function ExerciseVideo({ id }: ExerciseVideoProps) {
  const { def, info } = lookup(id);
  const main = mainFrames(def.timing);
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.bg, color: COLOR.ink, fontFamily: FONT }}>
      <Sequence name="제목" durationInFrames={TITLE_FRAMES}>
        <TitleScene info={info} />
      </Sequence>
      <Sequence name="본 동작" from={TITLE_FRAMES} durationInFrames={main}>
        <MainScene def={def} info={info} />
      </Sequence>
      <Sequence name="완료" from={TITLE_FRAMES + main} durationInFrames={DONE_FRAMES}>
        <DoneScene info={info} />
      </Sequence>
    </AbsoluteFill>
  );
}
