import type { Pose } from "../figure/geometry";
import type { Timing } from "../scenes/counter";
import type { Shape } from "./shapes";

export type ExerciseVideoDef = {
  /** 앱의 seed ID. 영상 파일 이름과 Composition id로도 쓴다 */
  id: string;
  timing: Timing;
  /** 본 동작 프레임(0부터)의 자세 */
  pose(frame: number): Pose;
  /** 기구·소품. 기본은 사람 그림 뒤에 그린다 */
  props?(frame: number, pose: Pose): Shape[];
  /** front: 앞에서 본 그림. 양쪽 팔다리를 같은 진하기로 그린다 */
  view?: "side" | "front";
  /** 팔이 몸 뒤로 넘어가 가려지는 프레임(러시안 트위스트) */
  armsBehind?(frame: number): boolean;
  /** false면 바닥선을 그리지 않는다(수영) */
  floor?: boolean;
  /** 화면에 그릴 때의 배율. 키가 큰 동작을 제목·카운터와 겹치지 않게 줄인다. 바닥선 기준으로 줄인다 */
  scale?: number;
  /** 자세 확인 시트에 그릴 본 동작 프레임 3개. 없으면 타이밍으로 고른다 */
  keyFrames?: [number, number, number];
};
