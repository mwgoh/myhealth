import { Composition } from "remotion";
import { VIDEO_EXERCISES } from "./exercises";
import { FPS, SIZE } from "./layout";
import { totalFrames } from "./scenes/counter";
import { ExerciseVideo } from "./scenes/ExerciseVideo";

/** 종목마다 Composition 하나. id는 seed ID다. */
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
    </>
  );
}
