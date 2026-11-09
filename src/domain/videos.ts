/** 따라하기 영상이 있는 기본 종목. 파일은 public/videos/<id>.mp4이고 video/ 프로젝트에서 만든다. */
export const GUIDE_VIDEOS: ReadonlySet<string> = new Set([
  "seed-squat",
  "seed-push-up",
  "seed-plank",
  "seed-hamstring-stretch",
  "seed-jump-rope",
]);

export function guideVideoSrc(exerciseId: string): string | undefined {
  return GUIDE_VIDEOS.has(exerciseId) ? `/videos/${exerciseId}.mp4` : undefined;
}
