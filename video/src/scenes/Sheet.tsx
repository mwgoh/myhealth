import { AbsoluteFill } from "remotion";
import { SEED_EXERCISES } from "../app-data";
import { VIDEO_EXERCISES } from "../exercises";
import { counterBoxOf, keyFramesOf } from "../exercises/helpers";
import { CATEGORY_COLOR, COLOR, FONT, HEADER_BOTTOM, SIZE } from "../layout";
import { StageContent } from "./Stage";

/** 시트 한 칸의 크기. 720 화면을 절반으로 줄여 그린다 */
export const CELL = 360;
export const SHEET_COLUMNS = 3;
export const SHEET_ROWS = 4;

export type SheetProps = { ids: string[] };

/**
 * 자세 확인 시트: 종목마다 한 줄에 본 동작의 주요 프레임 3개를 그린다.
 * 점선은 제목 영역과 카운터 영역이다. 사람 그림이 들어가면 화면 글자와 겹친다.
 */
export function Sheet({ ids }: SheetProps) {
  return (
    <AbsoluteFill style={{ background: COLOR.bg, fontFamily: FONT }}>
      {ids.map((id, row) => {
        const def = VIDEO_EXERCISES.find((d) => d.id === id);
        const ex = SEED_EXERCISES.find((e) => e.id === id);
        if (!def || !ex) throw new Error(`영상 정의가 없는 종목입니다: ${id}`);
        const box = counterBoxOf(def);
        return keyFramesOf(def).map((frame, col) => (
          <div
            key={`${id}-${col}`}
            style={{ position: "absolute", left: col * CELL, top: row * CELL, width: CELL, height: CELL, outline: `1px solid ${COLOR.track}` }}
          >
            <svg width={CELL} height={CELL} viewBox={`0 0 ${SIZE} ${SIZE}`}>
              <rect x={48} y={30} width={SIZE - 96} height={HEADER_BOTTOM - 30} fill="none" stroke={COLOR.hub} strokeDasharray="8 8" />
              <rect
                x={box.left}
                y={box.top}
                width={box.right - box.left}
                height={box.bottom - box.top}
                fill="none"
                stroke={COLOR.hub}
                strokeDasharray="8 8"
              />
              <StageContent def={def} frame={frame} accent={CATEGORY_COLOR[ex.category]} />
            </svg>
            <div style={{ position: "absolute", left: 10, top: 8, fontSize: 20, color: COLOR.muted }}>
              {ex.name} · {frame}
            </div>
          </div>
        ));
      })}
    </AbsoluteFill>
  );
}
