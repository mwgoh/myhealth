import { Composition } from "remotion";
import { VIDEO_EXERCISES } from "./exercises";
import { FPS, SIZE } from "./layout";
import { totalFrames } from "./scenes/counter";
import { ExerciseVideo } from "./scenes/ExerciseVideo";
import { CELL, Sheet, SHEET_COLUMNS, SHEET_ROWS } from "./scenes/Sheet";

// 자세 확인 시트: 종목 SHEET_ROWS개씩 한 장
const sheets: string[][] = [];
for (let i = 0; i < VIDEO_EXERCISES.length; i += SHEET_ROWS) {
  sheets.push(VIDEO_EXERCISES.slice(i, i + SHEET_ROWS).map((d) => d.id));
}

/** 종목마다 Composition 하나(id는 seed ID), 그리고 자세 확인 시트(id는 sheet-01부터) */
export function Root() {
  return (
    <>
      {VIDEO_EXERCISES.map((def) => (
        <Composition
          key={def.id}
          id={def.id}
          component={ExerciseVideo}
          durationInFrames={totalFrames(def.timing)}
          fps={FPS}
          width={SIZE}
          height={SIZE}
          defaultProps={{ id: def.id }}
        />
      ))}
      {sheets.map((ids, i) => (
        <Composition
          key={`sheet-${i}`}
          id={`sheet-${String(i + 1).padStart(2, "0")}`}
          component={Sheet}
          durationInFrames={1}
          fps={FPS}
          width={CELL * SHEET_COLUMNS}
          height={CELL * ids.length}
          defaultProps={{ ids }}
        />
      ))}
    </>
  );
}
