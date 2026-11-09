import { hamstring } from "./hamstring";
import { jumpRope } from "./jumprope";
import { plank } from "./plank";
import { pushup } from "./pushup";
import { squat } from "./squat";
import type { ExerciseVideoDef } from "./types";

/** 영상을 만드는 종목. 순서는 분류 순서(근력·맨몸·코어·스트레칭·유산소)다. */
export const VIDEO_EXERCISES: readonly ExerciseVideoDef[] = [squat, pushup, plank, hamstring, jumpRope];
