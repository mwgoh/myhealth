import { SEED_EXERCISES } from "./seed";

/**
 * 따라하기 영상이 있는 종목. 기본 종목 42개 모두 영상이 있고, 직접 추가한 종목은 없다.
 * 파일은 public/videos/<id>.mp4이고 video/ 프로젝트에서 만든다(videos.test.ts가 목록과 파일이 일치하는지 확인).
 */
export const GUIDE_VIDEOS: ReadonlySet<string> = new Set(SEED_EXERCISES.map((e) => e.id));

export function guideVideoSrc(exerciseId: string): string | undefined {
  return GUIDE_VIDEOS.has(exerciseId) ? `/videos/${exerciseId}.mp4` : undefined;
}
