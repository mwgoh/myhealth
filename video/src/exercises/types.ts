import type { Pose, Vec } from "../figure/geometry";
import type { Timing } from "../scenes/counter";

export type Prop =
  | { kind: "barbell"; center: Vec }
  | { kind: "rope"; hand: Vec; ctrl: Vec; apex: Vec };

export type ExerciseVideoDef = {
  /** 앱의 seed ID. 영상 파일 이름과 Composition id로도 쓴다 */
  id: string;
  timing: Timing;
  /** 본 동작 프레임(0부터)의 자세 */
  pose(frame: number): Pose;
  prop?(frame: number, pose: Pose): Prop;
};
